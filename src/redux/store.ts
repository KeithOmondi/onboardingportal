import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import courtReducer from "./slices/courtSlice"
import swearingPreferenceReducer from "./slices/swearingPreferenceSlice"
import guestsReducer from "./slices/guestSlice"
import noticesReducer from "./slices/noticeSlice"
import eventsReducer from "./slices/eventsSlice"
import galleryReducer from "./slices/gallerySlice"
import chatReducer from "./slices/chatSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    court: courtReducer,
    swearingPreference: swearingPreferenceReducer,
    guests: guestsReducer,
    notices: noticesReducer,
    events: eventsReducer,
    gallery: galleryReducer,
    chat: chatReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;