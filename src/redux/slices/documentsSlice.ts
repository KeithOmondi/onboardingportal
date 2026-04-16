import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { 
  ICreateDocumentPayload, 
  IDocument, 
  IDocumentQuery, 
  IDocumentState 
} from "../../interfaces/documents.interface";
import api from "../../api/api";
import { AxiosError } from "axios";

// Helper type for API error responses
interface ApiErrorResponse {
  message: string;
}

const initialState: IDocumentState = {
  documents: [],
  loading: false,
  uploading: false,
  error: null,
  success: false,
};

// ── Actions ──────────────────────────────────────────────────────────────────

export const fetchDocuments = createAsyncThunk(
  "documents/fetchAll",
  async (query: IDocumentQuery | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get("/documents", { params: query });
      return response.data.data;
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      return rejectWithValue(err.response?.data?.message || "Failed to fetch documents");
    }
  }
);

export const uploadDocument = createAsyncThunk(
  "documents/upload",
  async (payload: ICreateDocumentPayload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("title", payload.title);
      if (payload.description) formData.append("description", payload.description);
      if (payload.document_type) formData.append("document_type", payload.document_type);
      formData.append("file", payload.file);

      const response = await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      return rejectWithValue(err.response?.data?.message || "Upload failed");
    }
  }
);

export const deleteDocument = createAsyncThunk(
  "documents/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/documents/${id}`);
      return id;
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      return rejectWithValue(err.response?.data?.message || "Delete failed");
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    clearDocumentStatus: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDocuments.fulfilled, (state, action: PayloadAction<IDocument[]>) => {
        state.loading = false;
        state.documents = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(uploadDocument.pending, (state) => {
        state.uploading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(uploadDocument.fulfilled, (state, action: PayloadAction<IDocument>) => {
        state.uploading = false;
        state.success = true;
        state.documents.unshift(action.payload);
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteDocument.fulfilled, (state, action: PayloadAction<number>) => {
        state.documents = state.documents.filter((doc) => doc.id !== action.payload);
      });
  },
});

export const { clearDocumentStatus } = documentsSlice.actions;
export default documentsSlice.reducer;