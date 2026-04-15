import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import api from "../api/api";
import type { RootState } from "../redux/store";

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
 * Fetch events with dynamic status filtering
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
 * Update an existing event - Adjusted to use ID in URL path
 */
export const updateEvent = createAsyncThunk(
  "events/updateEvent",
  async ({ id, ...eventData }: Partial<IJudicialEvent>, { rejectWithValue }) => {
    try {
      const response = await api.put(`/events/update/${id}`, eventData, {
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
 * Delete an event - Adjusted to use DELETE method and path param
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
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<IJudicialEvent>) => {
        // Unshift adds it to the top so it's immediately visible
        state.events.unshift(action.payload);
      })
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<IJudicialEvent>) => {
        const index = state.events.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
          // Re-sort if the time update changed its "is_past" status
          state.events.sort((a, b) => Number(a.is_past) - Number(b.is_past));
        }
      })
      .addCase(deleteEvent.fulfilled, (state, action: PayloadAction<number>) => {
        state.events = state.events.filter((e) => e.id !== action.payload);
      });
  },
});

export const { setFilter, clearEventError } = eventsSlice.actions;
export const selectAllEvents = (state: RootState) => state.events.events;
export const selectEventsLoading = (state: RootState) => state.events.loading;

export default eventsSlice.reducer;

// ── Updated Interface ──────────────────────────────────────────────────────

export type EventStatus = "UPCOMING" | "PAST" | "ONGOING" | "ALL";

export interface IJudicialEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  is_virtual: boolean;
  organizer: string;
  created_at?: string;
  updated_at?: string;
  // New Virtual Fields from Backend
  is_past: boolean; 
  current_status: "UPCOMING" | "PAST" | "ONGOING";
}