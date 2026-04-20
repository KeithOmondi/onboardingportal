// src/hooks/usePushNotifications.ts

import { useEffect, useCallback } from "react";
import api from "../api/api";

// ── Hook ─────────────────────────────────────────────────────────────────

export const usePushNotifications = () => {
  const subscribe = useCallback(async () => {
    // 1. Browser support check
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[Push] Not supported in this browser.");
      return;
    }

    // 2. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[Push] Permission denied.");
      return;
    }

    try {
      // 3. Register the service worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      // 4. Check if already subscribed
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        // Already subscribed — make sure server has this subscription
        await api.post("/push/subscribe", { subscription: existing });
        return;
      }

      // 5. Subscribe with your VAPID public key (set in .env as VITE_VAPID_PUBLIC_KEY)
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;
      if (!vapidPublicKey) {
        console.error("[Push] VITE_VAPID_PUBLIC_KEY is not set.");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,  // browser accepts base64url string natively
      });

      // 6. Send subscription to backend for storage
      await api.post("/push/subscribe", { subscription });
      console.log("[Push] Subscribed successfully.");
    } catch (err) {
      console.error("[Push] Subscription failed:", err);
    }
  }, []);

  // Auto-subscribe when the hook mounts (only if permission already granted)
  useEffect(() => {
    if (
      "Notification" in window &&
      Notification.permission === "granted" &&
      "serviceWorker" in navigator
    ) {
      subscribe();
    }
  }, [subscribe]);

  return { subscribe };
};