import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "../../api/api";
import type {
  EventStatus,
  IJudicialEvent,
  ICreateEventPayload,
  IUpdateEventPayload,
} from "../../interfaces/events.interface";
import type { RootState } from "../store";
import { AxiosError } from "axios";

interface BackendError {
  message: string;
  status?: string;
}

interface EventsState {
  events: IJudicialEvent[];
  loading: boolean;
  error: string | null;
  currentFilter: EventStatus;
}

const initialState: EventsState = {
  events: [],
  loading: false,
  error: null,
  currentFilter: "ALL",
};

/**
 * Fetch events — Uses server-side status filtering based on Nairobi Timezone
 */
export const fetchEvents = createAsyncThunk(
  "events/fetchEvents",
  async (status: EventStatus = "ALL", { rejectWithValue }) => {
    try {
      const response = await api.get(`/events/get`, {
        params: { status },
        withCredentials: true,
      });
      // The backend now provides 'current_status' based on Africa/Nairobi offset
      return response.data.data as IJudicialEvent[];
    } catch (err) {
      const error = err as AxiosError<BackendError>;
      return rejectWithValue(
        error.response?.data?.message || "Failed to retrieve judicial events",
      );
    }
  },
);

/**
 * Create a new event — Normalizes dates to ISO strings before sending
 */
export const createEvent = createAsyncThunk(
  "events/createEvent",
  async (eventData: ICreateEventPayload, { rejectWithValue }) => {
    try {
      // Ensure dates are sent in a standardized format
      const payload = {
        ...eventData,
        start_time: new Date(eventData.start_time).toISOString(),
        end_time: new Date(eventData.end_time).toISOString(),
      };

      const response = await api.post(`/events/create`, payload, {
        withCredentials: true,
      });
      return response.data.data as IJudicialEvent;
    } catch (err) {
      const error = err as AxiosError<BackendError>;
      return rejectWithValue(
        error.response?.data?.message || "Error creating event",
      );
    }
  },
);

/**
 * Update an existing event
 */
export const updateEvent = createAsyncThunk(
  "events/updateEvent",
  async (eventData: IUpdateEventPayload, { rejectWithValue }) => {
    try {
      const { id, ...fields } = eventData;
      
      // Normalize dates if they are being updated
      const payload = {
        ...fields,
        ...(fields.start_time && { start_time: new Date(fields.start_time).toISOString() }),
        ...(fields.end_time && { end_time: new Date(fields.end_time).toISOString() }),
      };

      const response = await api.patch(`/events/update/${id}`, payload, {
        withCredentials: true,
      });
      return response.data.data as IJudicialEvent;
    } catch (err) {
      const error = err as AxiosError<BackendError>;
      return rejectWithValue(
        error.response?.data?.message || "Error updating event",
      );
    }
  },
);

/**
 * Delete an event
 */
export const deleteEvent = createAsyncThunk(
  "events/deleteEvent",
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/events/delete/${id}`, {
        withCredentials: true,
      });
      return id;
    } catch (err) {
      const error = err as AxiosError<BackendError>;
      return rejectWithValue(
        error.response?.data?.message || "Error deleting event",
      );
    }
  },
);

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<EventStatus>) => {
      state.currentFilter = action.payload;
    },
    clearEventError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create
      .addCase(createEvent.fulfilled, (state, action) => {
        // If we are currently filtered to 'PAST', the new 'UPCOMING' event shouldn't appear
        // but unshift is safe for 'ALL' or 'UPCOMING' filters.
        state.events.unshift(action.payload);
      })

      // Update
      .addCase(updateEvent.fulfilled, (state, action) => {
        const index = state.events.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          // Replace with the updated object (including the new current_status from DB)
          state.events[index] = action.payload;
        }
      })

      // Delete
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.events = state.events.filter((e) => e.id !== action.payload);
      });
  },
});

export const { setFilter, clearEventError } = eventsSlice.actions;

export const selectAllEvents = (state: RootState) => state.events.events;
export const selectEventsLoading = (state: RootState) => state.events.loading;
export const selectCurrentFilter = (state: RootState) => state.events.currentFilter;

export default eventsSlice.reducer;