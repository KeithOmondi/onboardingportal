import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import type {
  ISwearingPreference,
  SwearingPreferencePayload,
} from "../../interfaces/swearingPreference.interface";
import api from "../../api/api";
import FileSaver from "file-saver";

/* =====================================================
    STATE & TYPES
===================================================== */

interface SwearingPreferenceState {
  myPreference: ISwearingPreference | null;
  allPreferences: ISwearingPreference[];
  selectedJudgePreference: ISwearingPreference | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: SwearingPreferenceState = {
  myPreference: null,
  allPreferences: [],
  selectedJudgePreference: null,
  loading: false,
  error: null,
  success: false,
};

interface ApiError {
  message: string;
}

/* =====================================================
    ASYNC THUNKS
===================================================== */

/**
 * JUDGE: Fetch current judge's preference
 */
export const getMySwearingPreference = createAsyncThunk(
  "swearingPreference/getMy",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: ISwearingPreference }>(
        "/swearing-preferences/me",
      );
      return response.data.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to load preferences",
      );
    }
  },
);

/**
 * JUDGE: Save or Update preference
 */
export const saveSwearingPreference = createAsyncThunk(
  "swearingPreference/save",
  async (payload: SwearingPreferencePayload, { rejectWithValue }) => {
    try {
      const response = await api.post<{ data: ISwearingPreference }>(
        "/swearing-preferences/save",
        payload,
      );
      return response.data.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to save selection",
      );
    }
  },
);

/* =====================================================
    EXPORT / DOWNLOAD THUNKS
===================================================== */

export const downloadSwearingPreferencesPDF = createAsyncThunk(
  "swearingPreference/downloadPDF",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/swearing-preferences/download-report", {
        responseType: "blob",
      });
      const fileName = `Swearing_Preferences_${new Date().toISOString().split("T")[0]}.pdf`;
      FileSaver.saveAs(response.data, fileName);
      return "PDF download started";
    } catch {
      return rejectWithValue("Failed to download PDF report");
    }
  },
);

export const downloadSwearingPreferencesExcel = createAsyncThunk(
  "swearingPreference/downloadExcel",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/swearing-preferences/export-excel", {
        responseType: "blob",
      });
      const fileName = `Swearing_Preferences_${new Date().toISOString().split("T")[0]}.xlsx`;
      FileSaver.saveAs(response.data, fileName);
      return "Excel download started";
    } catch {
      return rejectWithValue("Failed to download Excel report");
    }
  },
);

export const downloadSwearingPreferencesWord = createAsyncThunk(
  "swearingPreference/downloadWord",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/swearing-preferences/export-word", {
        responseType: "blob",
      });
      const fileName = `Swearing_Preferences_${new Date().toISOString().split("T")[0]}.docx`;
      FileSaver.saveAs(response.data, fileName);
      return "Word download started";
    } catch {
      return rejectWithValue("Failed to download Word document");
    }
  },
);

/* =====================================================
    ADMIN THUNKS
===================================================== */

/**
 * ADMIN: Fetch all records
 */
export const fetchAllPreferences = createAsyncThunk(
  "swearingPreference/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: ISwearingPreference[] }>(
        "/swearing-preferences/get",
      );
      return response.data.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Administrative fetch failed",
      );
    }
  },
);

/**
 * ADMIN: Fetch specific record by User ID
 */
export const getPreferenceByUserId = createAsyncThunk(
  "swearingPreference/getById",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: ISwearingPreference }>(
        `/swearing-preferences/get/${userId}`,
      );
      return response.data.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch judge preference",
      );
    }
  },
);

/* =====================================================
    SLICE DEFINITION
===================================================== */

const swearingPreferenceSlice = createSlice({
  name: "swearingPreference",
  initialState,
  reducers: {
    clearSwearingPreferenceState: (state) => {
      state.error = null;
      state.success = false;
      state.loading = false;
    },
    resetSelectedJudge: (state) => {
      state.selectedJudgePreference = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* Get My Preference */
      .addCase(getMySwearingPreference.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMySwearingPreference.fulfilled, (state, action) => {
        state.loading = false;
        state.myPreference = action.payload;
      })
      .addCase(getMySwearingPreference.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* Save Preference */
      .addCase(saveSwearingPreference.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(saveSwearingPreference.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.myPreference = action.payload;
      })
      .addCase(saveSwearingPreference.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* Fetch All (Admin) */
      .addCase(fetchAllPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.allPreferences = action.payload || [];
      })
      .addCase(fetchAllPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* Get By User ID (Admin) */
      .addCase(getPreferenceByUserId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPreferenceByUserId.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedJudgePreference = action.payload;
      })
      .addCase(getPreferenceByUserId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* Handle Global Loading for Exports */
      .addMatcher(
        (action) =>
          action.type.endsWith("/downloadPDF/pending") ||
          action.type.endsWith("/downloadExcel/pending") ||
          action.type.endsWith("/downloadWord/pending"),
        (state) => {
          state.loading = true;
        },
      )
      .addMatcher(
        (action) =>
          action.type.endsWith("/fulfilled") ||
          action.type.endsWith("/rejected"),
        (state) => {
          state.loading = false;
        },
      );
  },
});

export const { clearSwearingPreferenceState, resetSelectedJudge } =
  swearingPreferenceSlice.actions;

export default swearingPreferenceSlice.reducer;
