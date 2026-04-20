import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type {
  IAdminRegistryRow,
  IGuest,
  IRegistrationResponse,
  RegistrationStatus,
} from "../../interfaces/guests.interface";
import api from "../../api/api";
import axios from "axios";
import * as FileSaver from "file-saver";

interface GuestState {
  myRegistry: {
    status: RegistrationStatus;
    guests: IGuest[];
    updatedAt: string | null;
  };
  admin: {
    allLists: IAdminRegistryRow[];
    loading: boolean;
    expandedRegistry: IRegistrationResponse | null;
    expandLoading: boolean;
  };
  loading: boolean;
  isSaving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: GuestState = {
  myRegistry: {
    status: "DRAFT",
    guests: [],
    updatedAt: null,
  },
  admin: {
    allLists: [],
    loading: false,
    expandedRegistry: null,
    expandLoading: false,
  },
  loading: false,
  isSaving: false,
  error: null,
  message: null,
};

const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || "An unexpected error occurred";
  }
  return String(err);
};

/* =====================================================
    THUNKS
===================================================== */

export const saveGuestDraft = createAsyncThunk(
  "guests/save",
  async (guests: IGuest[], { rejectWithValue }) => {
    try {
      const { data } = await api.post("/guests/save", { guests });
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const submitGuestRegistry = createAsyncThunk(
  "guests/submit",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/guests/submit");
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const getMyGuestRegistry = createAsyncThunk(
  "guests/me",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/guests/me");
      return data.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const deleteMyRegistry = createAsyncThunk(
  "guests/delete",
  async (_, { rejectWithValue }) => {
    try {
      await api.delete("/guests/delete");
      return null;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const adminGetRegistryById = createAsyncThunk(
  "guests/adminGetOne",
  async (registrationId: number, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/guests/admin/${registrationId}`);
      return data.data as IRegistrationResponse;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const adminGetAllRegistries = createAsyncThunk(
  "guests/adminAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/guests/admin/all");
      return data.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

/**
 * DOWNLOAD THUNKS
 */

// Individual PDF
export const downloadGuestListPDF = createAsyncThunk(
  "guests/downloadGuestPDF",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/guests/report/${userId}`, { responseType: "blob" });
      FileSaver.saveAs(response.data, `Guest_List_${userId}.pdf`);
      return "Guest list downloaded successfully";
    } catch {
      return rejectWithValue("Failed to download guest list");
    }
  }
);

// Bulk PDF Export
export const exportFullRegistryPDF = createAsyncThunk(
  "guests/exportFullRegistry",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/guests/admin/export-all", { responseType: "blob" });
      const fileName = `Full_Registry_${new Date().toISOString().split("T")[0]}.pdf`;
      FileSaver.saveAs(response.data, fileName);
      return "Full registry PDF exported successfully";
    } catch {
      return rejectWithValue("Failed to export full registry PDF");
    }
  }
);

// NEW: Bulk Excel Export
export const exportFullRegistryExcel = createAsyncThunk(
  "guests/exportFullExcel",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/guests/admin/export-excel", { responseType: "blob" });
      const fileName = `Full_Registry_${new Date().toISOString().split("T")[0]}.xlsx`;
      FileSaver.saveAs(response.data, fileName);
      return "Full registry Excel exported successfully";
    } catch {
      return rejectWithValue("Failed to export full registry Excel");
    }
  }
);

// NEW: Bulk Word Export
export const exportFullRegistryWord = createAsyncThunk(
  "guests/exportFullWord",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/guests/admin/export-word", { responseType: "blob" });
      const fileName = `Full_Registry_${new Date().toISOString().split("T")[0]}.docx`;
      FileSaver.saveAs(response.data, fileName);
      return "Full registry Word exported successfully";
    } catch {
      return rejectWithValue("Failed to export full registry Word");
    }
  }
);

export const updateGuestDetail = createAsyncThunk(
  "guests/updateGuest",
  async ({ id, guestData }: { id: number; guestData: Partial<IGuest> }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/guests/update-guest/${id}`, guestData);
      return data.data; // This returns the updated guest object from the server
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

/* =====================================================
    SLICE
===================================================== */

const guestSlice = createSlice({
  name: "guests",
  initialState,
  reducers: {
    clearGuestErrors: (state) => { state.error = null; },
    clearGuestMessage: (state) => { state.message = null; },
  },
  extraReducers: (builder) => {
    // My Registry Cases
    builder.addCase(getMyGuestRegistry.pending, (state) => { state.loading = true; });
    builder.addCase(getMyGuestRegistry.fulfilled, (state, action) => {
      state.loading = false;
      state.myRegistry.status = action.payload.status;
      state.myRegistry.guests = action.payload.guests;
      state.myRegistry.updatedAt = action.payload.updated_at;
    });

    // Handle all Download/Export Thunks (Individual PDF, Bulk PDF, Excel, Word)
    const exportThunks = [
      downloadGuestListPDF, 
      exportFullRegistryPDF, 
      exportFullRegistryExcel, 
      exportFullRegistryWord
    ];

    exportThunks.forEach(thunk => {
      builder.addCase(thunk.pending, (state) => { state.loading = true; });
      builder.addCase(thunk.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload as string;
      });
      builder.addCase(thunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    });

    // Update Individual Guest Detail
    builder.addCase(updateGuestDetail.pending, (state) => {
      state.isSaving = true;
    });
    builder.addCase(updateGuestDetail.fulfilled, (state, action) => {
      state.isSaving = false;
      const updatedGuest = action.payload;
      
      // Update the guest in the local list
      const index = state.myRegistry.guests.findIndex(g => g.id === updatedGuest.id);
      if (index !== -1) {
        state.myRegistry.guests[index] = updatedGuest;
      }
      
      state.message = "Guest updated successfully";
    });
    builder.addCase(updateGuestDetail.rejected, (state, action) => {
      state.isSaving = false;
      state.error = action.payload as string;
    });

    // Admin List
    builder.addCase(adminGetAllRegistries.pending, (state) => { state.admin.loading = true; });
    builder.addCase(adminGetAllRegistries.fulfilled, (state, action) => {
      state.admin.loading = false;
      state.admin.allLists = action.payload;
    });

    // Admin Details
    builder.addCase(adminGetRegistryById.pending, (state) => {
      state.admin.expandLoading = true;
      state.admin.expandedRegistry = null;
    });
    builder.addCase(adminGetRegistryById.fulfilled, (state, action) => {
      state.admin.expandLoading = false;
      state.admin.expandedRegistry = action.payload;
    });

    // Status Updates
    builder.addCase(saveGuestDraft.pending, (state) => { state.isSaving = true; });
    builder.addCase(saveGuestDraft.fulfilled, (state, action) => {
      state.isSaving = false;
      state.message = action.payload.message;
    });
    builder.addCase(submitGuestRegistry.fulfilled, (state, action) => {
      state.myRegistry.status = "SUBMITTED";
      state.message = action.payload.message;
    });
    builder.addCase(deleteMyRegistry.fulfilled, (state) => {
      state.myRegistry = initialState.myRegistry;
      state.message = "Registry deleted successfully";
    });
  },
});

export const { clearGuestErrors, clearGuestMessage } = guestSlice.actions;
export default guestSlice.reducer;