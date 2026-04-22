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
 * Fetch the single shared emergency note
 */
export const fetchEmergencyNote = createAsyncThunk<
  IEmergencyNote | null,
  void,
  { rejectValue: string }
>("emergency/fetchNote", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<IEmergencyResponse>("/emergency/get");
    return data.data;
  } catch (err) {
    const error = err as AxiosError<IApiError>;
    return rejectWithValue(error.response?.data?.message || "Failed to fetch note");
  }
});

/**
 * Create or Update the note (Upsert)
 */
export const upsertEmergencyNote = createAsyncThunk<
  IEmergencyNote | null,
  string,
  { rejectValue: string }
>("emergency/upsertNote", async (note, { rejectWithValue }) => {
  try {
    const { data } = await api.patch<IEmergencyResponse>("/emergency/update", { note });
    return data.data;
  } catch (err) {
    const error = err as AxiosError<IApiError>;
    return rejectWithValue(error.response?.data?.message || "Failed to save note");
  }
});

/**
 * Delete / Clear the emergency note
 */
export const deleteEmergencyNote = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("emergency/deleteNote", async (_, { rejectWithValue }) => {
  try {
    await api.delete("/emergency/delete");
  } catch (err) {
    const error = err as AxiosError<IApiError>;
    return rejectWithValue(error.response?.data?.message || "Failed to delete note");
  }
});

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

      // Upsert Note (Patch)
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
        state.error = action.payload ?? "Failed to update note";
      })

      // Delete Note
      .addCase(deleteEmergencyNote.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(deleteEmergencyNote.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.note = null; // Important: Clear the note from state
      })
      .addCase(deleteEmergencyNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to delete note";
      });
  },
});

export const { clearEmergencyError, resetEmergencyStatus } = emergencySlice.actions;
export default emergencySlice.reducer;