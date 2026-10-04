import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { useGuestCart } from "@/lib/cart/guest-cart";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
    const items = useGuestCart((s) => s.items);
    const isOpen = useGuestCart((s) => s.isDrawerOpen);
    const setOpen = useGuestCart((s) => s.setDrawerOpen);
    const updateQuantity = useGuestCart((s) => s.updateQuantity);
    const removeItem = useGuestCart((s) => s.removeItem);
    const subtotal = useGuestCart((s) => s.subtotal());
    const discount = useGuestCart((s) => s.discount());
    const couponCode = useGuestCart((s) => s.couponCode);
    const total = useGuestCart((s) => s.total());
    const navigate = useNavigate();

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleCheckout = () => {
        setOpen(false);
        navigate("/checkout");
    };

    const handleViewCart = () => {
        setOpen(false);
        navigate("/cart");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex">
                    {/* Dark Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Left Sliding Drawer Panel */}
                    <motion.aside
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", stiffness: 350, damping: 35 }}
                        className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-r border-neutral-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                                    <ShoppingBag className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-serif text-lg font-bold text-black">
                                        Your Cart
                                    </h2>
                                    <p className="text-xs text-neutral-500">
                                        {items.length} {items.length === 1 ? "item" : "items"} selected
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black"
                                aria-label="Close cart drawer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            {items.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-center py-12">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200 mb-4 text-neutral-500">
                                        <ShoppingBag className="h-8 w-8" />
                                    </div>
                                    <h3 className="font-serif text-lg font-bold text-black mb-1">
                                        Your cart is empty
                                    </h3>
                                    <p className="text-xs text-neutral-500 max-w-[240px] mb-6">
                                        Looks like you haven't added any luxury items to your cart yet.
                                    </p>
                                    <Button
                                        onClick={() => setOpen(false)}
                                        className="rounded-xl bg-black px-6 text-white font-semibold shadow-md hover:bg-neutral-800 transition-colors"
                                    >
                                        Start Shopping
                                    </Button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <motion.div
                                        key={item.variant_id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-xs transition-all hover:border-black"
                                    >
                                        {/* Product Image */}
                                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-50 border border-neutral-200">
                                            {item.image_url ? (
                                                 <img
                                                    src={item.image_url}
                                                    alt={item.product_name}
                                                    className="h-full w-full object-cover object-center"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs font-serif text-black font-bold">
                                                    BK
                                                </div>
                                            )}
                                        </div>

                                        {/* Item Info */}
                                        <div className="flex flex-1 flex-col justify-between min-w-0">
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="line-clamp-1 font-sans text-sm font-bold text-black">
                                                        {item.product_name}
                                                    </h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.variant_id)}
                                                        className="text-neutral-400 transition-colors hover:text-black shrink-0"
                                                        title="Remove item"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                {item.variant_name && (
                                                    <p className="text-[11px] font-medium text-neutral-500 mt-0.5">
                                                        Variant: {item.variant_name}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 mt-1 border-t border-neutral-100">
                                                {/* Quantity Controls */}
                                                <div className="flex items-center rounded-lg border border-neutral-200 bg-white shadow-2xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                                                        className="flex h-7 w-7 items-center justify-center text-neutral-600 hover:text-black"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-7 text-center font-mono text-xs font-bold text-black">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                                                        className="flex h-7 w-7 items-center justify-center text-neutral-600 hover:text-black"
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>

                                                <span className="font-sans text-sm font-bold text-black">
                                                    {formatCurrency(item.unit_price * item.quantity)}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Drawer Footer */}
                        {items.length > 0 && (
                            <div className="border-t border-neutral-200 bg-white px-6 py-5 space-y-4 shrink-0 shadow-lg">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-neutral-600">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-black">{formatCurrency(subtotal)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-black font-medium">
                                            <span>Discount {couponCode ? `(${couponCode})` : ""}</span>
                                            <span className="font-bold">−{formatCurrency(discount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-neutral-600">
                                        <span>Shipping</span>
                                        <span className="font-bold text-black uppercase text-xs">Free</span>
                                    </div>
                                    <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-extrabold text-black">
                                        <span>Total</span>
                                        <span className="font-serif text-lg">{formatCurrency(total)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-600 bg-neutral-50 py-1.5 rounded-lg border border-neutral-200">
                                    <ShieldCheck className="h-3.5 w-3.5 text-black" />
                                    <span>Encrypted & Safe Checkout • Cash on Delivery</span>
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <Button
                                        onClick={handleCheckout}
                                        size="lg"
                                        className="w-full rounded-xl bg-black font-bold text-white shadow-md hover:bg-neutral-800 transition-transform active:scale-[0.99] h-12 text-sm"
                                    >
                                        Proceed to Checkout <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleViewCart}
                                        className="w-full rounded-xl border-neutral-300 font-semibold text-black hover:bg-neutral-100 h-10 text-xs"
                                    >
                                        View Full Cart
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
}
