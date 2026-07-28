import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Brand = Database["public"]["Tables"]["brands"]["Row"];
type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Banner = Database["public"]["Tables"]["banners"]["Row"];

export interface ProductWithRelations extends Product {
    brand: Brand | null;
    categories: Category[];
    variants: ProductVariant[];
    images: ProductImage[];
    primary_image_url: string | null;
    in_stock: boolean;
    min_price: number;
}

export interface ProductListItem {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    compare_at_price: number | null;
    rating_average: number;
    rating_count: number;
    primary_image_url: string | null;
    in_stock: boolean;
    brand_name: string | null;
}

export interface ShopFilters {
    category?: string;
    brand?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: "newest" | "price_asc" | "price_desc" | "popular" | "rating";
    /** Restrict to products flagged for a specific homepage section. */
    placement?: "new_arrival" | "best_seller" | "featured";
    page?: number;
    pageSize?: number;
}

export function normalizeVariantImage(v: any): string | null {
    if (!v) return null;
    if (typeof v.image_url === "string" && v.image_url.trim()) return v.image_url.trim();
    if (typeof v.image === "string" && v.image.trim()) return v.image.trim();
    let opts = v.option_values;
    if (opts) {
        if (typeof opts === "string") {
            try { opts = JSON.parse(opts); } catch (e) { opts = null; }
        }
        if (opts && typeof opts === "object") {
            if (typeof opts.image_url === "string" && opts.image_url.trim()) return opts.image_url.trim();
            if (typeof opts.image === "string" && opts.image.trim()) return opts.image.trim();
            if (typeof opts.img === "string" && opts.img.trim()) return opts.img.trim();
            if (typeof opts.url === "string" && opts.url.trim()) return opts.url.trim();
        }
    }
    return null;
}

/**
 * Fetch a single product by slug with all relations.
 */
export function useProduct(slug: string | undefined) {
    return useQuery<ProductWithRelations | null>({
        queryKey: ["product", slug],
        queryFn: async () => {
            if (!slug) return null;
            const { data: product, error } = await supabase
                .from("products")
                .select(`*, brand:brands(*)`)
                .eq("slug", slug)
                .eq("status", "published")
                .is("deleted_at", null)
                .single();
            if (error || !product) return null;

            const p = product as unknown as Product & { brand: Brand | null };

            const [categories, variants, images] = await Promise.all([
                supabase
                    .from("product_categories")
                    .select(`category:categories(*)`)
                    .eq("product_id", p.id),
                supabase
                    .from("product_variants")
                    .select("*")
                    .eq("product_id", p.id)
                    .eq("is_active", true)
                    .is("deleted_at", null)
                    .order("created_at", { ascending: true }),
                supabase
                    .from("product_images")
                    .select("*")
                    .eq("product_id", p.id)
                    .order("sort_order"),
            ]);

            const catRows = ((categories.data ?? []) as unknown as { category: Category }[]).map((c) => c.category);
            const rawVariantRows = (variants.data ?? []) as unknown as (ProductVariant & { image_url?: string })[];
            const variantRows = rawVariantRows.map((v) => ({
                ...v,
                image_url: normalizeVariantImage(v),
            }));
            const imageRows = (images.data ?? []) as unknown as ProductImage[];

            const primaryImage = imageRows.find((i) => i.is_primary) ?? imageRows[0] ?? null;
            const inStock = variantRows.some((v) => v.stock_quantity > 0);
            const minPrice = variantRows.reduce((min, v) => Math.min(min, v.price), p.base_price);

            return {
                ...p,
                brand: p.brand,
                categories: catRows,
                variants: variantRows,
                images: imageRows,
                primary_image_url: (p as any).primary_image_url || primaryImage?.url || null,
                in_stock: inStock,
                min_price: minPrice,
            } as ProductWithRelations;
        },
        enabled: !!slug,
        staleTime: 5 * 1000,
    });
}

/**
 * Fetch dynamic product variants by product_id.
 */
export function useProductVariantsById(productId: string | undefined) {
    return useQuery<any[]>({
        queryKey: ["product_variants", productId],
        queryFn: async () => {
            if (!productId) return [];
            const { data, error } = await supabase
                .from("product_variants" as any)
                .select("*")
                .eq("product_id", productId)
                .eq("is_active", true)
                .is("deleted_at", null)
                .order("created_at", { ascending: true });
            if (error) {
                console.warn("Error fetching variants:", error);
                return [];
            }
            const raw = (data ?? []) as any[];
            return raw.map((v) => ({
                ...v,
                image_url: normalizeVariantImage(v),
            }));
        },
        enabled: !!productId,
        staleTime: 10 * 1000,
    });
}

/**
 * Fetch product details (like full description) by product_id.
 */
export function useProductDetailsById(productId: string | undefined) {
    return useQuery({
        queryKey: ["product_details_by_id", productId],
        queryFn: async () => {
            if (!productId) return null;
            const { data, error } = await supabase
                .from("products" as any)
                .select("*")
                .eq("id", productId)
                .maybeSingle();
            if (error || !data) return null;
            return data as Product;
        },
        enabled: !!productId,
        staleTime: 10 * 1000,
    });
}

/**
 * Fetch a paginated, filterable product list for the shop/search pages.
 */
