import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api"; 

/* ─── TYPES ────────────────────────────────────────────────────────── */

interface StreamFileState {
  blobUrl: string | null;
  loading: boolean;
  error: string | null;
}

// Fixed: This is now correctly used in the catch block
interface KnownError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

/* ─── INITIAL STATE ────────────────────────────────────────────────── */

const initialState: StreamFileState = {
  blobUrl: null,
  loading: false,
  error: null,
};

/* ─── THUNK ───────────────────────────────────────────────────────── */

export const fetchStreamFile = createAsyncThunk<
  string, 
  string | number, 
  { rejectValue: string }
>(
  "streamFile/fetch",
  async (documentId, thunkAPI) => {
    try {
      const response = await api.get<Blob>(`/documents/stream/${documentId}`, {
        responseType: "blob", 
      });

      if (response.data.type === "application/json") {
         const text = await response.data.text();
         const errorData = JSON.parse(text);
         return thunkAPI.rejectWithValue(errorData.message || "Unauthorized access");
      }

      return URL.createObjectURL(response.data);
    } catch (err) {
      // Fixed: Removed 'any' and used the KnownError interface
      const error = err as KnownError;
      
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to stream file"
      );
    }
  }
);

/* ─── SLICE ────────────────────────────────────────────────────────── */

const streamFileSlice = createSlice({
  name: "streamFile",
  initialState,
  reducers: {
    revokeBlobUrl: (state) => {
      if (state.blobUrl) {
        URL.revokeObjectURL(state.blobUrl);
      }
      state.blobUrl = null;
      state.error = null;
    },
    clearStreamError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStreamFile.pending, (state) => {
        state.loading = true;
        state.error = null;
        
        if (state.blobUrl) {
          URL.revokeObjectURL(state.blobUrl);
          state.blobUrl = null;
        }
      })
      .addCase(fetchStreamFile.fulfilled, (state, action) => {
        state.loading = false;
        state.blobUrl = action.payload;
      })
      .addCase(fetchStreamFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "An unexpected error occurred while streaming";
      });
  },
});

export const { revokeBlobUrl, clearStreamError } = streamFileSlice.actions;
export default streamFileSlice.reducer;