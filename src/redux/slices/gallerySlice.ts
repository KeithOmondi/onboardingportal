import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { IGalleryItem, IGalleryState } from "../../interfaces/gallery.interface";
import api from "../../api/api";
import axios from "axios";

const initialState: IGalleryState = {
  items: [],
  loading: false,
  error: null,
  success: false,
};

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  return error instanceof Error ? error.message : defaultMessage;
};

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchGallery = createAsyncThunk(
  "gallery/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/gallery/get`);
      return data.data; 
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch gallery"));
    }
  }
);

/**
 * Updated to handle multiple uploads
 * Payload returned from backend is now IGalleryItem[]
 */
export const createGalleryItems = createAsyncThunk(
  "gallery/create",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/gallery/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Backend returns { status: "success", data: [...] }
      return data.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Upload failed"));
    }
  }
);

export const deleteGalleryItem = createAsyncThunk(
  "gallery/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/gallery/delete/${id}`);
      return id;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Delete failed"));
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const gallerySlice = createSlice({
  name: "gallery",
  initialState,
  reducers: {
    clearGalleryStatus: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGallery.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGallery.fulfilled, (state, action: PayloadAction<IGalleryItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchGallery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createGalleryItems.pending, (state) => {
        state.loading = true;
        state.success = false;
      })
      .addCase(createGalleryItems.fulfilled, (state, action: PayloadAction<IGalleryItem[]>) => {
        state.loading = false;
        state.success = true;
        // Logic fix: Use unshift with spread to add all new items to the top
        state.items.unshift(...action.payload);
      })
      .addCase(createGalleryItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteGalleryItem.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export const { clearGalleryStatus } = gallerySlice.actions;
export default gallerySlice.reducer;