export function useProducts(filters: ShopFilters = {}) {
    const { category, brand, search, minPrice, maxPrice, sort = "newest", placement, page = 1, pageSize = 12 } = filters;
    return useQuery<{ items: ProductListItem[]; total: number; pages: number }>({
        queryKey: ["products", filters],
        queryFn: async () => {
            let query = supabase
                .from("products")
                .select(`*, brand:brands(name)`, { count: "exact" })
                .eq("status", "published")
                .is("deleted_at", null);

            if (placement === "new_arrival") query = query.eq("is_new_arrival", true);
            else if (placement === "best_seller") query = query.eq("is_best_seller", true);
            else if (placement === "featured") query = query.eq("is_featured", true);

            if (search) {
                query = query.textSearch("search_document", search, { type: "websearch" });
            }
            if (minPrice !== undefined) query = query.gte("base_price", minPrice);
            if (maxPrice !== undefined) query = query.lte("base_price", maxPrice);

            switch (sort) {
                case "price_asc": query = query.order("base_price", { ascending: true }); break;
                case "price_desc": query = query.order("base_price", { ascending: false }); break;
                case "popular": query = query.order("rating_count", { ascending: false }); break;
                case "rating": query = query.order("rating_average", { ascending: false }); break;
                default: query = query.order("created_at", { ascending: false });
            }

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;
            if (error) throw error;

            let products = (data ?? []) as unknown as (Product & { brand: { name: string } | null })[];

            // Filter by category via join if requested.
            if (category) {
                const { data: links } = await supabase
                    .from("product_categories")
                    .select("product_id")
                    .eq("category_id", category);
                const ids = ((links ?? []) as unknown as { product_id: string }[]).map((l) => l.product_id);
                products = products.filter((p) => ids.includes(p.id));
            }
            if (brand) {
                products = products.filter((p) => p.brand_id === brand);
            }

            // Fetch primary images & stock availability for the page safely.
            const productIds = products.map((p) => p.id);
            let imageRows: { product_id: string; url: string; is_primary: boolean }[] = [];
            let variantRows: { product_id: string; stock_quantity: number }[] = [];

            if (productIds.length > 0) {
                const [imagesRes, variantsRes] = await Promise.all([
                    supabase
                        .from("product_images")
                        .select("product_id, url, is_primary")
                        .in("product_id", productIds)
                        .order("sort_order"),
                    supabase
                        .from("product_variants")
                        .select("product_id, stock_quantity")
                        .in("product_id", productIds),
                ]);
                imageRows = (imagesRes.data ?? []) as unknown as { product_id: string; url: string; is_primary: boolean }[];
                variantRows = (variantsRes.data ?? []) as unknown as { product_id: string; stock_quantity: number }[];
            }

            const imageMap = new Map<string, string>();
            imageRows.forEach((img) => {
                if (img.url && (img.is_primary || !imageMap.has(img.product_id))) {
                    imageMap.set(img.product_id, img.url);
                }
            });
            const stockMap = new Map<string, boolean>();
            const variantProductIds = new Set<string>();
            variantRows.forEach((v) => {
                variantProductIds.add(v.product_id);
                if (v.stock_quantity > 0) stockMap.set(v.product_id, true);
            });

            const items: ProductListItem[] = products.map((p) => {
                const directPrimary = (p as any).primary_image_url;
                const tablePrimary = imageMap.get(p.id);
                return {
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    base_price: p.base_price,
                    compare_at_price: p.compare_at_price,
                    rating_average: p.rating_average,
                    rating_count: p.rating_count,
                    primary_image_url: directPrimary || tablePrimary || null,
                    in_stock: variantProductIds.has(p.id) ? (stockMap.get(p.id) ?? false) : true,
                    brand_name: p.brand?.name ?? null,
                };
            });

            return { items, total: count ?? 0, pages: Math.ceil((count ?? 0) / pageSize) };
        },
        staleTime: 5 * 1000,
    });
}

/**
 * Fetch all visible categories (for nav, shop sidebar, categories page).
 */
export function useCategories() {
    return useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .eq("is_visible", true)
                .is("deleted_at", null)
                .order("sort_order");
            if (error) throw error;
            return (data ?? []) as unknown as Category[];
        },
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Fetch featured brands.
 */
export function useBrands() {
    return useQuery<Brand[]>({
        queryKey: ["brands"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("brands")
                .select("*")
                .is("deleted_at", null)
                .order("name");
            if (error) throw error;
            return (data ?? []) as unknown as Brand[];
        },
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Fetch approved reviews for a product.
 */
export function useProductReviews(productId: string | undefined) {
    return useQuery<any[]>({
        queryKey: ["product-reviews", productId],
        queryFn: async () => {
            if (!productId) return [];
            const { data, error } = await supabase
                .from("reviews")
                .select("*")
                .eq("product_id", productId)
                .is("deleted_at", null)
                .order("created_at", { ascending: false });

            if (error || !data) {
                return [];
            }
            return data;
        },
        enabled: !!productId,
        staleTime: 5 * 1000,
    });
}

/**
 * Fetch published banners by placement.
 *
 * Banners are returned as-is (ordered by sort_order) without any schedule
 * filtering. The admin controls visibility through `is_published`, so any
 * published banner for the given placement is shown immediately. Earlier
 * versions filtered `start_at`/`end_at` either via PostgREST `.or()` or
 * client-side, which caused banners to be hidden when the admin entered
 * future start times; scheduling is intentionally not applied here.
 */
export function useBanners(placement: string) {
    return useQuery<Banner[]>({
        queryKey: ["banners", placement],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("banners")
                .select("*")
                .eq("is_published", true)
                .eq("placement", placement)
                .order("sort_order");
            if (error) throw error;

            return (data ?? []) as unknown as Banner[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Fetch store settings (singleton).
 */
export function useStoreSettings() {
    return useQuery<Database["public"]["Tables"]["store_settings"]["Row"]>({
        queryKey: ["store-settings"],
        queryFn: async () => {
            const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
            if (error) throw error;
            return data as unknown as Database["public"]["Tables"]["store_settings"]["Row"];
        },
        staleTime: 10 * 60 * 1000,
    });
}
