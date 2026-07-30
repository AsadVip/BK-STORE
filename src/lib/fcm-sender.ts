import { supabase } from "@/lib/supabase/client";

interface PushPayload {
    title: string;
    body: string;
    orderNumber?: string;
    customerName?: string;
    totalAmount?: number;
    url?: string;
}

/**
 * Dispatch Push Notification to all registered Admin Devices and log notification record in Supabase.
 */
export async function sendAdminOrderPushNotification(payload: PushPayload): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
    const errors: string[] = [];
    let sentCount = 0;

    const notifTitle = payload.title || "New Order Received";
    const notifBody = payload.body || `Order #${payload.orderNumber || ""} received for PKR ${payload.totalAmount || 0}`;
    const clickUrl = payload.url || "/admin/orders";

    // 1. Save Notification record in Supabase for Admin Notification Center
    try {
        await (supabase.from("notifications" as never) as any).insert({
            type: "order",
            title: notifTitle,
            body: notifBody,
            link: clickUrl,
            metadata: {
                order_number: payload.orderNumber,
                customer_name: payload.customerName,
                grand_total: payload.totalAmount,
            },
            is_read: false,
            created_at: new Date().toISOString(),
        });
    } catch (notifErr) {
        console.warn("Notice inserting notification into Supabase:", notifErr);
    }

    // 2. Broadcast via Browser BroadcastChannel & In-Tab Event for immediate open tabs
    try {
        const bc = new BroadcastChannel("bk_orders_channel");
        bc.postMessage({
            type: "ORDER_PLACED",
            notification: { title: notifTitle, body: notifBody, url: clickUrl },
        });
        bc.close();
    } catch (bcErr) {
        console.warn("BroadcastChannel notice:", bcErr);
    }

    window.dispatchEvent(
        new CustomEvent("bk_order_event", {
            detail: {
                action: "placed",
                notification: { title: notifTitle, body: notifBody, url: clickUrl },
            },
        })
    );

    // 3. Query all active admin device tokens from Supabase (using Security Definer RPC or fallback)
    let deviceTokens: Array<{ id: string; device_token: string }> = [];
    try {
        const { data: rpcTokens, error: rpcErr } = await (supabase as any).rpc("get_active_admin_device_tokens");
        if (!rpcErr && Array.isArray(rpcTokens) && rpcTokens.length > 0) {
            deviceTokens = rpcTokens;
        } else {
            const { data: selectTokens } = await (supabase.from("admin_device_tokens" as never) as any)
                .select("id, device_token");
            if (selectTokens) deviceTokens = selectTokens;
        }
    } catch (e: any) {
        console.warn("Notice fetching admin device tokens:", e);
    }

    if (!deviceTokens || deviceTokens.length === 0) {
        console.log("No registered admin device tokens found in Supabase.");
    }

    // 4. Dispatch FCM push notification to each registered device token
    const serverKey = import.meta.env.VITE_FIREBASE_SERVER_KEY;

    for (const tokenRow of deviceTokens) {
        const token = tokenRow.device_token;
        if (!token) continue;

        // A) If FCM Server Key is configured in environment, send directly via FCM HTTP API
        if (serverKey) {
            try {
                const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `key=${serverKey}`,
                    },
                    body: JSON.stringify({
                        to: token,
                        notification: {
                            title: notifTitle,
                            body: notifBody,
                            icon: "/download.png",
                            click_action: clickUrl,
                        },
                        data: {
                            title: notifTitle,
                            body: notifBody,
                            url: clickUrl,
                            order_number: payload.orderNumber,
                        },
                        priority: "high",
                    }),
                });

                if (fcmRes.ok) {
                    sentCount++;
                } else {
                    const errData = await fcmRes.json().catch(() => ({}));
                    console.warn(`FCM HTTP API error for token ${token}:`, errData);
                    errors.push(`Token ${tokenRow.id}: ${JSON.stringify(errData)}`);
                }
            } catch (err: any) {
                console.warn(`Failed to push FCM notification to token ${token}:`, err);
                errors.push(`Token ${tokenRow.id}: ${err?.message || "Delivery failed"}`);
            }
        }
    }

    // B) Local Service Worker postMessage for same-device open browser
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        try {
            const registration = await navigator.serviceWorker.getRegistration("/");
            if (registration && registration.active) {
                registration.active.postMessage({
                    type: "PUSH_NOTIFICATION",
                    title: notifTitle,
                    body: notifBody,
                    url: clickUrl,
                    orderNumber: payload.orderNumber,
                });
                sentCount++;
            }
        } catch (swErr) {}
    }

    return { success: sentCount > 0, sentCount, errors };
}
