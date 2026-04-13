// src/redux/slices/noticeSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../api/api";
import type {
  INotice,
  IAdminNotice,
} from "../../interfaces/notices.interface";

// ── State ─────────────────────────────────────────────────────────────────────
interface NoticeState {
  notices: INotice[];
  unreadCount: number;
  adminNotices: IAdminNotice[];
  loading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: NoticeState = {
  notices: [],
  unreadCount: 0,
  adminNotices: [],
  loading: false,
  error: null,
  message: null,
};

// ── Error Helper ──────────────────────────────────────────────────────────────
const getErrorMessage = (err: unknown, defaultMsg: string): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || defaultMsg;
  }
  return defaultMsg;
};

// ── Thunks ────────────────────────────────────────────────────────────────────

// 1. Judge — fetch all active notices
export const fetchNotices = createAsyncThunk(
  "notices/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/notices/get");
      return data as { data: INotice[]; unreadCount: number };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch notices"));
    }
  }
);

// 2. Judge — mark one notice as read
export const markAsRead = createAsyncThunk(
  "notices/markAsRead",
  async (id: number, { rejectWithValue }) => {
    try {
      await api.patch(`/notices/mark/${id}/read`);
      return id;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to mark notice as read"));
    }
  }
);

// 3. Judge — mark all notices as read
export const markAllAsRead = createAsyncThunk(
  "notices/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      await api.patch("/notices/read-all");
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to mark all notices as read"));
    }
  }
);

// 4. Admin — fetch all notices with read stats
export const adminFetchNotices = createAsyncThunk(
  "notices/adminFetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/notices/admin");
      return data.data as IAdminNotice[];
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch notices"));
    }
  }
);

/**
 * 5. Admin — create notice
 * Expects FormData to handle file uploads
 */
export const createNotice = createAsyncThunk(
  "notices/create",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/notices/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data as IAdminNotice;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to create notice"));
    }
  }
);

/**
 * 6. Admin — update notice
 * Expects FormData (must include the notice 'id')
 */
export const updateNotice = createAsyncThunk(
  "notices/update",
  async ({ id, formData }: { id: number; formData: FormData }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/notices/update/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data as IAdminNotice;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to update notice"));
    }
  }
);

// 7. Admin — delete notice
export const deleteNotice = createAsyncThunk(
  "notices/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/notices/delete/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to delete notice"));
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const noticeSlice = createSlice({
  name: "notices",
  initialState,
  reducers: {
    clearNoticeError: (state) => { state.error = null; },
    clearNoticeMessage: (state) => { state.message = null; },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notices
      .addCase(fetchNotices.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNotices.fulfilled, (state, action) => {
        state.loading = false;
        state.notices = action.payload.data;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Mark as Read
      .addCase(markAsRead.fulfilled, (state, action: PayloadAction<number>) => {
        const notice = state.notices.find((n) => n.id === action.payload);
        if (notice && !notice.is_read) {
          notice.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      // Mark All as Read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notices = state.notices.map((n) => ({ ...n, is_read: true }));
        state.unreadCount = 0;
      })

      // Admin Fetch
      .addCase(adminFetchNotices.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(adminFetchNotices.fulfilled, (state, action) => {
        state.loading = false;
        state.adminNotices = action.payload;
      })
      .addCase(adminFetchNotices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create Notice
      .addCase(createNotice.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createNotice.fulfilled, (state, action) => {
        state.loading = false;
        state.adminNotices.unshift(action.payload);
        state.message = "Notice published successfully.";
      })
      .addCase(createNotice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Notice
      .addCase(updateNotice.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateNotice.fulfilled, (state, action) => {
        state.loading = false;
        state.adminNotices = state.adminNotices.map((n) =>
          n.id === action.payload.id ? action.payload : n
        );
        state.message = "Notice updated successfully.";
      })
      .addCase(updateNotice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Notice
      .addCase(deleteNotice.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteNotice.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.adminNotices = state.adminNotices.filter((n) => n.id !== action.payload);
        state.message = "Notice deleted successfully.";
      })
      .addCase(deleteNotice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearNoticeError, clearNoticeMessage } = noticeSlice.actions;
export default noticeSlice.reducer;