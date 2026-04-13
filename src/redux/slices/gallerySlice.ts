import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
  type AnyAction, // For the matcher predicate
} from "@reduxjs/toolkit";
import {
  type IGalleryAlbum,
  type IGalleryMedia,
} from "../../interfaces/gallery.interface";
import api from "../../api/api";
import { AxiosError } from "axios";

interface BackendError {
  message: string;
}

export interface AlbumDetails extends IGalleryAlbum {
  media: IGalleryMedia[];
}

interface GalleryState {
  albums: IGalleryAlbum[];
  currentAlbum: AlbumDetails | null;
  loading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: GalleryState = {
  albums: [],
  currentAlbum: null,
  loading: false,
  error: null,
  message: null,
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchAlbums = createAsyncThunk(
  "gallery/fetchAlbums",
  async (category: string | undefined, { rejectWithValue }) => {
    try {
      const url =
        category && category !== "All"
          ? `/gallery/albums?category=${encodeURIComponent(category)}`
          : `/gallery/albums`;
      const { data } = await api.get<{ data: IGalleryAlbum[] }>(url);
      return data.data;
    } catch (error) {
      const err = error as AxiosError<BackendError>;
      return rejectWithValue(err.response?.data?.message || "Failed to fetch albums");
    }
  }
);

export const fetchAlbumDetails = createAsyncThunk(
  "gallery/fetchAlbumDetails",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const { data } = await api.get<{ data: AlbumDetails }>(`/gallery/albums/${id}`);
      return data.data;
    } catch (error) {
      const err = error as AxiosError<BackendError>;
      return rejectWithValue(err.response?.data?.message || "Failed to fetch album details");
    }
  }
);

export const createNewAlbum = createAsyncThunk(
  "gallery/createAlbum",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const { data } = await api.post<{ data: IGalleryAlbum }>(`/gallery/albums`, formData, config);
      return data.data;
    } catch (error) {
      const err = error as AxiosError<BackendError>;
      return rejectWithValue(err.response?.data?.message || "Failed to create album");
    }
  }
);

export const addMediaToAlbum = createAsyncThunk(
  "gallery/addMedia",
  async ({ id, formData }: { id: string | number; formData: FormData }, { rejectWithValue }) => {
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const { data } = await api.post<{ message: string }>(`/gallery/albums/${id}/media`, formData, config);
      return data.message;
    } catch (error) {
      const err = error as AxiosError<BackendError>;
      return rejectWithValue(err.response?.data?.message || "Failed to upload media");
    }
  }
);

export const deleteAlbum = createAsyncThunk(
  "gallery/deleteAlbum",
  async (id: string | number, { rejectWithValue }) => {
    try {
      await api.delete(`/gallery/albums/${id}`);
      return id;
    } catch (error) {
      const err = error as AxiosError<BackendError>;
      return rejectWithValue(err.response?.data?.message || "Failed to delete album");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const gallerySlice = createSlice({
  name: "gallery",
  initialState,
  reducers: {
    clearGalleryErrors: (state) => { state.error = null; },
    clearGalleryMessage: (state) => { state.message = null; },
    resetCurrentAlbum: (state) => { state.currentAlbum = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlbums.fulfilled, (state, action: PayloadAction<IGalleryAlbum[]>) => {
        state.loading = false;
        state.albums = action.payload;
      })
      .addCase(fetchAlbumDetails.fulfilled, (state, action: PayloadAction<AlbumDetails>) => {
        state.loading = false;
        state.currentAlbum = action.payload;
      })
      .addCase(createNewAlbum.fulfilled, (state, action: PayloadAction<IGalleryAlbum>) => {
        state.loading = false;
        state.albums.unshift(action.payload);
        state.message = "Album created successfully";
      })
      .addCase(addMediaToAlbum.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.message = action.payload;
      })
      .addCase(deleteAlbum.fulfilled, (state, action: PayloadAction<string | number>) => {
        state.loading = false;
        state.albums = state.albums.filter((album) => album.id.toString() !== action.payload.toString());
        state.message = "Album deleted successfully";
      })

      // ── Scoped Matchers ───────────────────────────────────────────────────
      .addMatcher(
        (action: AnyAction) => action.type.startsWith("gallery/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action: AnyAction) => action.type.startsWith("gallery/") && action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          // action.payload comes from rejectWithValue
          state.error = action.payload || "An unexpected error occurred";
        }
      );
  },
});

export const { clearGalleryErrors, clearGalleryMessage, resetCurrentAlbum } = gallerySlice.actions;
export default gallerySlice.reducer;