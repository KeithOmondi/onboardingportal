import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { 
  type ICourtManagementData, 
  type IJudicialOfficial, 
  type ICourtFaq,
  type ICourtMandate, 
} from "../../interfaces/court.interface";
import api from "../../api/api";
import { AxiosError } from "axios";

// Define a structure for backend error responses
interface ApiError {
  message: string;
  success?: boolean;
}

interface CourtState {
  officials: IJudicialOfficial[];
  faqs: ICourtFaq[];
  mandates: ICourtMandate[];
  loading: boolean;
  error: string | null;
}

const initialState: CourtState = {
  officials: [],
  faqs: [],
  mandates: [],
  loading: false,
  error: null,
};

/**
 * ── THUNKS ──────────────────────────────────────────────────────────────────
 */

// 1. Fetch All Data
export const fetchCourtData = createAsyncThunk<ICourtManagementData, void, { rejectValue: string }>(
  "court/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ICourtManagementData>("/court/get");
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      return rejectWithValue(error.response?.data?.message || "Failed to load court data");
    }
  }
);

// 2. Create Official (Multipart)
export const createOfficial = createAsyncThunk<IJudicialOfficial, FormData, { rejectValue: string }>(
  "court/createOfficial",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post<IJudicialOfficial>(
        `/court/officials`, 
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      return rejectWithValue(error.response?.data?.message || "Failed to create official");
    }
  }
);

// 3. Create FAQ
export const createFaq = createAsyncThunk<ICourtFaq, Partial<ICourtFaq>, { rejectValue: string }>(
  "court/createFaq",
  async (faqData, { rejectWithValue }) => {
    try {
      const response = await api.post<ICourtFaq>(`/court/faqs`, faqData);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      return rejectWithValue(error.response?.data?.message || "Failed to create FAQ");
    }
  }
);

// 4. Create Mandate
export const createMandate = createAsyncThunk<ICourtMandate, Partial<ICourtMandate>, { rejectValue: string }>(
  "court/createMandate",
  async (mandateData, { rejectWithValue }) => {
    try {
      const response = await api.post<ICourtMandate>(`/court/mandates`, mandateData);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      return rejectWithValue(error.response?.data?.message || "Failed to create mandate");
    }
  }
);

/**
 * ── SLICE ───────────────────────────────────────────────────────────────────
 */
const courtSlice = createSlice({
  name: "court",
  initialState,
  reducers: {
    clearCourtError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Data
      .addCase(fetchCourtData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourtData.fulfilled, (state, action: PayloadAction<ICourtManagementData>) => {
        state.loading = false;
        state.officials = action.payload.officials;
        state.faqs = action.payload.faqs;
        state.mandates = action.payload.mandates;
      })
      .addCase(fetchCourtData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "An unknown error occurred";
      })
      
      // Create Official
      .addCase(createOfficial.pending, (state) => { state.loading = true; })
      .addCase(createOfficial.fulfilled, (state, action: PayloadAction<IJudicialOfficial>) => {
        state.loading = false;
        state.officials.push(action.payload);
        state.officials.sort((a, b) => a.sort_order - b.sort_order);
      })
      .addCase(createOfficial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create official";
      })

      // Create FAQ
      .addCase(createFaq.pending, (state) => { state.loading = true; })
      .addCase(createFaq.fulfilled, (state, action: PayloadAction<ICourtFaq>) => {
        state.loading = false;
        state.faqs.unshift(action.payload);
      })
      .addCase(createFaq.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create FAQ";
      })

      // Create Mandate
      .addCase(createMandate.pending, (state) => { state.loading = true; })
      .addCase(createMandate.fulfilled, (state, action: PayloadAction<ICourtMandate>) => {
        state.loading = false;
        state.mandates.push(action.payload);
      })
      .addCase(createMandate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create mandate";
      });
  },
});

export const { clearCourtError } = courtSlice.actions;
export default courtSlice.reducer;