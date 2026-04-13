import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { ChatMessage, SendMessageDTO, ChatConversation } from "../../interfaces/chat.interface";
import api from "../../api/api";
import { AxiosError } from "axios";

interface ChatState {
  messages: ChatMessage[];
  conversations: ChatConversation[];
  loading: boolean;
  error: string | null;
  activeRecipientId: string | null;
}

interface ApiErrorResponse {
  message: string;
}

const initialState: ChatState = {
  messages: [],
  conversations: [],
  loading: false,
  error: null,
  activeRecipientId: null,
};

// --- Thunks ---

/**
 * POST /api/v1/chat/send
 */
export const sendMessageAction = createAsyncThunk(
  "chat/sendMessage",
  async (messageData: SendMessageDTO, { rejectWithValue }) => {
    try {
      const response = await api.post("/chat/send", messageData);
      return response.data.data as ChatMessage;
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      return rejectWithValue(error.response?.data?.message || "Failed to send message");
    }
  }
);

/**
 * GET /api/v1/chat/messages
 */
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages", 
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/chat/messages");
      return response.data.data as ChatMessage[];
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      return rejectWithValue(error.response?.data?.message || "Failed to fetch messages");
    }
  }
);

/**
 * GET /api/v1/chat/conversations
 */
export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations", 
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/chat/conversations");
      return response.data.data as ChatConversation[];
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      return rejectWithValue(error.response?.data?.message || "Failed to fetch conversations");
    }
  }
);

// --- Slice ---

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveRecipient: (state, action: PayloadAction<string | null>) => {
      state.activeRecipientId = action.payload;
    },
    
    receiveMessage: (state, action: PayloadAction<ChatMessage & { _tempId?: string }>) => {
      const newMessage = action.payload;
      const exists = state.messages.find((m) => m.id === newMessage.id);
      
      if (!exists) {
        state.messages.push(newMessage);
      }
    },

    clearChatError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action: PayloadAction<ChatMessage[]>) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Conversations
      .addCase(fetchConversations.fulfilled, (state, action: PayloadAction<ChatConversation[]>) => {
        state.conversations = action.payload;
      })

      // Send Message (Optimistic or standard update)
      .addCase(sendMessageAction.fulfilled, (state, action: PayloadAction<ChatMessage>) => {
        const exists = state.messages.find((m) => m.id === action.payload.id);
        if (!exists) {
          state.messages.push(action.payload);
        }
      })
      .addCase(sendMessageAction.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setActiveRecipient, receiveMessage, clearChatError } = chatSlice.actions;
export default chatSlice.reducer;