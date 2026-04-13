import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/api";
import type { EventStatus, IJudicialEvent } from "../../interfaces/events.interface";
import type { RootState } from "../store";
import { AxiosError } from "axios";

// Define the shape of your backend error response
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
 * Fetch events
 */
export const fetchEvents = createAsyncThunk(
  "events/fetchEvents",
  async (status: EventStatus = "ALL", { rejectWithValue }) => {
    try {
      const response = await api.get(`/events/get`, {
        params: { status },
        withCredentials: true,
      });
      return response.data.data;
    } catch (err) {
      const error = err as AxiosError<BackendError>;
      return rejectWithValue(
        error.response?.data?.message || "Failed to retrieve judicial events"
      );
    }
  }
);

/**
 * Create a new event
 */
export const createEvent = createAsyncThunk(
  "events/createEvent",
  async (eventData: Partial<IJudicialEvent>, { rejectWithValue }) => {
    try {
      const response = await api.post(`/events/create`, eventData, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (err) {
      const error = err as AxiosError<BackendError>;
      return rejectWithValue(error.response?.data?.message || "Error creating event");
    }
  }
);

/**
 * Update an existing event
 */
export const updateEvent = createAsyncThunk(
  "events/updateEvent",
  async (eventData: Partial<IJudicialEvent>, { rejectWithValue }) => {
    try {
      const response = await api.post(`/events/update`, eventData, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (err) {
      const error = err as AxiosError<BackendError>;
      return rejectWithValue(error.response?.data?.message || "Error updating event");
    }
  }
);

/**
 * Delete an event
 */
export const deleteEvent = createAsyncThunk(
  "events/deleteEvent",
  async (id: number, { rejectWithValue }) => {
    try {
      await api.post(`/events/delete`, { id }, {
        withCredentials: true,
      });
      return id; // Return ID to remove from state
    } catch (err) {
      const error = err as AxiosError<BackendError>;
      return rejectWithValue(error.response?.data?.message || "Error deleting event");
    }
  }
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
      // Fetch Events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<IJudicialEvent[]>) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Event
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<IJudicialEvent>) => {
        state.events.unshift(action.payload);
      })
      // Update Event
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<IJudicialEvent>) => {
        const index = state.events.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      // Delete Event
      .addCase(deleteEvent.fulfilled, (state, action: PayloadAction<number>) => {
        state.events = state.events.filter((e) => e.id !== action.payload);
      });
  },
});

export const { setFilter, clearEventError } = eventsSlice.actions;
export const selectAllEvents = (state: RootState) => state.events.events;
export const selectEventsLoading = (state: RootState) => state.events.loading;

export default eventsSlice.reducer;