import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
    LayoutDashboard, Package, FolderTree, Tag, Image as ImageIcon, Boxes,
    ShoppingCart, Users, Star, Ticket, Percent, Truck, CreditCard, Receipt,
    Bell, Settings, Globe, BarChart3, LineChart, ShieldCheck, ScrollText,
    DatabaseBackup, LogOut, Menu, X, Store, Smartphone
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useAdminNotificationsCenter } from "@/features/admin/api";
import { registerServiceWorker } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    end?: boolean;
}

const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
    {
        label: null,
        items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
    },
    {
        label: "Catalog",
        items: [
            { to: "/admin/products", label: "Products", icon: Package },
            { to: "/admin/categories", label: "Categories", icon: FolderTree },
        ],
    },
    {
        label: "Marketing",
        items: [
            { to: "/admin/banners", label: "Banners", icon: ImageIcon },
            { to: "/admin/coupons", label: "Coupons", icon: Ticket },
            { to: "/admin/campaigns", label: "Discount Campaigns", icon: Percent },
        ],
    },
    {
        label: "Sales & Customers",
        items: [
            { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
            { to: "/admin/customers", label: "User Management", icon: Users },
            { to: "/admin/notifications", label: "Notification Center", icon: Bell },
            { to: "/admin/reviews", label: "Reviews", icon: Star },
        ],
    },
    {
        label: "Inventory",
        items: [{ to: "/admin/inventory", label: "Inventory", icon: Boxes }],
    },
    {
        label: "Configuration",
        items: [
            { to: "/admin/shipping", label: "Shipping Methods", icon: Truck },
        ],
    },
    {
        label: "Insights",
        items: [
            { to: "/admin/reports", label: "Reports", icon: BarChart3 },
            { to: "/admin/analytics", label: "Analytics", icon: LineChart },
        ],
    },
    {
        label: "System",
        items: [
            { to: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck },
            { to: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
            { to: "/admin/backup", label: "Backup & Restore", icon: DatabaseBackup },
        ],
    },
];

export function AdminLayout() {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);

    const { data: notifications, refetch: refetchNotifs } = useAdminNotificationsCenter();
    const unreadCount = (notifications ?? []).filter((n: any) => !n.is_read).length;

    useEffect(() => {
        // Register FCM background service worker & request permission
        registerServiceWorker();
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Deduplication tracking to prevent multiple duplicate toasts & popups
        const processedKeys = new Set<string>();

        const triggerSingleNotification = (keyId: string, title: string, body: string) => {
            const cleanKey = keyId.trim() || title;
            if (processedKeys.has(cleanKey)) {
                return; // Already notified in this tab!
            }
            processedKeys.add(cleanKey);
            setTimeout(() => processedKeys.delete(cleanKey), 10000);

            // 1. Single UI Toast
            toast({
                title: title,
                description: body,
                variant: "success",
            });

            // 2. Single Native Browser Notification
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                try {
                    if ("serviceWorker" in navigator) {
                        navigator.serviceWorker.getRegistration("/").then((reg) => {
                            if (reg) {
                                reg.showNotification(title, {
                                    body: body,
                                    icon: "/download.png",
                                    badge: "/download.png",
                                    tag: "order-" + cleanKey,
                                    data: { url: "/admin/orders" },
                                });
                            } else {
                                new Notification(title, { body, icon: "/download.png", tag: "order-" + cleanKey });
                            }
                        });
                    } else {
                        new Notification(title, { body, icon: "/download.png", tag: "order-" + cleanKey });
                    }
                } catch (e) {
                    console.warn("Native notification notice:", e);
                }
            }
        };

        // 1. Supabase Realtime Listener for new Notifications & Global Order Broadcasts
        const channel = supabase
            .channel("realtime:admin-notifications")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "notifications" },
                (payload) => {
                    refetchNotifs();
                    qc.invalidateQueries({ queryKey: ["admin-orders"] });
                    qc.invalidateQueries({ queryKey: ["admin-kpis"] });
                    qc.invalidateQueries({ queryKey: ["admin-notifications-center"] });

                    const newNotif = payload.new as any;
                    const notifKey = newNotif.id || newNotif.metadata?.order_number || newNotif.title || String(Date.now());
                    const title = newNotif.title || "🔔 New Order Received!";
                    const body = newNotif.body || "A new order notification was received.";

                    triggerSingleNotification(notifKey, title, body);
                }
            )
            .subscribe();

        // Global Supabase Realtime Broadcast listener (works across all devices and all user accounts)
        const globalBroadcastChannel = supabase
            .channel("bk_admin_global_orders")
            .on("broadcast", { event: "NEW_ORDER_PLACED" }, (evt: any) => {
                refetchNotifs();
                qc.invalidateQueries({ queryKey: ["admin-orders"] });
                qc.invalidateQueries({ queryKey: ["admin-kpis"] });
                qc.invalidateQueries({ queryKey: ["admin-notifications-center"] });

                const payload = evt.payload;
                if (payload) {
                    const notifKey = payload.orderNumber || payload.title || String(Date.now());
                    const title = payload.title || "🔔 New Order Received!";
                    const body = payload.body || "A new order was placed.";

                    triggerSingleNotification(notifKey, title, body);
                }
            })
            .subscribe();

        // 2. BroadcastChannel Listener
        let bc: BroadcastChannel | null = null;
        try {
            bc = new BroadcastChannel("bk_orders_channel");
            bc.onmessage = (event) => {
                if (event.data?.type === "ORDER_PLACED") {
                    refetchNotifs();
                    qc.invalidateQueries({ queryKey: ["admin-orders"] });
                    qc.invalidateQueries({ queryKey: ["admin-kpis"] });
                    const notifKey = event.data.notification?.orderNumber || event.data.notification?.title || String(Date.now());
                    const title = event.data.notification?.title || "🔔 New Order Received!";
                    const body = event.data.notification?.body || "A customer placed a new order.";
                    triggerSingleNotification(notifKey, title, body);
                }
            };
        } catch (e) {}

        // 3. Custom Event Listener
        const handleCustomOrderEvent = (evt: any) => {
            refetchNotifs();
            qc.invalidateQueries({ queryKey: ["admin-orders"] });
            qc.invalidateQueries({ queryKey: ["admin-kpis"] });
            if (evt.detail?.notification) {
                const notifKey = evt.detail.notification.orderNumber || evt.detail.notification.title || String(Date.now());
                const title = evt.detail.notification.title || "🔔 New Order Received!";
                const body = evt.detail.notification.body || "A new order was placed on BK Store.";
                triggerSingleNotification(notifKey, title, body);
            }
        };

        window.addEventListener("bk_order_event", handleCustomOrderEvent);

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(globalBroadcastChannel);
            if (bc) bc.close();
            window.removeEventListener("bk_order_event", handleCustomOrderEvent);
        };
    }, [refetchNotifs, qc, toast]);

    const SidebarContent = (
        <div className="flex h-full flex-col">
            <div className="flex h-16 items-center gap-2 border-b border-border px-6">
                <span className="font-serif text-xl font-bold">BK Admin</span>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                {NAV_GROUPS.map((group, gi) => (
                    <div key={gi} className="mb-4">
                        {group.label && (
                            <p className="mb-1 px-3 text-caption font-medium uppercase tracking-wide text-text-secondary/70">
                                {group.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    onClick={() => setOpen(false)}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary",
                                            isActive && "border-l-2 border-accent-brown bg-bg-secondary text-text-primary",
                                        )
                                    }
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
            <div className="border-t border-border p-3">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-state-danger hover:bg-state-danger/10"
                    onClick={async () => {
                        await signOut();
                        navigate("/");
                    }}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg-primary">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-bg-secondary lg:block">
                {SidebarContent}
            </aside>

            {/* Mobile drawer */}
            {open && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 w-64 bg-bg-secondary">
                        {SidebarContent}
                    </aside>
                </div>
            )}

            {/* Main */}
            <div className="lg:pl-64">
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-bg-primary/80 px-4 backdrop-blur-md lg:px-8">
                    <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
                        <Menu className="h-6 w-6" />
                    </button>
                    <h1 className="font-serif text-lg font-semibold">BK Admin Operations</h1>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/admin/notifications"
                            className="relative p-2 rounded-full hover:bg-muted transition-colors text-text-primary"
                            title="Notification Center"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </header>
                <main id="main-content" className="p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
