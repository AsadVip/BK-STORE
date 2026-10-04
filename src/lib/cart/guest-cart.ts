import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Guest cart store — persisted to localStorage for unauthenticated users.
 * Robust price calculation and coupon management.
 */
export interface GuestCartItem {
    variant_id: string;
    product_id: string;
    product_name: string;
    variant_name: string | null;
    sku: string;
    unit_price: number;
    image_url: string | null;
    quantity: number;
}

interface CartState {
    items: GuestCartItem[];
    couponCode: string | null;
    discountPercent: number;
    discountAmount: number;
    isDrawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
    addItem: (item: GuestCartItem) => void;
    updateQuantity: (variantId: string, quantity: number) => void;
    removeItem: (variantId: string) => void;
    clear: () => void;
    setCoupon: (code: string | null, percent?: number, amount?: number) => void;
    removeCoupon: () => void;
    subtotal: () => number;
    discount: () => number;
    shipping: () => number;
    total: () => number;
    count: () => number;
}

export const useGuestCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            couponCode: null,
            discountPercent: 0,
            discountAmount: 0,
            isDrawerOpen: false,
            setDrawerOpen: (open) => set({ isDrawerOpen: open }),
            addItem: (item) =>
                set((state) => {
                    const cleanQuantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
                    const cleanPrice = Math.max(0, Number(item.unit_price) || 0);
                    const cleanItem = { ...item, quantity: cleanQuantity, unit_price: cleanPrice };

                    const existing = state.items.find((i) => i.variant_id === cleanItem.variant_id);
                    if (existing) {
                        return {
                            isDrawerOpen: true,
                            items: state.items.map((i) =>
                                i.variant_id === cleanItem.variant_id
                                    ? { ...i, quantity: i.quantity + cleanQuantity }
                                    : i,
                            ),
                        };
                    }
                    return { isDrawerOpen: true, items: [...state.items, cleanItem] };
                }),
            updateQuantity: (variantId, quantity) =>
                set((state) => {
                    const cleanQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
                    if (cleanQuantity <= 0) {
                        return {
                            items: state.items.filter((i) => i.variant_id !== variantId),
                        };
                    }
                    return {
                        items: state.items.map((i) =>
                            i.variant_id === variantId ? { ...i, quantity: cleanQuantity } : i,
                        ),
                    };
                }),
            removeItem: (variantId) =>
                set((state) => ({
                    items: state.items.filter((i) => i.variant_id !== variantId),
                })),
            clear: () => set({ items: [], couponCode: null, discountPercent: 0, discountAmount: 0 }),
            setCoupon: (code, percent = 0, amount = 0) =>
                set({
                    couponCode: code ? code.trim().toUpperCase() : null,
                    discountPercent: Math.max(0, Number(percent) || 0),
                    discountAmount: Math.max(0, Number(amount) || 0),
                }),
            removeCoupon: () => set({ couponCode: null, discountPercent: 0, discountAmount: 0 }),
            subtotal: () =>
                get().items.reduce((sum, i) => {
                    const price = Math.max(0, Number(i.unit_price) || 0);
                    const qty = Math.max(1, Math.floor(Number(i.quantity) || 1));
                    return sum + price * qty;
                }, 0),
            discount: () => {
                const st = get().subtotal();
                if (st <= 0) return 0;
                const code = get().couponCode;
                if (!code) return 0;

                const pct = get().discountPercent;
                if (pct > 0) {
                    return Math.round(st * (pct / 100));
                }

                const fixed = get().discountAmount;
                if (fixed > 0) {
                    return Math.min(st, Math.round(fixed));
                }

                return 0;
            },
            shipping: () => 0, // Free nationwide delivery
            total: () => Math.max(0, get().subtotal() - get().discount() + get().shipping()),
            count: () =>
                get().items.reduce(
                    (sum, i) => sum + (Math.max(1, Math.floor(Number(i.quantity) || 1))),
                    0,
                ),
        }),
        {
            name: "bk-guest-cart",
            partialize: (state) => ({
                items: state.items,
                couponCode: state.couponCode,
                discountPercent: state.discountPercent,
                discountAmount: state.discountAmount,
            }),
        },
    ),
);
