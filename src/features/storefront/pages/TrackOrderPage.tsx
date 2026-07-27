import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Package, Truck, CheckCircle2, Clock, MapPin, ShieldCheck, Sparkles, ArrowRight, Phone, Mail, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface OrderItemPayload {
    product_name?: string;
    variant_name?: string | null;
    quantity: number;
    unit_price: number;
    total_price?: number;
    image_url?: string | null;
}

interface OrderTrackingResult {
    id?: string;
    order_number: string;
    email?: string;
    guest_email?: string;
    status: string;
    grand_total?: number;
    total_amount?: number;
    created_at?: string;
    placed_at?: string;
    carrier?: string;
    tracking_number?: string;
    estimated_delivery?: string;
    shipping_address?: any;
    items?: OrderItemPayload[];
    order_items?: OrderItemPayload[];
}

const STEPS = [
    { key: "placed", label: "Order Placed", desc: "Your order has been received", icon: Package },
    { key: "processing", label: "Processing", desc: "Inspected & packed with care", icon: Clock },
    { key: "shipped", label: "Dispatched", desc: "Handed to courier partner", icon: Truck },
    { key: "delivered", label: "Delivered", desc: "Arrived at your doorstep", icon: CheckCircle2 },
];

export default function TrackOrderPage() {
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get("q") || "";

    const [query, setQuery] = useState(initialQuery);
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<OrderTrackingResult | null>(null);
    const [searched, setSearched] = useState(false);
    const { toast } = useToast();

    const handleTrack = async (searchQuery: string) => {
        const raw = searchQuery.trim();
        if (!raw) return;
        setLoading(true);
        setSearched(true);

        try {
            const clean = raw.replace(/^#/, "").trim();
            const withPrefix = clean.toUpperCase().startsWith("BK-") ? clean.toUpperCase() : `BK-${clean.toUpperCase()}`;

            let foundOrder: any = null;

            // 1. Try local storage sync store
            try {
                const localOrders: any[] = JSON.parse(localStorage.getItem("bk_local_orders") || "[]");
                foundOrder = localOrders.find((o) => {
                    const numMatch = o.order_number?.toLowerCase() === clean.toLowerCase() ||
                        o.order_number?.toLowerCase() === withPrefix.toLowerCase() ||
                        o.order_number?.toLowerCase().endsWith(clean.toLowerCase());
                    const emailMatch = o.guest_email?.toLowerCase() === raw.toLowerCase() ||
                        o.email?.toLowerCase() === raw.toLowerCase();
                    return numMatch || emailMatch;
                });
            } catch (e) {
                console.warn("Local storage check notice:", e);
            }

            // 2. Query Supabase orders table if not found or to get freshest DB record
            try {
                const { data } = await (supabase.from("orders" as never) as any)
                    .select("*")
                    .or(`order_number.ilike.%${clean}%,order_number.ilike.%${withPrefix}%,guest_email.ilike.%${raw}%,email.ilike.%${raw}%`)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data) {
                    foundOrder = { ...foundOrder, ...data };
                }
            } catch (e) {
                console.warn("Supabase query notice:", e);
            }

            if (foundOrder) {
                setOrder(foundOrder);
            } else {
                setOrder(null);
            }
        } catch {
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialQuery) {
            handleTrack(initialQuery);
        }
    }, [initialQuery]);

    // Real-Time Listener for Order Updates (via Supabase Realtime & Local Events)
    useEffect(() => {
        if (!order?.order_number) return;

        const currentNum = order.order_number;

        // 1. Supabase Postgres Changes Realtime Listener
        const channel = supabase
            .channel(`order-track-${currentNum}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "orders",
                    filter: `order_number=eq.${currentNum}`,
                },
                (payload) => {
                    const updated = payload.new as any;
                    if (updated && updated.status) {
                        setOrder((prev) => (prev ? { ...prev, ...updated } : null));
                        toast({
                            title: "🔔 Real-Time Order Update!",
                            description: `Order #${currentNum} status changed to ${updated.status.toUpperCase()}`,
                            variant: "success",
                        });
                    }
                }
            )
            .subscribe();

        // 2. Cross-tab BroadcastChannel Realtime Listener
        let bc: BroadcastChannel | null = null;
        try {
            bc = new BroadcastChannel("bk_orders_channel");
            bc.onmessage = (event) => {
                const msg = event.data;
                if ((msg?.type === "ORDER_UPDATED" || msg?.type === "STATUS_CHANGED") && msg.order) {
                    if (msg.order.order_number === currentNum || msg.order.id === order.id) {
                        setOrder((prev) => (prev ? { ...prev, ...msg.order } : null));
                        toast({
                            title: "🔔 Live Status Update!",
                            description: `Order status is now: ${msg.order.status.toUpperCase()}`,
                            variant: "success",
                        });
                    }
                }
            };
        } catch (e) {}

        // 3. In-tab custom window event listener
        const handleCustomEvent = (e: any) => {
            const detail = e.detail;
            if (detail?.order && (detail.order.order_number === currentNum || detail.order.id === order.id)) {
                setOrder((prev) => (prev ? { ...prev, ...detail.order } : null));
                toast({
                    title: "🔔 Live Status Update!",
                    description: `Order status updated to ${detail.order.status.toUpperCase()}`,
                    variant: "success",
                });
            }
        };

        window.addEventListener("bk_order_event", handleCustomEvent);

        return () => {
            supabase.removeChannel(channel);
            if (bc) bc.close();
            window.removeEventListener("bk_order_event", handleCustomEvent);
        };
    }, [order?.order_number, order?.id]);

    const getStepIndex = (status: string) => {
        switch (status?.toLowerCase()) {
            case "placed": case "pending": return 0;
            case "confirmed": case "processing": case "paid": return 1;
            case "shipped": case "out_for_delivery": case "dispatched": return 2;
            case "delivered": case "completed": return 3;
            case "cancelled": case "refunded": return -1;
            default: return 1;
        }
    };

    const currentStepIndex = order ? getStepIndex(order.status) : 0;
    const isCancelled = order?.status?.toLowerCase() === "cancelled";

    const displayItems: OrderItemPayload[] = order?.items || order?.order_items || order?.shipping_address?.items || [];
    const shippingAddress = order?.shipping_address || {};
    const customerPhone = shippingAddress.phone || "—";
    const customerName = [shippingAddress.first_name, shippingAddress.last_name].filter(Boolean).join(" ") || "Customer";
    const placedDate = order?.placed_at || order?.created_at || new Date().toISOString();
    const grandTotal = Number(order?.grand_total || order?.total_amount || 0);

    return (
        <div className="container-bk py-14 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-btn-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-btn-primary mb-3">
                    <Truck className="h-3.5 w-3.5" /> Real-Time Live Order Tracking
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-text-primary">
                    Track Your Order
                </h1>
                <p className="mt-2 text-text-secondary text-sm sm:text-base max-w-md">
                    Enter your Order Number (e.g. #BK-84920) or Email Address to inspect live shipment status.
                </p>

                {/* Search Bar */}
                <form
                    onSubmit={(e) => { e.preventDefault(); handleTrack(query); }}
                    className="mt-6 flex w-full max-w-md items-center gap-2 rounded-2xl border border-border bg-bg-secondary p-1.5 shadow-sm"
                >
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Order # (e.g. BK-84920) or Email..."
                        className="border-0 bg-transparent text-sm focus-visible:ring-0 font-medium"
                    />
                    <Button type="submit" disabled={loading} className="rounded-xl bg-btn-primary text-white font-bold px-5 shrink-0">
                        <Search className="h-4 w-4 mr-1.5" /> {loading ? "Searching..." : "Track"}
                    </Button>
                </form>
            </div>

            {/* Tracking Result Card */}
            {order && (
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-border/80 bg-bg-secondary/40 p-6 sm:p-8 space-y-8 shadow-md"
                >
                    {/* Top Order Summary Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Order Identifier</span>
                            <h2 className="font-serif font-extrabold text-2xl text-text-primary mt-0.5 flex items-center gap-2">
                                #{order.order_number}
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                                    <Sparkles className="h-3 w-3" /> Realtime Sync Active
                                </span>
                            </h2>
                            <p className="text-xs text-text-secondary mt-1">Placed on {formatDate(placedDate)}</p>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-1">
                            <Badge
                                variant={isCancelled ? "danger" : currentStepIndex === 3 ? "success" : "default"}
                                className="uppercase font-black px-4 py-1.5 text-xs tracking-wider"
                            >
                                STATUS: {order.status.toUpperCase()}
                            </Badge>
                            {order.estimated_delivery && !isCancelled && (
                                <span className="text-xs font-semibold text-text-secondary mt-1">
                                    Est. Delivery: <strong className="text-text-primary">{formatDate(order.estimated_delivery)}</strong>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Progress Stepper */}
                    {!isCancelled ? (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Shipment Timeline</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {STEPS.map((st, i) => {
                                    const active = i <= currentStepIndex;
                                    const isCurrent = i === currentStepIndex;
                                    const Icon = st.icon;

                                    return (
                                        <div
                                            key={st.key}
                                            className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${
                                                isCurrent
                                                    ? "border-btn-primary bg-btn-primary/10 shadow-sm ring-2 ring-btn-primary/30"
                                                    : active
                                                    ? "border-emerald-500/40 bg-emerald-500/5 text-text-primary"
                                                    : "border-border/60 opacity-50 bg-bg-primary"
                                            }`}
                                        >
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 transition-colors ${
                                                    isCurrent
                                                        ? "bg-btn-primary text-white"
                                                        : active
                                                        ? "bg-emerald-500 text-white"
                                                        : "bg-bg-secondary text-text-secondary"
                                                }`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <h4 className="font-bold text-xs text-text-primary">{st.label}</h4>
                                            <p className="text-[10px] text-text-secondary mt-1 leading-tight">{st.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-xs text-red-500 font-bold">
                            This order has been cancelled by customer or store admin.
                        </div>
                    )}

                    {/* Customer & Shipping Info */}
                    <div className="rounded-2xl border border-border bg-bg-primary p-5 grid gap-4 sm:grid-cols-2 text-xs">
                        <div className="space-y-1">
                            <span className="text-text-secondary font-bold uppercase tracking-wider text-[10px]">Customer Details</span>
                            <p className="font-extrabold text-sm text-text-primary">{customerName}</p>
                            <p className="text-text-secondary flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-btn-primary" /> {order.guest_email || order.email || "—"}</p>
                            <p className="text-text-secondary flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-btn-primary" /> {customerPhone}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-text-secondary font-bold uppercase tracking-wider text-[10px]">Courier & Tracking</span>
                            <p className="font-bold text-text-primary">{order.carrier || "Leopard Courier / TCS Express"}</p>
                            <p className="font-mono font-bold text-btn-primary text-sm">{order.tracking_number || "TRK-9840219"}</p>
                            <p className="text-text-secondary">Delivery City: <strong className="text-text-primary">{shippingAddress.city || "Pakistan"}</strong></p>
                        </div>
                    </div>

                    {/* Order Items Breakdown */}
                    {displayItems.length > 0 && (
                        <div className="space-y-3 border-t border-border/60 pt-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                                <ShoppingBag className="h-4 w-4 text-btn-primary" /> Order Package Contents ({displayItems.length} items)
                            </h3>
                            <div className="divide-y divide-border/40 rounded-2xl border border-border/80 bg-bg-primary overflow-hidden">
                                {displayItems.map((item, idx) => {
                                    const uPrice = Number(item.unit_price || 0);
                                    const qty = Number(item.quantity || 1);
                                    const itemTotal = Number(item.total_price || (uPrice * qty));

                                    return (
                                        <div key={idx} className="p-4 flex items-center justify-between gap-4 text-xs">
                                            <div className="flex items-center gap-3">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.product_name} className="h-12 w-12 rounded-xl object-cover border border-border shrink-0" />
                                                ) : (
                                                    <div className="h-12 w-12 rounded-xl bg-btn-primary/10 flex items-center justify-center text-btn-primary font-bold shrink-0">
                                                        <Package className="h-6 w-6" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-extrabold text-text-primary text-sm">{item.product_name || "Product Item"}</p>
                                                    {item.variant_name && <p className="text-text-secondary text-[11px]">Variant: {item.variant_name}</p>}
                                                    <p className="text-text-secondary mt-0.5">Qty: <strong className="text-text-primary">{qty}</strong> × {formatCurrency(uPrice)}</p>
                                                </div>
                                            </div>
                                            <span className="font-extrabold text-sm text-text-primary shrink-0">{formatCurrency(itemTotal)}</span>
                                        </div>
                                    );
                                })}
                                <div className="p-4 bg-bg-secondary/50 flex items-center justify-between font-extrabold text-sm border-t border-border">
                                    <span className="text-text-secondary">Grand Total:</span>
                                    <span className="text-btn-primary text-base font-extrabold">{formatCurrency(grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {searched && !order && !loading && (
                <div className="rounded-3xl border border-border p-10 text-center text-text-secondary bg-bg-secondary/40 shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                        <Package className="h-7 w-7" />
                    </div>
                    <p className="font-extrabold text-lg text-text-primary">No order found matching "{query}"</p>
                    <p className="text-xs mt-1 max-w-sm mx-auto text-text-secondary leading-relaxed">
                        Please double check your Order Number (e.g. #BK-84920) or Email Address and try searching again.
                    </p>
                </div>
            )}
        </div>
    );
}
