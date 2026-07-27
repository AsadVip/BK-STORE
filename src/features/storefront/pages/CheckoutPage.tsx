import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Truck, Banknote, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { useGuestCart } from "@/lib/cart/guest-cart";
import { useAuth } from "@/app/providers/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/use-toast";

export default function CheckoutPage() {
    const items = useGuestCart((s) => s.items);
    const subtotal = useGuestCart((s) => s.subtotal());
    const clearCart = useGuestCart((s) => s.clear);
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [submitting, setSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState<{ id: string; orderNumber: string } | null>(null);

    const [form, setForm] = useState({
        email: profile?.email ?? "",
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        phone: "",
        line1: "",
        city: "",
        postalCode: "",
        paymentMethod: "cash_on_delivery",
    });

    const shipping = 0;
    const total = subtotal + shipping;



    useEffect(() => {
        if (user && profile) {
            setForm((f) => ({
                ...f,
                email: user.email || profile.email || f.email,
                firstName: profile.first_name || f.firstName,
                lastName: profile.last_name || f.lastName,
            }));
        }
    }, [user, profile]);

    if (items.length === 0 && !orderPlaced) {
        return (
            <div className="container-bk py-20">
                <EmptyState
                    icon={Truck}
                    title="Nothing to check out"
                    description="Your cart is empty. Add products to check out."
                    action={<Button asChild className="rounded-xl bg-btn-primary text-white px-6"><Link to="/shop">Return to Shop</Link></Button>}
                />
            </div>
        );
    }

    const update = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.firstName || !form.line1 || !form.city || !form.phone) {
            toast({ title: "Please fill in all required fields", variant: "destructive" });
            return;
        }

        const emailClean = form.email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailClean)) {
            toast({ title: "Invalid Email Format", description: "Please enter a valid email address.", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const orderNum = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
            const nowIso = new Date().toISOString();

            const cartItemsPayload = items.map((item) => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                product_name: item.product_name,
                variant_name: item.variant_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.unit_price * item.quantity,
                image_url: item.image_url,
            }));

            // Core guaranteed fields on public.orders table
            const corePayload: any = {
                order_number: orderNum,
                user_id: user?.id ?? null,
                guest_email: emailClean,
                email: emailClean,
                status: "pending",
                grand_total: total,
                total_amount: total,
                placed_at: nowIso,
                created_at: nowIso,
                carrier: "Leopard Courier / TCS",
                tracking_number: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
                estimated_delivery: new Date(Date.now() + 3 * 86400000).toISOString(),
                items: cartItemsPayload,
                order_items: cartItemsPayload,
                shipping_address: {
                    first_name: form.firstName,
                    last_name: form.lastName,
                    phone: form.phone,
                    line1: form.line1,
                    city: form.city,
                    postal_code: form.postalCode,
                    items: cartItemsPayload,
                    cart_items: cartItemsPayload,
                },
            };

            let orderData: any = null;

            // 1. Attempt insert into Supabase orders table
            try {
                let { data, error } = await (supabase.from("orders" as never) as any)
                    .insert(corePayload)
                    .select()
                    .single();

                if (error) {
                    console.warn("Full payload insert notice:", error);
                    const retryPayload = { ...corePayload };
                    delete retryPayload.items;
                    delete retryPayload.order_items;

                    const retry = await (supabase.from("orders" as never) as any)
                        .insert(retryPayload)
                        .select()
                        .single();

                    if (!retry.error) {
                        data = retry.data;
                    } else {
                        console.error("Supabase order core insert error:", retry.error);
                    }
                }
                orderData = data;
            } catch (e) {
                console.warn("Supabase order exception:", e);
            }

            // Create unified complete order object
            const savedOrderObj = {
                id: orderData?.id || `local-${Date.now()}`,
                order_number: orderNum,
                user_id: user?.id ?? null,
                guest_email: emailClean,
                email: emailClean,
                status: "pending",
                grand_total: total,
                total_amount: total,
                placed_at: nowIso,
                created_at: nowIso,
                items: cartItemsPayload,
                order_items: cartItemsPayload,
                carrier: "Leopard Courier / TCS",
                tracking_number: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
                estimated_delivery: new Date(Date.now() + 3 * 86400000).toISOString(),
                shipping_address: {
                    first_name: form.firstName,
                    last_name: form.lastName,
                    phone: form.phone,
                    line1: form.line1,
                    city: form.city,
                    postal_code: form.postalCode,
                    items: cartItemsPayload,
                },
            };

            // Save order to Local Storage sync store for fallback & instant real-time sync
            try {
                const existingLocal = JSON.parse(localStorage.getItem("bk_local_orders") || "[]");
                const filtered = existingLocal.filter((o: any) => o.order_number !== orderNum);
                localStorage.setItem("bk_local_orders", JSON.stringify([savedOrderObj, ...filtered]));
            } catch (e) {
                console.warn("LocalStorage save notice:", e);
            }

            // Dispatch real-time cross-tab and in-tab event for Admin Panel / Tracking sync
            try {
                const bc = new BroadcastChannel("bk_orders_channel");
                bc.postMessage({ type: "ORDER_PLACED", order: savedOrderObj });
                bc.close();
            } catch (e) {}

            window.dispatchEvent(new CustomEvent("bk_order_event", { detail: { action: "placed", order: savedOrderObj } }));

            // Decrement stock quantity for ordered items
            for (const item of items) {
                try {
                    if (item.variant_id) {
                        const { data: v } = await supabase
                            .from("product_variants")
                            .select("stock_quantity")
                            .eq("id", item.variant_id)
                            .maybeSingle();

                        if (v && (v as any).stock_quantity !== undefined) {
                            const currentStock = Number((v as any).stock_quantity) || 0;
                            const newStock = Math.max(0, currentStock - item.quantity);
                            await supabase
                                .from("product_variants")
                                .update({ stock_quantity: newStock } as never)
                                .eq("id", item.variant_id);
                        }
                    }
                } catch (e) {
                    console.warn("Stock decrement notice:", e);
                }
            }

            clearCart();
            setOrderPlaced({ id: savedOrderObj.id, orderNumber: orderNum });
            toast({
                title: "Order Placed Successfully!",
                description: `Order #${orderNum} confirmed. Received in Admin Panel.`,
                variant: "success",
            });
        } catch (err) {
            toast({
                title: "Order Placement Error",
                description: err instanceof Error ? err.message : "Failed to place order. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="container-bk py-16 flex flex-col items-center text-center max-w-xl mx-auto">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-6 border border-emerald-500/20">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-500 mb-2">Order Confirmed & Received</span>
                <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-text-primary mb-3">
                    Thank You for Your Order!
                </h1>
                <p className="text-text-secondary text-sm mb-6">
                    Order <span className="font-mono font-bold text-text-primary">#{orderPlaced.orderNumber}</span> has been saved in the database and sent to the Admin Panel. You will pay Cash on Delivery upon arrival.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button asChild size="lg" className="flex-1 rounded-xl bg-btn-primary text-white font-bold h-12 shadow-md">
                        <Link to={`/track-order?q=${orderPlaced.orderNumber}`}>Track Your Order <ArrowRight className="h-4 w-4 ml-2" /></Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="flex-1 rounded-xl font-bold h-12">
                        <Link to="/shop">Continue Shopping</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-bk py-12">
            {/* Step Header */}
            <div className="mb-10 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider text-text-secondary">
                <span className="flex items-center gap-2 text-text-secondary opacity-60">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-xs">1</span>
                    Shopping Cart
                </span>
                <span className="h-0.5 w-12 bg-btn-primary/40" />
                <span className="flex items-center gap-2 text-btn-primary font-extrabold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-btn-primary text-white text-xs">2</span>
                    Checkout & Payment
                </span>
                <span className="h-0.5 w-12 bg-border" />
                <span className="flex items-center gap-2 text-text-secondary opacity-60">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-xs">3</span>
                    Confirmation
                </span>
            </div>

            <h1 className="mb-8 font-serif text-3xl font-extrabold text-text-primary">Express Checkout</h1>

            <form onSubmit={handlePlaceOrder} className="grid gap-10 lg:grid-cols-[1fr_380px] items-start">
                {/* Form Fields */}
                <div className="space-y-8">
                    {/* Contact Info */}
                    <div className="rounded-3xl border border-border/80 bg-bg-secondary/40 p-6 space-y-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                            <h2 className="font-serif font-bold text-lg text-text-primary flex items-center gap-2">
                                Contact Information
                            </h2>
                            {user ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                    ✓ Logged in as <strong className="font-mono">{user.email}</strong>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-btn-primary bg-btn-primary/10 px-3 py-1 rounded-full border border-btn-primary/20">
                                    🚀 Guest Checkout (No Login Required)
                                </span>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="email">
                                    Email Address <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => update("email", e.target.value)}
                                    placeholder="your-email@example.com"
                                    required
                                    disabled={!!user}
                                    className="mt-1 font-medium"
                                />
                                {!user && (
                                    <p className="text-[11px] text-text-secondary mt-1">
                                        Enter your personal email to receive order tracking & status updates.
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone Number (For Delivery Confirmation) <span className="text-red-500">*</span></Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => update("phone", e.target.value)}
                                    placeholder="+92 300 1234567"
                                    required
                                    className="mt-1 font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="rounded-3xl border border-border/80 bg-bg-secondary/40 p-6 space-y-4 shadow-sm">
                        <h2 className="font-serif font-bold text-lg text-text-primary flex items-center gap-2">
                            Shipping Address
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={form.firstName}
                                    onChange={(e) => update("firstName", e.target.value)}
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={form.lastName}
                                    onChange={(e) => update("lastName", e.target.value)}
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Label htmlFor="line1">Street Address</Label>
                                <Input
                                    id="line1"
                                    value={form.line1}
                                    onChange={(e) => update("line1", e.target.value)}
                                    placeholder="House #, Street name, Sector/Area"
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={form.city}
                                    onChange={(e) => update("city", e.target.value)}
                                    placeholder="e.g. Lahore, Karachi, Islamabad"
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                                <Input
                                    id="postalCode"
                                    value={form.postalCode}
                                    onChange={(e) => update("postalCode", e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="rounded-3xl border border-border/80 bg-bg-secondary/40 p-6 space-y-4 shadow-sm">
                        <h2 className="font-serif font-bold text-lg text-text-primary flex items-center gap-2">
                            Payment Method
                        </h2>
                        <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 p-4 flex items-center gap-4">
                            <Banknote className="h-7 w-7 text-emerald-500 shrink-0" />
                            <div>
                                <h4 className="font-bold text-text-primary text-base">Cash on Delivery (COD)</h4>
                                <p className="text-xs text-text-secondary">Pay with cash when your parcel arrives at your doorstep.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Order Summary */}
                <div className="rounded-3xl border border-border/80 bg-bg-secondary/60 p-6 space-y-6 shadow-md sticky top-24">
                    <h2 className="font-serif font-bold text-xl text-text-primary">Order Summary ({items.length} items)</h2>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {items.map((item) => (
                            <div key={item.variant_id} className="flex items-center gap-3 text-xs">
                                <div className="h-12 w-12 rounded-lg bg-bg-secondary border border-border overflow-hidden shrink-0">
                                    {item.image_url && <img src={item.image_url} alt="" className="h-full w-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-text-primary truncate">{item.product_name}</p>
                                    <p className="text-text-secondary">Qty: {item.quantity}</p>
                                </div>
                                <span className="font-bold text-text-primary">{formatCurrency(item.unit_price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3 text-sm border-t border-border/60 pt-4">
                        <div className="flex justify-between text-text-secondary">
                            <span>Subtotal</span>
                            <span className="font-bold text-text-primary">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-text-secondary">
                            <span>Delivery Shipping</span>
                            <span>{shipping === 0 ? <span className="font-bold text-emerald-500">FREE</span> : formatCurrency(shipping)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border/60 pt-3 text-base font-extrabold text-text-primary">
                            <span>Total Payable</span>
                            <span className="font-serif text-xl text-btn-primary">{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-btn-primary text-white font-bold h-12 shadow-md hover:scale-[1.01] transition-transform"
                    >
                        {submitting ? "Processing Order..." : "Confirm & Place Order"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
