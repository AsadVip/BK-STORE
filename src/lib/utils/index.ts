import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names intelligently (clsx + tailwind-merge).
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a numeric amount as a currency string.
 */
export function formatCurrency(
    amount: number,
    currency: string = "PKR",
    locale: string = "en-PK",
): string {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format an ISO date string into a readable date.
 */
export function formatDate(
    date: string | Date | null | undefined,
    opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
): string {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", opts).format(d);
}

/**
 * Generate a stable session id for guest carts/wishlists (stored in localStorage).
 */
export function getOrCreateSessionId(): string {
    const KEY = "bk_session_id";
    let id = localStorage.getItem(KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(KEY, id);
    }
    return id;
}

/**
 * Truncate text with an ellipsis.
 */
export function truncate(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * Compute the discounted price of a product/variant.
 * Handles both explicit compare_at_price and global flash sale percentage seamlessly without double discounting.
 */
export function computeSalePrice(
    basePrice: number,
    compareAtPrice?: number | null,
    flashSaleConfig?: { is_active?: boolean; discount_percentage?: number } | null,
): { isOnSale: boolean; salePrice: number; compareAt: number | null; discountPercent: number } {
    let effectiveCompareAt = compareAtPrice && compareAtPrice > basePrice ? compareAtPrice : null;
    let salePrice = basePrice;

    const flashActive = Boolean(flashSaleConfig?.is_active) && (flashSaleConfig?.discount_percentage ?? 0) > 0;
    const flashPct = flashActive ? (flashSaleConfig?.discount_percentage ?? 0) : 0;

    if (flashActive && flashPct > 0) {
        const original = effectiveCompareAt ?? basePrice;
        const calculatedFlashPrice = Math.round(original * ((100 - flashPct) / 100));
        salePrice = Math.min(basePrice, calculatedFlashPrice);
        effectiveCompareAt = original;
    }

    if (effectiveCompareAt && effectiveCompareAt > salePrice) {
        const discountPercent = Math.round(((effectiveCompareAt - salePrice) / effectiveCompareAt) * 100);
        return {
            isOnSale: true,
            salePrice,
            compareAt: effectiveCompareAt,
            discountPercent,
        };
    }

    return {
        isOnSale: false,
        salePrice: basePrice,
        compareAt: effectiveCompareAt,
        discountPercent: 0,
    };
}

/**
 * Sleep helper (for demos / loading states).
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a query string from a params object.
 */
export function buildQueryString(params: Record<string, string | number | undefined | null>): string {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            sp.set(key, String(value));
        }
    });
    const qs = sp.toString();
    return qs ? `?${qs}` : "";
}
