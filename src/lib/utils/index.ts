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
 */
export function computeSalePrice(
    price: number,
    compareAtPrice: number | null | undefined,
): { isOnSale: boolean; salePrice: number; discountPercent: number } {
    if (compareAtPrice && compareAtPrice > price) {
        return {
            isOnSale: true,
            salePrice: price,
            discountPercent: Math.round(((compareAtPrice - price) / compareAtPrice) * 100),
        };
    }
    return { isOnSale: false, salePrice: price, discountPercent: 0 };
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
