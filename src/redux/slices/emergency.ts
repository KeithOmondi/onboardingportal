import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  type IEmergencyNote,
  type IEmergencyResponse,
  type IEmergencyState,
  type IApiError,
} from "../../interfaces/emergency.interface";
import api from "../../api/api";
import { AxiosError } from "axios";

const initialState: IEmergencyState = {
  note: null,
  loading: false,
  error: null,
  success: false,
};

/**
 * Fetch the single shared emergency note (Judges / Admins)
 */
export const fetchEmergencyNote = createAsyncThunk<
  IEmergencyNote | null,
  void,
  { rejectValue: string }
>(
  "emergency/fetchNote",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<IEmergencyResponse>("/emergency/get");
      return data.data;
    } catch (err) {
      const error = err as AxiosError<IApiError>;
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch note"
      );
    }
  }
);

/**
 * Upsert the single shared emergency note (Admin only)
 */
export const upsertEmergencyNote = createAsyncThunk<
  IEmergencyNote | null,
  string,
  { rejectValue: string }
>(
  "emergency/upsertNote",
  async (note, { rejectWithValue }) => {
    try {
      const { data } = await api.patch<IEmergencyResponse>("/emergency/update", { note });
      return data.data;
    } catch (err) {
      const error = err as AxiosError<IApiError>;
      return rejectWithValue(
        error.response?.data?.message || "Failed to save note"
      );
    }
  }
);

const emergencySlice = createSlice({
  name: "emergency",
  initialState,
  reducers: {
    clearEmergencyError: (state) => {
      state.error = null;
    },
    resetEmergencyStatus: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Note
      .addCase(fetchEmergencyNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmergencyNote.fulfilled, (state, action) => {
        state.loading = false;
        state.note = action.payload;
      })
      .addCase(fetchEmergencyNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "An unknown error occurred";
      })
      // Upsert Note
      .addCase(upsertEmergencyNote.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(upsertEmergencyNote.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.note = action.payload;
      })
      .addCase(upsertEmergencyNote.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload ?? "An unknown error occurred";
      });
  },
});

export const { clearEmergencyError, resetEmergencyStatus } = emergencySlice.actions;
export default emergencySlice.reducer;