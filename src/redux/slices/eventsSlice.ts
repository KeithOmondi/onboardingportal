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
 * Fetch events — filtered by status on the server
 */
export const fetchEvents = createAsyncThunk(
  "events/fetchEvents",
  async (status: EventStatus = "ALL", { rejectWithValue }) => {
    try {
      const response = await api.get(`/events/get`, {
        params: { status },
        withCredentials: true,
      });
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
 * Create a new event — sends start_time and end_time
 */
export const createEvent = createAsyncThunk(
  "events/createEvent",
  async (eventData: ICreateEventPayload, { rejectWithValue }) => {
    try {
      const response = await api.post(`/events/create`, eventData, {
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
 * Update an existing event — sends only changed fields + id
 */
export const updateEvent = createAsyncThunk(
  "events/updateEvent",
  async (eventData: IUpdateEventPayload, { rejectWithValue }) => {
    try {
      const { id, ...fields } = eventData;
      const response = await api.patch(`/events/update/${id}`, fields, {
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
 * Delete an event by ID
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
      // ── Fetch ────────────────────────────────────────────────
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchEvents.fulfilled,
        (state, action: PayloadAction<IJudicialEvent[]>) => {
          state.loading = false;
          state.events = action.payload;
        },
      )
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ── Create ───────────────────────────────────────────────
      .addCase(createEvent.pending, (state) => {
        state.error = null;
      })
      .addCase(
        createEvent.fulfilled,
        (state, action: PayloadAction<IJudicialEvent>) => {
          state.events.unshift(action.payload);
        },
      )
      .addCase(createEvent.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // ── Update ───────────────────────────────────────────────
      .addCase(updateEvent.pending, (state) => {
        state.error = null;
      })
      .addCase(
        updateEvent.fulfilled,
        (state, action: PayloadAction<IJudicialEvent>) => {
          const index = state.events.findIndex(
            (e) => e.id === action.payload.id,
          );
          if (index !== -1) {
            state.events[index] = action.payload;
          }
        },
      )
      .addCase(updateEvent.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // ── Delete ───────────────────────────────────────────────
      .addCase(deleteEvent.pending, (state) => {
        state.error = null;
      })
      .addCase(
        deleteEvent.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.events = state.events.filter((e) => e.id !== action.payload);
        },
      )
      .addCase(deleteEvent.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setFilter, clearEventError } = eventsSlice.actions;

// Selectors
export const selectAllEvents = (state: RootState) => state.events.events;
export const selectEventsLoading = (state: RootState) => state.events.loading;
export const selectEventsError = (state: RootState) => state.events.error;
export const selectCurrentFilter = (state: RootState) =>
  state.events.currentFilter;

export default eventsSlice.reducer;
