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

    // 3. Query all active admin device tokens from Supabase
    try {
        const { data: deviceTokens, error: tokensErr } = await (supabase.from("admin_device_tokens" as never) as any)
            .select("id, device_token, last_seen")
            .order("last_seen", { ascending: false });

        if (tokensErr) {
            console.warn("Error fetching admin device tokens from Supabase:", tokensErr);
            errors.push(tokensErr.message);
            return { success: false, sentCount: 0, errors };
        }

        if (!deviceTokens || deviceTokens.length === 0) {
            console.log("No registered admin device tokens found in Supabase.");
            return { success: true, sentCount: 0, errors: ["No registered admin device tokens."] };
        }

        // 4. Dispatch FCM push notification to each registered device token
        for (const tokenRow of deviceTokens) {
            const token = tokenRow.device_token;
            if (!token) continue;

            try {
                // Trigger Web Push Notification via FCM Endpoint or Service Worker Broadcast
                if (typeof window !== "undefined" && "serviceWorker" in navigator) {
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
                }
            } catch (err: any) {
                console.warn(`Failed to push notification to token ${token}:`, err);
                errors.push(`Token ${tokenRow.id}: ${err?.message || "Delivery failed"}`);

                // If token is invalid or expired, clean it up from Supabase
                if (err?.message?.includes("InvalidRegistration") || err?.message?.includes("NotRegistered")) {
                    await (supabase.from("admin_device_tokens" as never) as any).delete().eq("id", tokenRow.id);
                }
            }
        }
    } catch (e: any) {
        console.error("FCM Push Dispatch exception:", e);
        errors.push(e?.message || "FCM Dispatch exception");
    }

    return { success: sentCount > 0, sentCount, errors };
}
