import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/api";
import axios from "axios";
import type { IUser, UserRole } from "../../interfaces/user.interface";
import type { AppDispatch } from "../store";

// --- Internal Interfaces ---
export interface CreateUserRequest {
  full_name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export interface UpdateUserRequest {
  id: string;
  full_name?: string;
  role?: UserRole;
  is_verified?: boolean;
}

// Added support for search and pagination metadata
interface UserManagementState {
  users: IUser[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: UserManagementState = {
  users: [],
  totalUsers: 0,
  totalPages: 1,
  currentPage: 1,
  loading: false,
  error: null,
  message: null,
};

// Payload type for getting users
interface GetUsersPayload {
  users: IUser[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    userRequest: (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    getUsersSuccess: (state, action: PayloadAction<GetUsersPayload>) => {
      state.loading = false;
      state.users = action.payload.users;
      state.totalUsers = action.payload.totalUsers;
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
    },
    createUserSuccess: (state, action: PayloadAction<IUser>) => {
      state.loading = false;
      state.users.unshift(action.payload);
      state.totalUsers += 1; // Increment total count
      state.message = "User onboarded successfully.";
    },
    updateUserSuccess: (state, action: PayloadAction<IUser>) => {
      state.loading = false;
      state.users = state.users.map((u) =>
        u.id === action.payload.id ? action.payload : u
      );
      state.message = "User updated successfully.";
    },
    deleteUserSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.users = state.users.filter((u) => u.id !== action.payload);
      state.totalUsers -= 1;
      state.message = "User removed from system.";
    },
    userFail: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearUserStatus: (state) => {
      state.error = null;
      state.message = null;
    },
  },
});

export const {
  userRequest,
  getUsersSuccess,
  createUserSuccess,
  updateUserSuccess,
  deleteUserSuccess,
  userFail,
  clearUserStatus,
} = userSlice.actions;

// --- Thunk Actions ---

/**
 * 1. Fetch Users with dynamic Search and Pagination
 * @example fetchAllUsers({ search: 'Smith', role: 'judge', page: 2 })
 */
export const fetchAllUsers = (params: { search?: string; role?: string; page?: number; limit?: number } = {}) => 
  async (dispatch: AppDispatch) => {
    try {
      dispatch(userRequest());
      
      // LOG THIS to check the connection
      console.log("Fetching users with params:", params);
      
      const { data } = await api.get("/users/get", { params });
      
      console.log("API Response:", data);

      dispatch(getUsersSuccess({
        // Defaulting to empty array if backend fails to send users key
        users: data.users || [], 
        totalUsers: data.totalUsers || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1
      }));
    } catch (error) {
      console.error("Fetch Error:", error);
      dispatch(userFail(handleErrorMessage(error, "Failed to fetch directory")));
    }
};

// 2. Onboard New User
export const onboardUser = (userData: CreateUserRequest) => async (dispatch: AppDispatch) => {
  try {
    dispatch(userRequest());
    const { data } = await api.post("/users/create", userData);
    dispatch(createUserSuccess(data.user));
  } catch (error) {
    dispatch(userFail(handleErrorMessage(error, "Onboarding failed")));
  }
};

// 3. Update User
export const modifyUser = (userData: UpdateUserRequest) => async (dispatch: AppDispatch) => {
  try {
    dispatch(userRequest());
    const { id, ...updateFields } = userData; // Separate ID from body
    const { data } = await api.patch(`/users/update/${id}`, updateFields);
    dispatch(updateUserSuccess(data.user));
  } catch (error) {
    dispatch(userFail(handleErrorMessage(error, "Update failed")));
  }
};

// 4. Delete User
export const removeUser = (id: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(userRequest());
    await api.delete(`/users/delete/${id}`);
    dispatch(deleteUserSuccess(id));
  } catch (error) {
    dispatch(userFail(handleErrorMessage(error, "Deletion failed")));
  }
};

// Helper for cleaner code
const handleErrorMessage = (error: unknown, defaultMsg: string): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || defaultMsg;
  }
  return defaultMsg;
};

export default userSlice.reducer;