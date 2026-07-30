# BK Store — Firebase Cloud Messaging (FCM) & Admin Setup Guide

This guide explains how Firebase Cloud Messaging (FCM) is integrated with **BK Store** for sending push notifications on new orders, where Firebase credentials are defined, how to deploy the Service Worker, and how to verify push notifications end-to-end.

---

## 1. Architecture Overview

- **Supabase**: Complete backend (Database, Authentication, Storage, Edge Functions, SQL, RLS).
- **Firebase Cloud Messaging (FCM)**: **ONLY** used for Push Notifications.
- All new database schemas, triggers, policies, and functions are located inside:
  ```
  supabase/sql/
  ├── 001_create_user_management.sql
  ├── 002_create_admin_device_tokens.sql
  ├── 003_create_notifications_and_order_cancel.sql
  ├── 004_create_banned_users.sql
  ├── 005_create_order_logs.sql
  └── 006_add_indexes.sql
  ```

---

## 2. Firebase Configuration & Key Placement

### Pre-configured Web App Configuration
The SDK is initialized inside `src/lib/firebase.ts` and `public/firebase-messaging-sw.js` with the provided Firebase configuration:

```typescript
export const firebaseConfig = {
  apiKey: "AIzaSyA6inpBytKQiD9M5OdP-8adbV9VlcMj0j4",
  authDomain: "bk-store-notificatoin-push.firebaseapp.com",
  projectId: "bk-store-notificatoin-push",
  storageBucket: "bk-store-notificatoin-push.firebasestorage.app",
  messagingSenderId: "138901384869",
  appId: "1:138901384869:web:e4f0c8f158766f0924274c",
  measurementId: "G-00NMY80L3X"
};
```

### Environment Variables (Optional Customization)
If you wish to override these variables per environment, add them to `.env.local`:

```env
VITE_FIREBASE_API_KEY=AIzaSyA6inpBytKQiD9M5OdP-8adbV9VlcMj0j4
VITE_FIREBASE_AUTH_DOMAIN=bk-store-notificatoin-push.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bk-store-notificatoin-push
VITE_FIREBASE_STORAGE_BUCKET=bk-store-notificatoin-push.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=138901384869
VITE_FIREBASE_APP_ID=1:138901384869:web:e4f0c8f158766f0924274c
VITE_FIREBASE_VAPID_KEY=YOUR_PUBLIC_VAPID_KEY_HERE
```

---

## 3. How to Enable FCM in Firebase Console & Generate VAPID Key

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select project: **`bk-store-notificatoin-push`**.
3. Go to **Project Settings** (gear icon) → **Cloud Messaging** tab.
4. Under **Web configuration**:
   - Locate **Web Push certificates**.
   - If no Key Pair exists, click **Generate Key Pair**.
   - Copy the generated **Public VAPID key**.
5. Paste the VAPID key into `.env.local` as `VITE_FIREBASE_VAPID_KEY`.

---

## 4. Service Worker Deployment

The Service Worker file is located at:
```
public/firebase-messaging-sw.js
```

### Deployment Instructions
- During Vite build (`npm run build`), Vite automatically copies all files from `public/` to the `dist/` root directory.
- Ensure your hosting provider (Netlify, Vercel, or custom server) serves `firebase-messaging-sw.js` at the site root (`/firebase-messaging-sw.js`) with proper headers:
  ```http
  Service-Worker-Allowed: /
  Content-Type: application/javascript
  ```

---

## 5. End-to-End Verification Checklist

To verify that notifications, order management, user ban enforcement, and customer cancellations work:

### 1. Database Setup
- Apply all SQL migrations from `supabase/sql/` to your Supabase project via the Supabase Dashboard SQL Editor or Supabase CLI:
  ```bash
  supabase db push
  ```

### 2. FCM Token Registration (Admin Device)
- Login to the Admin Panel at `/admin`.
- Navigate to **Notification Center** (`/admin/notifications`).
- Click **Enable Push Notifications**.
- Allow browser notifications when prompted.
- Check Supabase Table `admin_device_tokens` to verify that the `device_token` has been recorded.

### 3. New Order Push Notification
- Open the storefront at `/shop` in a guest window or secondary browser.
- Add products to cart and complete checkout at `/checkout`.
- Observe:
  1. The new order appears in Admin Panel `/admin/orders` in real time.
  2. The Notification Center records a new entry under "Unread".
  3. A browser push notification toast is displayed.

### 4. User Ban System Verification
- Navigate to **User Management** (`/admin/customers`).
- Select a customer email and click **Ban User**. Provide a restriction reason.
- Open `/checkout` using the banned email.
- Verify that order submission is rejected with:
  > *"Your account has been restricted from placing new orders. Please contact support."*

### 5. Customer 4-Hour Cancellation Window
- Go to `/account/orders` as a customer and click an order placed < 4 hours ago.
- Verify that **Cancel Order** button is available and functions.
- For orders > 4 hours old, verify that the button is disabled with notice: *"Cancellation window closed (4h max)"*.

### 6. Order Management & Export
- In `/admin/orders`, test Calendar filters (Today, Yesterday, This Week, Last 30 Days, Custom Range).
- Test Search (Order ID, Name, Email, Phone, Product Name).
- Test **Export CSV**, **Export Excel**, **Export PDF Report**.
- Test **Print Invoice**, **Packing Slip**, **Receipt**.
- Test Super Admin **Reset Orders** modal with Download Backup confirmation.
