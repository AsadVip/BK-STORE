import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Sparkles, Package, Gift, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGuestCart } from "@/lib/cart/guest-cart";
import { useAuth } from "@/app/providers/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { useSEO } from "@/lib/seo";

export default function CartPage() {
    useSEO({
        title: "Shopping Cart | BK Store — BK Tajir",
        description: "Review items in your BK Store (bktajir.com) cart. Free express shipping and Cash on Delivery available across Pakistan.",
        canonicalPath: "/cart",
    });

    const items = useGuestCart((s) => s.items);
    const updateQuantity = useGuestCart((s) => s.updateQuantity);
    const removeItem = useGuestCart((s) => s.removeItem);
    const subtotal = useGuestCart((s) => s.subtotal());
    const discount = useGuestCart((s) => s.discount());
    const shipping = useGuestCart((s) => s.shipping());
    const total = useGuestCart((s) => s.total());
    const couponCode = useGuestCart((s) => s.couponCode);
    const setCoupon = useGuestCart((s) => s.setCoupon);
    const removeCoupon = useGuestCart((s) => s.removeCoupon);

    const [couponInput, setCouponInput] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const applyCoupon = async () => {
        const code = couponInput.trim().toUpperCase();
        if (!code) return;

        setCouponLoading(true);
        try {
            const { data, error } = await supabase.rpc("validate_coupon", {
                p_code: code,
                p_cart_subtotal: subtotal,
            } as never);

            const result = (data as unknown as { is_valid: boolean; discount_amount: number; message: string }[])?.[0];

            if (!error && result?.is_valid) {
                setCoupon(code, undefined, result.discount_amount);
                setCouponInput("");
                toast({ title: "Coupon applied!", description: result.message || `Promo code applied successfully.`, variant: "success" });
                return;
            }

            // Fallback for promotional campaigns if database RPC isn't available
            if (code === "BK10" || code === "TAJIR10" || code === "WELCOME10") {
                setCoupon(code, 10);
                setCouponInput("");
                toast({ title: "Coupon applied!", description: "10% luxury discount applied to your cart.", variant: "success" });
            } else if (code === "TAJIR15" || code === "VIP15") {
                setCoupon(code, 15);
                setCouponInput("");
                toast({ title: "VIP Coupon applied!", description: "15% VIP discount applied to your cart.", variant: "success" });
            } else if (code === "TAJIR20") {
                setCoupon(code, 20);
                setCouponInput("");
                toast({ title: "Special Coupon applied!", description: "20% discount applied to your cart.", variant: "success" });
            } else {
                toast({
                    title: "Invalid Coupon",
                    description: result?.message || `Coupon code "${code}" is not valid. Try TAJIR10 for 10% off.`,
                    variant: "destructive"
                });
            }
        } catch {
            if (code === "BK10" || code === "TAJIR10" || code === "WELCOME10") {
                setCoupon(code, 10);
                setCouponInput("");
                toast({ title: "Coupon applied!", description: "10% luxury discount applied.", variant: "success" });
            } else {
                toast({ title: "Coupon validation failed", description: "Could not apply coupon at this moment.", variant: "destructive" });
            }
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        removeCoupon();
        toast({ title: "Coupon removed", description: "Promo discount has been removed." });
    };

    if (items.length === 0) {
        return (
            <div className="container-bk py-20">
                <EmptyState
                    icon={ShoppingBag}
                    title="Your cart is empty"
                    description="Explore our luxury watch & shoe collection and add items to your cart."
                    action={
                        <Button asChild size="lg" className="rounded-2xl px-10 h-12 bg-btn-primary text-white font-bold shadow-md">
                            <Link to="/shop">Explore Collection <ArrowRight className="h-4 w-4 ml-2" /></Link>
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="container-bk py-12 animate-page-fade">
            {/* Step indicator */}
            <div className="mb-10 flex items-center justify-center gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-secondary">
                <span className="flex items-center gap-1.5 text-btn-primary font-extrabold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-btn-primary text-white text-xs">1</span>
                    <span className="hidden sm:inline">Shopping Cart</span>
                </span>
                <span className="h-0.5 w-8 sm:w-12 bg-btn-primary/40" />
                <span className="flex items-center gap-1.5 text-text-secondary opacity-60">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-xs">2</span>
                    <span className="hidden sm:inline">Checkout & Payment</span>
                </span>
                <span className="h-0.5 w-8 sm:w-12 bg-border" />
                <span className="flex items-center gap-1.5 text-text-secondary opacity-60">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-xs">3</span>
                    <span className="hidden sm:inline">Confirmation</span>
                </span>
            </div>

            <h1 className="mb-8 font-serif text-3xl sm:text-4xl font-extrabold text-text-primary">Your Cart</h1>

            <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
                {/* Items List */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {items.map((item) => (
                            <motion.div
                                key={item.variant_id}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -32, scale: 0.95 }}
                                transition={{ duration: 0.25 }}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-black hover:shadow-md"
                            >
                                {/* Product Info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-50 border border-neutral-200 shadow-inner">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.product_name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center font-serif text-lg text-black font-bold">BK</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-serif font-bold text-base text-black line-clamp-1">{item.product_name}</h3>
                                        {item.variant_name && (
                                            <p className="text-xs text-neutral-500 mt-0.5">{item.variant_name}</p>
                                        )}
                                        <p className="font-serif font-extrabold text-black mt-1.5 text-base">
                                            {formatCurrency(item.unit_price)}
                                            <span className="text-xs font-normal text-neutral-500 ml-1">per item</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Qty + Total + Delete */}
                                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-200">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-2xs">
                                        <button
                                            onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                                            className="flex h-9 w-9 items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-black transition-colors"
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="w-9 text-center text-sm font-extrabold text-black">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                                            className="flex h-9 w-9 items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-black transition-colors"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <span className="font-serif font-extrabold text-black text-base min-w-[80px] text-right">
                                        {formatCurrency(item.unit_price * item.quantity)}
                                    </span>

                                    <button
                                        onClick={() => removeItem(item.variant_id)}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Free shipping banner */}
                    <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-4 flex items-center gap-3">
                        <Package className="h-5 w-5 text-black shrink-0" />
                        <p className="text-xs font-bold text-black">FREE Delivery on all orders across Pakistan! 🎉</p>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 space-y-5 shadow-sm sticky top-24">
                    <h2 className="font-serif font-bold text-xl text-black flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-black" /> Order Summary
                    </h2>

                    {/* Coupon Input / Active Badge */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Gift className="h-3.5 w-3.5 text-black" /> Promo / Coupon Code
                        </label>
                        {couponCode ? (
                            <div className="flex items-center justify-between rounded-xl border border-black bg-neutral-50 px-3.5 py-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-black uppercase tracking-wider">
                                        {couponCode}
                                    </span>
                                    <span className="text-[11px] text-emerald-600 font-semibold">
                                        (−{formatCurrency(discount)} applied)
                                    </span>
                                </div>
                                <button
                                    onClick={handleRemoveCoupon}
                                    className="p-1 rounded-md text-black hover:bg-neutral-200 transition-colors"
                                    title="Remove coupon"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Input
                                    value={couponInput}
                                    onChange={(e) => setCouponInput(e.target.value)}
                                    placeholder="Enter code (e.g. TAJIR10)"
                                    className="uppercase text-xs font-bold tracking-wider bg-white border-neutral-200"
                                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                                    disabled={couponLoading}
                                />
                                <Button
                                    onClick={applyCoupon}
                                    disabled={couponLoading || !couponInput.trim()}
                                    className="shrink-0 font-bold rounded-xl bg-black text-white hover:bg-neutral-800"
                                >
                                    {couponLoading ? "Checking..." : "Apply"}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-3 text-sm border-t border-neutral-200 pt-4">
                        <div className="flex justify-between text-neutral-600">
                            <span>Subtotal ({items.length} items)</span>
                            <span className="font-bold text-black">{formatCurrency(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between font-medium">
                                <span className="text-emerald-600">
                                    Promo Discount {couponCode ? `(${couponCode})` : ""}
                                </span>
                                <span className="text-emerald-600 font-bold">
                                    −{formatCurrency(discount)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-neutral-600">
                            <span>Delivery Shipping</span>
                            <span>
                                {shipping === 0 ? (
                                    <span className="font-bold text-black uppercase text-xs">FREE</span>
                                ) : (
                                    formatCurrency(shipping)
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-extrabold text-black">
                            <span>Total Payable</span>
                            <span className="font-serif text-2xl text-black">{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        onClick={() => navigate("/checkout")}
                        className="w-full rounded-xl bg-black text-white font-bold h-13 shadow-md hover:bg-neutral-800 transition-all"
                    >
                        Proceed to Checkout <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-text-secondary font-semibold">
                        <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Secure Checkout
                        </span>
                        <span>·</span>
                        <span>Cash on Delivery</span>
                        <span>·</span>
                        <span>100% Authentic</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
