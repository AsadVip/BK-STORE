import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Guest cart store — persisted to localStorage for unauthenticated users.
 * On login, the guest cart is merged into the user's DB cart via the
 * `merge_guest_cart` RPC (see supabase.sql).
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
    addItem: (item: GuestCartItem) => void;
    updateQuantity: (variantId: string, quantity: number) => void;
    removeItem: (variantId: string) => void;
    clear: () => void;
    setCoupon: (code: string | null) => void;
    subtotal: () => number;
    count: () => number;
}

export const useGuestCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            couponCode: null,
            addItem: (item) =>
                set((state) => {
                    const existing = state.items.find((i) => i.variant_id === item.variant_id);
                    if (existing) {
                        return {
                            items: state.items.map((i) =>
                                i.variant_id === item.variant_id
                                    ? { ...i, quantity: i.quantity + item.quantity }
                                    : i,
                            ),
                        };
                    }
                    return { items: [...state.items, item] };
                }),
            updateQuantity: (variantId, quantity) =>
                set((state) => ({
                    items: state.items
                        .map((i) =>
                            i.variant_id === variantId ? { ...i, quantity: Math.max(1, quantity) } : i,
                        )
                        .filter((i) => i.quantity > 0),
                })),
            removeItem: (variantId) =>
                set((state) => ({
                    items: state.items.filter((i) => i.variant_id !== variantId),
                })),
            clear: () => set({ items: [], couponCode: null }),
            setCoupon: (code) => set({ couponCode: code }),
            subtotal: () => get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
            count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
        }),
        { name: "bk-guest-cart" },
    ),
);
