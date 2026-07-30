import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { supabase } from "@/lib/supabase/client";

// Firebase Configuration strictly for FCM Push Notifications
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA6inpBytKQiD9M5OdP-8adbV9VlcMj0j4",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bk-store-notificatoin-push.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bk-store-notificatoin-push",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bk-store-notificatoin-push.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "138901384869",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:138901384869:web:e4f0c8f158766f0924274c",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-00NMY80L3X",
};

// Initialize Firebase singleton
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Register Service Worker for FCM Background Push Notifications
 */
export async function registerServiceWorker() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        return null;
    }
    try {
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
            scope: "/",
        });
        console.log("FCM Service Worker registered with scope:", registration.scope);
        return registration;
    } catch (err) {
        console.warn("FCM Service Worker registration failed:", err);
        return null;
    }
}

/**
 * Request Notification Permission and register FCM Token in Supabase admin_device_tokens table
 */
export async function requestAndSaveFCMToken(adminId?: string): Promise<string | null> {
    try {
        const supported = await isSupported();
        if (!supported) {
            console.warn("Firebase Messaging is not supported in this browser.");
            return null;
        }

        if (typeof Notification === "undefined") {
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.log("Browser notification permission denied or dismissed.");
            return null;
        }

        const swReg = await registerServiceWorker();
        const messaging = getMessaging(firebaseApp);

        // VAPID Key can be passed via env or fallback
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: swReg || undefined,
        });

        if (token) {
            console.log("FCM Device Token generated:", token);
            // Save token to Supabase admin_device_tokens table
            const userAgent = navigator.userAgent;
            const platform = navigator.platform;
            const browserName = getBrowserName(userAgent);

            // Attempt save to Supabase
            try {
                await (supabase.from("admin_device_tokens" as never) as any).upsert(
                    {
                        admin_id: adminId || null,
                        device_token: token,
                        browser: browserName,
                        platform: platform,
                        last_seen: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "device_token" }
                );
            } catch (dbErr) {
                console.warn("Notice saving FCM token to Supabase:", dbErr);
            }

            // Save locally for quick reference
            localStorage.setItem("bk_fcm_token", token);
            return token;
        } else {
            console.warn("No FCM token available. Request permission again.");
            return null;
        }
    } catch (error) {
        console.error("Error obtaining FCM token:", error);
        return null;
    }
}

/**
 * Subscribe to foreground FCM messages when site is active
 */
export async function setupForegroundFCMListener(onMessageReceived: (payload: any) => void): Promise<() => void> {
    try {
        const supported = await isSupported();
        if (!supported) return () => {};

        const messaging = getMessaging(firebaseApp);
        const unsubscribe = onMessage(messaging, (payload: any) => {
            console.log("Foreground FCM message received:", payload);
            onMessageReceived(payload);
        });
        return () => unsubscribe();
    } catch (e) {
        console.warn("FCM foreground listener setup notice:", e);
        return () => {};
    }
}

/**
 * Helper to identify browser name from user agent
 */
function getBrowserName(ua: string): string {
    if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    return "Web Browser";
}
