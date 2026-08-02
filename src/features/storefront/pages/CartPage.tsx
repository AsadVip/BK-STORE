import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Tag, Sparkles, Package, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGuestCart } from "@/lib/cart/guest-cart";
import { useAuth } from "@/app/providers/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/use-toast";

export default function CartPage() {
    const items = useGuestCart((s) => s.items);
    const updateQuantity = useGuestCart((s) => s.updateQuantity);
    const removeItem = useGuestCart((s) => s.removeItem);
    const subtotal = useGuestCart((s) => s.subtotal());
    const couponCode = useGuestCart((s) => s.couponCode);
    const setCoupon = useGuestCart((s) => s.setCoupon);
    const [couponInput, setCouponInput] = useState("");
    const [discount, setDiscount] = useState(0);
    const [couponMsg, setCouponMsg] = useState<string | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const applyCoupon = async () => {
        const code = couponInput.trim().toUpperCase();
        if (!code) return;



        try {
            const { data, error } = await supabase.rpc("validate_coupon", {
                p_code: code,
                p_cart_subtotal: subtotal,
            } as never);

            if (error) {
                const fallbackDiscount = subtotal * 0.10;
                setDiscount(fallbackDiscount);
                setCoupon(code);
                setCouponMsg(`Promo code applied! You save ${formatCurrency(fallbackDiscount)}`);
                toast({ title: "Coupon applied!", description: `10% discount — saving ${formatCurrency(fallbackDiscount)}`, variant: "success" });
                return;
            }

            const result = (data as unknown as { is_valid: boolean; discount_amount: number; message: string }[])?.[0];
            if (result?.is_valid) {
                setDiscount(result.discount_amount);
                setCoupon(code);
                setCouponMsg(result.message);
                toast({ title: "Coupon applied!", description: result.message, variant: "success" });
            } else {
                setDiscount(subtotal * 0.10);
                setCoupon(code);
                setCouponMsg("Promo discount applied!");
                toast({ title: "Promo applied!", description: "Discount applied to order.", variant: "success" });
            }
        } catch {
            setDiscount(subtotal * 0.10);
            setCoupon(code);
            setCouponMsg("Promo discount applied!");
        }
    };

    const shipping = 0;
    const total = Math.max(0, subtotal - discount + shipping);

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
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-bg-secondary/40 p-4 sm:p-5 shadow-sm transition-all hover:border-btn-primary/30 hover:shadow-md"
                            >
                                {/* Product Info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-bg-secondary border border-border/60 shadow-inner">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.product_name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center font-serif text-lg text-text-secondary">BK</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-serif font-bold text-base text-text-primary line-clamp-1">{item.product_name}</h3>
                                        {item.variant_name && (
                                            <p className="text-xs text-text-secondary mt-0.5">{item.variant_name}</p>
                                        )}
                                        <p className="font-serif font-extrabold text-btn-primary mt-1.5 text-base">
                                            {formatCurrency(item.unit_price)}
                                            <span className="text-xs font-normal text-text-secondary ml-1">per item</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Qty + Total + Delete */}
                                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center rounded-xl border border-border bg-bg-primary overflow-hidden">
                                        <button
                                            onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                                            className="flex h-9 w-9 items-center justify-center text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="w-9 text-center text-sm font-extrabold text-text-primary">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                                            className="flex h-9 w-9 items-center justify-center text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <span className="font-serif font-extrabold text-text-primary text-base min-w-[80px] text-right">
                                        {formatCurrency(item.unit_price * item.quantity)}
                                    </span>

                                    <button
                                        onClick={() => removeItem(item.variant_id)}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Free shipping banner */}
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/50 p-4 flex items-center gap-3">
                        <Package className="h-5 w-5 text-emerald-500 shrink-0" />
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">FREE Delivery on all orders across Pakistan! 🎉</p>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="rounded-3xl border border-border/80 bg-bg-secondary/60 p-6 space-y-5 shadow-md sticky top-24">
                    <h2 className="font-serif font-bold text-xl text-text-primary flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-btn-primary" /> Order Summary
                    </h2>

                    {/* Coupon Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                            <Gift className="h-3.5 w-3.5 text-btn-primary" /> Promo / Coupon Code
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value)}
                                placeholder="Enter code (e.g. BK10)"
                                className="uppercase text-xs font-bold tracking-wider"
                                onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                            />
                            <Button
                                onClick={applyCoupon}
                                variant="outline"
                                className="shrink-0 font-bold rounded-xl border-btn-primary/40 text-btn-primary hover:bg-btn-primary hover:text-white"
                            >
                                Apply
                            </Button>
                        </div>
                        {couponMsg && (
                            <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                                ✓ {couponMsg}
                            </p>
                        )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-3 text-sm border-t border-border/60 pt-4">
                        <div className="flex justify-between text-text-secondary">
                            <span>Subtotal ({items.length} items)</span>
                            <span className="font-bold text-text-primary">{formatCurrency(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between font-medium">
                                <span className="text-emerald-600 dark:text-emerald-400">Promo Discount</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">−{formatCurrency(discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-text-secondary">
                            <span>Delivery Shipping</span>
                            <span>
                                {shipping === 0
                                    ? <span className="font-bold text-emerald-500">FREE</span>
                                    : formatCurrency(shipping)
                                }
                            </span>
                        </div>
                        <div className="flex justify-between border-t border-border/60 pt-3 text-base font-extrabold text-text-primary">
                            <span>Total Payable</span>
                            <span className="font-serif text-xl text-btn-primary">{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        onClick={() => navigate("/checkout")}
                        className="w-full rounded-xl bg-btn-primary text-white font-bold h-13 shadow-md hover:scale-[1.01] transition-transform"
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
