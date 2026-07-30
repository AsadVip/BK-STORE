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
 * Uses SECURITY DEFINER RPC so even guest/customer checkouts can insert notifications.
 */
export async function sendAdminOrderPushNotification(payload: PushPayload): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
    const errors: string[] = [];
    let sentCount = 0;

    const notifTitle = payload.title || "New Order Received";
    const notifBody = payload.body || `Order #${payload.orderNumber || ""} received for PKR ${payload.totalAmount || 0}`;
    const clickUrl = payload.url || "/admin/orders";

    // ──────────────────────────────────────────────────────────────
    // 1. Insert notification via SECURITY DEFINER RPC (bypasses RLS)
    //    This is the CRITICAL step — when this INSERT succeeds,
    //    the admin's Supabase Realtime postgres_changes listener fires
    //    and triggers the Chrome native push notification.
    // ──────────────────────────────────────────────────────────────
    let notifInserted = false;
    try {
        // Try RPC first (SECURITY DEFINER — works for ALL users including guests)
        const { error: rpcErr } = await (supabase as any).rpc("insert_order_notification", {
            p_title: notifTitle,
            p_body: notifBody,
            p_link: clickUrl,
            p_order_number: payload.orderNumber || null,
            p_customer_name: payload.customerName || null,
            p_grand_total: payload.totalAmount || 0,
        });

        if (!rpcErr) {
            notifInserted = true;
            console.log("✅ Order notification inserted via RPC (SECURITY DEFINER)");
        } else {
            console.warn("RPC insert_order_notification failed, trying direct insert:", rpcErr.message);
        }
    } catch (rpcCatchErr) {
        console.warn("RPC call exception:", rpcCatchErr);
    }

    // Fallback: Direct table insert (only works if user has RLS INSERT permission)
    if (!notifInserted) {
        try {
            const { error: directErr } = await (supabase.from("notifications" as never) as any).insert({
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
            });

            if (!directErr) {
                notifInserted = true;
                console.log("✅ Order notification inserted via direct table insert");
            } else {
                console.warn("Direct notification insert failed (RLS blocked):", directErr.message);
                errors.push("Notification insert blocked: " + directErr.message);
            }
        } catch (notifErr) {
            console.warn("Notice inserting notification into Supabase:", notifErr);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // 2. Supabase Realtime Broadcast (backup cross-device delivery)
    //    This works even if the notification INSERT failed.
    // ──────────────────────────────────────────────────────────────
    try {
        const globalChannel = supabase.channel("bk_admin_global_orders");
        globalChannel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
                globalChannel.send({
                    type: "broadcast",
                    event: "NEW_ORDER_PLACED",
                    payload: {
                        title: notifTitle,
                        body: notifBody,
                        orderNumber: payload.orderNumber,
                        customerName: payload.customerName,
                        totalAmount: payload.totalAmount,
                        url: clickUrl,
                    },
                });
                setTimeout(() => supabase.removeChannel(globalChannel), 3000);
            }
        });
    } catch (realtimeErr) {
        console.warn("Supabase Realtime broadcast notice:", realtimeErr);
    }

    // ──────────────────────────────────────────────────────────────
    // 3. Same-browser BroadcastChannel & Custom Event
    //    Only works if admin has another tab open in the SAME browser.
    // ──────────────────────────────────────────────────────────────
    try {
        const bc = new BroadcastChannel("bk_orders_channel");
        bc.postMessage({
            type: "ORDER_PLACED",
            notification: { title: notifTitle, body: notifBody, url: clickUrl, orderNumber: payload.orderNumber },
        });
        bc.close();
    } catch (_) {}

    try {
        window.dispatchEvent(
            new CustomEvent("bk_order_event", {
                detail: {
                    action: "placed",
                    notification: { title: notifTitle, body: notifBody, url: clickUrl, orderNumber: payload.orderNumber },
                },
            })
        );
    } catch (_) {}

    // ──────────────────────────────────────────────────────────────
    // 4. Local Service Worker postMessage (same-device only)
    // ──────────────────────────────────────────────────────────────
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
        } catch (_) {}
    }

    return { success: notifInserted || sentCount > 0, sentCount, errors };
}
