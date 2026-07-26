import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Guest wishlist store — persisted to localStorage for unauthenticated users.
 * On login, items are merged into the user's DB wishlist.
 */
interface WishlistState {
    productIds: string[];
    toggle: (productId: string) => void;
    has: (productId: string) => boolean;
    remove: (productId: string) => void;
    clear: () => void;
}

export const useGuestWishlist = create<WishlistState>()(
    persist(
        (set, get) => ({
            productIds: [],
            toggle: (productId) =>
                set((state) => ({
                    productIds: state.productIds.includes(productId)
                        ? state.productIds.filter((id) => id !== productId)
                        : [...state.productIds, productId],
                })),
            has: (productId) => get().productIds.includes(productId),
            remove: (productId) =>
                set((state) => ({
                    productIds: state.productIds.filter((id) => id !== productId),
                })),
            clear: () => set({ productIds: [] }),
        }),
        { name: "bk-guest-wishlist" },
    ),
);
