import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { IAdminRegistryRow, IGuest, IRegistrationResponse, RegistrationStatus } from "../../interfaces/guests.interface";
import api from "../../api/api";
import axios from "axios";

interface GuestState {
  myRegistry: {
    status: RegistrationStatus;
    guests: IGuest[];
    updatedAt: string | null;
  };
  admin: {
    allLists: IAdminRegistryRow[];
    loading: boolean;
    expandedRegistry: IRegistrationResponse | null; // ← added
    expandLoading: boolean;                          // ← added
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
    expandedRegistry: null, // ← added
    expandLoading: false,   // ← added
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

export const addMoreGuests = createAsyncThunk(
  "guests/add",
  async (newGuests: IGuest[], { rejectWithValue }) => {
    try {
      const { data } = await api.patch("/guests/add", { guests: newGuests });
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

const guestSlice = createSlice({
  name: "guests",
  initialState,
  reducers: {
    clearGuestErrors: (state) => { state.error = null; },
    clearGuestMessage: (state) => { state.message = null; },
  },
  extraReducers: (builder) => {
    // GET MY REGISTRY
    builder.addCase(getMyGuestRegistry.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getMyGuestRegistry.fulfilled, (state, action) => {
      state.loading = false;
      state.myRegistry.status = action.payload.status;
      state.myRegistry.guests = action.payload.guests;
      state.myRegistry.updatedAt = action.payload.updated_at;
    });
    builder.addCase(getMyGuestRegistry.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // SAVE DRAFT
    builder.addCase(saveGuestDraft.pending, (state) => {
      state.isSaving = true;
    });
    builder.addCase(saveGuestDraft.fulfilled, (state, action) => {
      state.isSaving = false;
      state.message = action.payload.message;
    });

    // SUBMIT
    builder.addCase(submitGuestRegistry.fulfilled, (state, action) => {
      state.myRegistry.status = "SUBMITTED";
      state.message = action.payload.message;
    });

    // DELETE
    builder.addCase(deleteMyRegistry.fulfilled, (state) => {
      state.myRegistry = initialState.myRegistry;
      state.message = "Registry deleted successfully";
    });

    // ADMIN GET ALL
    builder.addCase(adminGetAllRegistries.pending, (state) => {
      state.admin.loading = true;
    });
    builder.addCase(adminGetAllRegistries.fulfilled, (state, action) => {
      state.admin.loading = false;
      state.admin.allLists = action.payload;
    });

    // ADMIN GET ONE — ← added these three cases
    builder.addCase(adminGetRegistryById.pending, (state) => {
      state.admin.expandLoading = true;
      state.admin.expandedRegistry = null;
    });
    builder.addCase(adminGetRegistryById.fulfilled, (state, action) => {
      state.admin.expandLoading = false;
      state.admin.expandedRegistry = action.payload;
    });
    builder.addCase(adminGetRegistryById.rejected, (state) => {
      state.admin.expandLoading = false;
      state.admin.expandedRegistry = null;
    });
  },
});

export const { clearGuestErrors, clearGuestMessage } = guestSlice.actions;
export default guestSlice.reducer;