import { create } from "zustand";
import { ProductCardData } from "@/components/product/product-card";

interface QuickViewStore {
    product: ProductCardData | null;
    isOpen: boolean;
    openQuickView: (product: ProductCardData) => void;
    closeQuickView: () => void;
}

export const useQuickView = create<QuickViewStore>((set) => ({
    product: null,
    isOpen: false,
    openQuickView: (product) => set({ product, isOpen: true }),
    closeQuickView: () => set({ isOpen: false, product: null }),
}));
