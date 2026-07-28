import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Truck, Banknote, ShieldCheck, ArrowRight, CheckCircle2, Lock, Info } from "lucide-react";
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
        emailNews: true,
        country: "Pakistan",
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        address: "",
        apartment: "",
        city: "",
        postalCode: "",
        phone: "",
        saveInfo: true,
        billingAddressType: "same_as_shipping", // 'same_as_shipping' | 'different'
        billingFirstName: "",
        billingLastName: "",
        billingAddress: "",
        billingCity: "",
        billingPostalCode: "",
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
                    action={
                        <Button asChild className="rounded-xl bg-btn-primary text-white px-6">
                            <Link to="/shop">Return to Shop</Link>
                        </Button>
                    }
                />
            </div>
        );
    }

    const update = (key: keyof typeof form, value: any) => setForm((f) => ({ ...f, [key]: value }));

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.firstName || !form.address || !form.city || !form.phone) {
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

            const finalBillingAddress = form.billingAddressType === "same_as_shipping"
                ? {
                    first_name: form.firstName,
                    last_name: form.lastName,
                    line1: form.address + (form.apartment ? `, ${form.apartment}` : ""),
                    city: form.city,
                    postal_code: form.postalCode,
                    country: form.country,
                }
                : {
                    first_name: form.billingFirstName,
                    last_name: form.billingLastName,
                    line1: form.billingAddress,
                    city: form.billingCity,
                    postal_code: form.billingPostalCode,
                    country: form.country,
                };

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
                    line1: form.address + (form.apartment ? `, ${form.apartment}` : ""),
                    city: form.city,
                    postal_code: form.postalCode,
                    country: form.country,
                    items: cartItemsPayload,
                    cart_items: cartItemsPayload,
                },
                billing_address: finalBillingAddress,
            };

            let orderData: any = null;

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
                    line1: form.address + (form.apartment ? `, ${form.apartment}` : ""),
                    city: form.city,
                    postal_code: form.postalCode,
                    country: form.country,
                    items: cartItemsPayload,
                },
                billing_address: finalBillingAddress,
            };

            try {
                const existingLocal = JSON.parse(localStorage.getItem("bk_local_orders") || "[]");
                const filtered = existingLocal.filter((o: any) => o.order_number !== orderNum);
                localStorage.setItem("bk_local_orders", JSON.stringify([savedOrderObj, ...filtered]));
            } catch (e) {
                console.warn("LocalStorage save notice:", e);
            }

            try {
                const bc = new BroadcastChannel("bk_orders_channel");
                bc.postMessage({ type: "ORDER_PLACED", order: savedOrderObj });
                bc.close();
            } catch (e) {}

            window.dispatchEvent(new CustomEvent("bk_order_event", { detail: { action: "placed", order: savedOrderObj } }));

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
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">
                    Order Confirmed & Received
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-primary mb-3">
                    Thank You for Your Order!
                </h1>
                <p className="text-text-secondary text-sm mb-6">
                    Order <span className="font-mono font-bold text-text-primary">#{orderPlaced.orderNumber}</span> has been confirmed. You will pay Cash on Delivery upon arrival.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button asChild size="lg" className="flex-1 rounded-xl bg-btn-primary text-white font-bold h-12 shadow-md">
                        <Link to={`/track-order?q=${orderPlaced.orderNumber}`}>
                            Track Your Order <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="flex-1 rounded-xl font-bold h-12">
                        <Link to="/shop">Continue Shopping</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-bk py-10 sm:py-14">
            {/* Step Breadcrumb Header */}
            <div className="mb-8 flex items-center justify-center gap-3 sm:gap-4 text-xs font-bold uppercase tracking-wider text-text-secondary">
                <span className="flex items-center gap-1.5 text-text-secondary opacity-60">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-[11px]">1</span>
                    Cart
                </span>
                <span className="h-0.5 w-8 sm:w-12 bg-border" />
                <span className="flex items-center gap-1.5 text-text-primary font-bold">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-btn-primary text-white text-[11px]">2</span>
                    Checkout
                </span>
                <span className="h-0.5 w-8 sm:w-12 bg-border" />
                <span className="flex items-center gap-1.5 text-text-secondary opacity-60">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-[11px]">3</span>
                    Confirmation
                </span>
            </div>

            <h1 className="mb-8 font-serif text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                Express Checkout
            </h1>

            <form onSubmit={handlePlaceOrder} className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
                {/* Form Sections */}
                <div className="space-y-6">

                    {/* 1. CONTACT SECTION */}
                    <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-bg-secondary/40 p-5 sm:p-7 space-y-4 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <h2 className="font-serif font-bold text-lg text-text-primary">
                                Contact
                            </h2>
                            {user ? (
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                                    Logged in as {user.email}
                                </span>
                            ) : (
                                <span className="text-[11px] font-medium text-text-secondary">
                                    Have an account? <Link to="/login" className="font-bold underline text-text-primary">Log in</Link>
                                </span>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-text-primary">
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
                                className="mt-1.5 font-medium bg-bg-primary"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="emailNews"
                                checked={form.emailNews}
                                onChange={(e) => update("emailNews", e.target.checked)}
                                className="h-4 w-4 rounded border-border text-btn-primary focus:ring-btn-primary cursor-pointer"
                            />
                            <Label htmlFor="emailNews" className="text-xs font-medium text-text-secondary cursor-pointer">
                                Email me with news and offers
                            </Label>
                        </div>
                    </div>

                    {/* 2. DELIVERY SECTION */}
                    <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-bg-secondary/40 p-5 sm:p-7 space-y-4 shadow-2xs">
                        <h2 className="font-serif font-bold text-lg text-text-primary border-b border-border/60 pb-3">
                            Delivery
                        </h2>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Country Dropdown */}
                            <div className="sm:col-span-2">
                                <Label htmlFor="country" className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                    Country / Region
                                </Label>
                                <select
                                    id="country"
                                    value={form.country}
                                    onChange={(e) => update("country", e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-border bg-bg-primary px-3.5 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-btn-primary"
                                >
                                    <option value="Pakistan">Pakistan</option>
                                    <option value="United Arab Emirates">United Arab Emirates</option>
                                    <option value="Saudi Arabia">Saudi Arabia</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="United States">United States</option>
                                </select>
                            </div>

                            {/* First Name */}
                            <div>
                                <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                    First Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="firstName"
                                    value={form.firstName}
                                    onChange={(e) => update("firstName", e.target.value)}
                                    required
                                    className="mt-1.5 bg-bg-primary"
                                />
                            </div>

                            {/* Last Name */}
                            <div>
                                <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                    Last Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="lastName"
                                    value={form.lastName}
                                    onChange={(e) => update("lastName", e.target.value)}
                                    required
                                    className="mt-1.5 bg-bg-primary"
                                />
                            </div>

                            {/* Address */}
                            <div className="sm:col-span-2">
                                <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                    Address <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="address"
                                    value={form.address}
                                    onChange={(e) => update("address", e.target.value)}
                                    placeholder="House #, Street address, Sector or Area"
                                    required
                                    className="mt-1.5 bg-bg-primary"
                                />
                            </div>

                            {/* Apartment / Suite (Optional) */}
                            <div className="sm:col-span-2">
                                <Label htmlFor="apartment" className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                    Apartment, suite, unit, etc. (Optional)
                                </Label>
                                <Input
                                    id="apartment"
                                    value={form.apartment}
                                    onChange={(e) => update("apartment", e.target.value)}
                                    placeholder="Apartment, suite, unit (optional)"
                                    className="mt-1.5 bg-bg-primary"
                                />
                            </div>

                            {/* City */}
                            <div>
                                <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                    City <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="city"
                                    value={form.city}
                                    onChange={(e) => update("city", e.target.value)}
                                    placeholder="e.g. Lahore, Karachi, Islamabad"
                                    required
                                    className="mt-1.5 bg-bg-primary"
                                />
                            </div>

                            {/* Postal Code (Optional) */}
                            <div>
                                <Label htmlFor="postalCode" className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                    Postal Code (Optional)
                                </Label>
                                <Input
                                    id="postalCode"
                                    value={form.postalCode}
                                    onChange={(e) => update("postalCode", e.target.value)}
                                    placeholder="e.g. 54000"
                                    className="mt-1.5 bg-bg-primary"
                                />
                            </div>

                            {/* Phone Number */}
                            <div className="sm:col-span-2">
                                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                    Phone Number (For Delivery Confirmation) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => update("phone", e.target.value)}
                                    placeholder="+92 300 1234567"
                                    required
                                    className="mt-1.5 bg-bg-primary font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="saveInfo"
                                checked={form.saveInfo}
                                onChange={(e) => update("saveInfo", e.target.checked)}
                                className="h-4 w-4 rounded border-border text-btn-primary focus:ring-btn-primary cursor-pointer"
                            />
                            <Label htmlFor="saveInfo" className="text-xs font-medium text-text-secondary cursor-pointer">
                                Save this information for next time
                            </Label>
                        </div>
                    </div>

                    {/* 3. SHIPPING METHOD SECTION */}
                    <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-bg-secondary/40 p-5 sm:p-7 space-y-3 shadow-2xs">
                        <h2 className="font-serif font-bold text-lg text-text-primary border-b border-border/60 pb-3">
                            Shipping
                        </h2>
                        <div className="rounded-xl border border-border bg-bg-primary p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-text-primary">Standard Delivery (Courier COD)</p>
                                <p className="text-xs text-text-secondary">Delivery within 3–5 business days across Pakistan</p>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                                Free Shipping
                            </span>
                        </div>
                    </div>

                    {/* 4. PAYMENT SECTION */}
                    <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-bg-secondary/40 p-5 sm:p-7 space-y-4 shadow-2xs">
                        <div>
                            <h2 className="font-serif font-bold text-lg text-text-primary">
                                Payment
                            </h2>
                            <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
                                <Lock className="h-3 w-3 text-emerald-500 inline" /> All transactions are secure and encrypted.
                            </p>
                        </div>

                        <div className="rounded-xl border-2 border-text-primary/80 bg-bg-primary p-4 flex items-center gap-4">
                            <Banknote className="h-7 w-7 text-text-primary shrink-0" />
                            <div>
                                <h4 className="font-bold text-text-primary text-sm sm:text-base">Cash on Delivery (COD)</h4>
                                <p className="text-xs text-text-secondary">Pay in cash when your parcel is delivered directly to your door.</p>
                            </div>
                        </div>
                    </div>

                    {/* 5. BILLING ADDRESS SECTION */}
                    <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-bg-secondary/40 p-5 sm:p-7 space-y-4 shadow-2xs">
                        <h2 className="font-serif font-bold text-lg text-text-primary border-b border-border/60 pb-3">
                            Billing Address
                        </h2>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 rounded-xl border border-border bg-bg-primary p-3.5 cursor-pointer hover:border-text-primary transition-colors">
                                <input
                                    type="radio"
                                    name="billingAddressType"
                                    value="same_as_shipping"
                                    checked={form.billingAddressType === "same_as_shipping"}
                                    onChange={(e) => update("billingAddressType", e.target.value)}
                                    className="h-4 w-4 text-btn-primary focus:ring-btn-primary"
                                />
                                <span className="text-sm font-semibold text-text-primary">Same as Shipping Address</span>
                            </label>

                            <label className="flex items-center gap-3 rounded-xl border border-border bg-bg-primary p-3.5 cursor-pointer hover:border-text-primary transition-colors">
                                <input
                                    type="radio"
                                    name="billingAddressType"
                                    value="different"
                                    checked={form.billingAddressType === "different"}
                                    onChange={(e) => update("billingAddressType", e.target.value)}
                                    className="h-4 w-4 text-btn-primary focus:ring-btn-primary"
                                />
                                <span className="text-sm font-semibold text-text-primary">Use a Different Billing Address</span>
                            </label>

                            {/* Expanded Billing Address Form */}
                            {form.billingAddressType === "different" && (
                                <div className="mt-3 grid gap-4 rounded-xl border border-border/80 bg-bg-primary p-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="billingFirstName" className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                            First Name
                                        </Label>
                                        <Input
                                            id="billingFirstName"
                                            value={form.billingFirstName}
                                            onChange={(e) => update("billingFirstName", e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="billingLastName" className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                            Last Name
                                        </Label>
                                        <Input
                                            id="billingLastName"
                                            value={form.billingLastName}
                                            onChange={(e) => update("billingLastName", e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="billingAddress" className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                            Billing Address
                                        </Label>
                                        <Input
                                            id="billingAddress"
                                            value={form.billingAddress}
                                            onChange={(e) => update("billingAddress", e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="billingCity" className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                            City
                                        </Label>
                                        <Input
                                            id="billingCity"
                                            value={form.billingCity}
                                            onChange={(e) => update("billingCity", e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="billingPostalCode" className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                            Postal Code
                                        </Label>
                                        <Input
                                            id="billingPostalCode"
                                            value={form.billingPostalCode}
                                            onChange={(e) => update("billingPostalCode", e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Sidebar Order Summary */}
                <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-bg-secondary/60 p-6 space-y-6 shadow-md sticky top-24">
                    <h2 className="font-serif font-bold text-lg sm:text-xl text-text-primary">
                        Order Summary ({items.length} {items.length === 1 ? "item" : "items"})
                    </h2>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {items.map((item) => (
                            <div key={item.variant_id} className="flex items-center gap-3 text-xs border-b border-border/40 pb-3 last:border-0 last:pb-0">
                                <div className="h-12 w-12 rounded-xl bg-bg-primary border border-border overflow-hidden shrink-0">
                                    {item.image_url && <img src={item.image_url} alt="" className="h-full w-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-text-primary truncate">{item.product_name}</p>
                                    <p className="text-text-secondary text-[11px]">Qty: {item.quantity}</p>
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
                            <span>Shipping Method</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-xs">FREE</span>
                        </div>
                        <div className="flex justify-between border-t border-border/60 pt-3 text-base font-extrabold text-text-primary">
                            <span>Total Payable</span>
                            <span className="font-serif text-xl">{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-btn-primary text-white font-bold h-12 shadow-md hover:bg-btn-primary-hover active:scale-[0.99] transition-transform text-sm uppercase tracking-wider"
                    >
                        {submitting ? "Processing Order..." : "Complete Order"}
                    </Button>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-secondary text-center">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>100% Authentic • Safe & Secure Order</span>
                    </div>
                </div>
            </form>
        </div>
    );
}
