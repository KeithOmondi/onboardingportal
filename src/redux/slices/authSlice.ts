// src/redux/slices/authSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IUser } from "../../interfaces/user.interface";
import api from "../../api/api";
import axios from "axios";
import type { AppDispatch } from "../store";

// ── Interfaces ───────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password?: string;
}
export interface UpdatePasswordRequest {
  userId: string;
  newPassword?: string;
}
export interface ForgotPasswordRequest {
  email: string;
}
export interface ResetPasswordRequest {
  token: string;
  password?: string;
}

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  loading: "idle" | "auth"; // "idle" by default to prevent instant spinner
  error: string | null;
  message: string | null;
  mustResetPassword: boolean;
  tempUserId: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: "idle", 
  error: null,
  message: null,
  mustResetPassword: false,
  tempUserId: null,
};

// ── Slice ────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authRequest: (state) => {
      state.loading = "auth";
      state.error = null;
      state.message = null;
    },
    loginSuccess: (state, action: PayloadAction<IUser>) => {
      state.loading = "idle";
      state.isAuthenticated = true;
      state.user = action.payload;
      state.mustResetPassword = false;
      state.tempUserId = null;
    },
    loginMustReset: (state, action: PayloadAction<{ userId: string }>) => {
      state.loading = "idle";
      state.isAuthenticated = false;
      state.mustResetPassword = true;
      state.tempUserId = action.payload.userId;
    },
    authMessageSuccess: (state, action: PayloadAction<string>) => {
      state.loading = "idle";
      state.message = action.payload;
    },
    authFail: (state, action: PayloadAction<string>) => {
      state.loading = "idle";
      state.error = action.payload;
    },
    logoutSuccess: (state) => {
      state.loading = "idle";
      state.user = null;
      state.isAuthenticated = false;
      state.mustResetPassword = false;
      state.tempUserId = null;
    },
    clearErrors: (state) => { state.error = null; },
    clearMessages: (state) => { state.message = null; },
  },
});

export const {
  authRequest, loginSuccess, loginMustReset,
  authMessageSuccess, authFail, logoutSuccess,
  clearErrors, clearMessages,
} = authSlice.actions;

// ── Thunks ───────────────────────────────────────────────────────────────────

/**
 * 1. Silent session restore
 * Only triggers the 'auth' loading state if a token exists.
 */
export const loadUser = () => async (dispatch: AppDispatch) => {
  const token = localStorage.getItem("accessToken");

  // If no token exists, we don't start the 'auth' loading state.
  // This allows the app to stay in 'idle' and proceed to the login redirect.
  if (!token) {
    console.log("No token found, skipping session restore.");
    return;
  }

  try {
    dispatch(authRequest()); // Now show the spinner as we verify the token

    const { data } = await api.get("/auth/refresh");
    
    console.log("Session restored successfully");
    localStorage.setItem("accessToken", data.accessToken);
    dispatch(loginSuccess(data.user));
  } catch (err) {
    console.error("Session restoration failed:", err);
    localStorage.removeItem("accessToken");
    dispatch(logoutSuccess());
  }
};

// 2. Login
export const login =
  (loginData: LoginRequest) => async (dispatch: AppDispatch) => {
    try {
      dispatch(authRequest());
      const { data } = await api.post("/auth/login", loginData);
      if (data.mustResetPassword) {
        dispatch(loginMustReset({ userId: data.userId }));
      } else {
        localStorage.setItem("accessToken", data.accessToken);
        dispatch(loginSuccess(data.user));
      }
    } catch (error) {
      handleError(error, dispatch, "Login Failed");
    }
  };

// 3. Verify Email
export const verifyEmail =
  (token: string) => async (dispatch: AppDispatch) => {
    try {
      dispatch(authRequest());
      const { data } = await api.get(`/auth/verify/${token}`);
      dispatch(authMessageSuccess(data.message));
    } catch (error) {
      handleError(error, dispatch, "Email Verification Failed");
    }
  };

// 4. Forgot Password
export const forgotPassword =
  (emailData: ForgotPasswordRequest) => async (dispatch: AppDispatch) => {
    try {
      dispatch(authRequest());
      const { data } = await api.post("/auth/forgot-password", emailData);
      dispatch(authMessageSuccess(data.message));
    } catch (error) {
      handleError(error, dispatch, "Request Failed");
    }
  };

// 5. Reset Password
export const resetPassword =
  (resetData: ResetPasswordRequest) => async (dispatch: AppDispatch) => {
    try {
      dispatch(authRequest());
      const { data } = await api.patch(
        `/auth/reset-password/${resetData.token}`,
        { password: resetData.password },
      );
      localStorage.setItem("accessToken", data.accessToken);
      dispatch(loginSuccess(data.user));
    } catch (error) {
      handleError(error, dispatch, "Reset Failed");
    }
  };

// 6. Update Password
export const updatePassword =
  (updateData: UpdatePasswordRequest) => async (dispatch: AppDispatch) => {
    try {
      dispatch(authRequest());
      const { data } = await api.patch("/auth/update-password", updateData);
      localStorage.setItem("accessToken", data.accessToken);
      dispatch(loginSuccess(data.user));
    } catch (error) {
      handleError(error, dispatch, "Update Failed");
    }
  };

// 7. Logout
export const logout = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(authRequest());
    await api.get("/auth/logout");
  } finally {
    localStorage.removeItem("accessToken");
    dispatch(logoutSuccess());
  }
};

// ── Error Helper ─────────────────────────────────────────────────────────────
const handleError = (
  error: unknown,
  dispatch: AppDispatch,
  defaultMsg: string,
) => {
  let errorMessage = defaultMsg;
  if (axios.isAxiosError(error)) {
    errorMessage = error.response?.data?.message || defaultMsg;
  }
  dispatch(authFail(errorMessage));
};

export default authSlice.reducer;