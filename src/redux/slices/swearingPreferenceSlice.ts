import {
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";
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
 * Matches Backend: GET /api/v1/swearing-preferences/me
 */
export const getMySwearingPreference = createAsyncThunk(
  "swearingPreference/getMy",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: ISwearingPreference }>(
        "/swearing-preferences/me"
      );
      return response.data.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to load preferences"
      );
    }
  }
);

/**
 * JUDGE: Save or Update preference
 * Matches Backend: POST /api/v1/swearing-preferences/save
 */
export const saveSwearingPreference = createAsyncThunk(
  "swearingPreference/save",
  async (payload: SwearingPreferencePayload, { rejectWithValue }) => {
    try {
      const response = await api.post<{ data: ISwearingPreference }>(
        "/swearing-preferences/save",
        payload
      );
      return response.data.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to save selection"
      );
    }
  }
);

export const downloadSwearingPreferencesPDF = createAsyncThunk(
  "swearingPreference/downloadPDF",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/swearing-preferences/download-report", {
        responseType: "blob",
      });

      const fileName = `Swearing_Preferences_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Use the namespace prefix here
      FileSaver.saveAs(response.data, fileName);

      return "Download started successfully";
    } catch  {
      return rejectWithValue("Failed to download PDF report");
    }
  }
);

/**
 * ADMIN: Fetch all records
 * Matches Backend: GET /api/v1/swearing-preferences/get
 */
export const fetchAllPreferences = createAsyncThunk(
  "swearingPreference/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: ISwearingPreference[] }>(
        "/swearing-preferences/get"
      );
      console.log("🔍 Raw API response:", response.data); // Add this
      return response.data.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      console.error("❌ Fetch failed:", err.response?.status, err.response?.data); // And this
      return rejectWithValue(
        err.response?.data?.message || "Administrative fetch failed"
      );
    }
  }
);
/**
 * ADMIN: Fetch specific record by User ID
 * Matches Backend: GET /api/v1/swearing-preferences/get/:userId
 */
export const getPreferenceByUserId = createAsyncThunk(
  "swearingPreference/getById",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: ISwearingPreference }>(
        `/swearing-preferences/get/${userId}`
      );
      return response.data.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch judge preference"
      );
    }
  }
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
      });
  },
});

export const { clearSwearingPreferenceState, resetSelectedJudge } =
  swearingPreferenceSlice.actions;

export default swearingPreferenceSlice.reducer;