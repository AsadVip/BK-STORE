import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";

const STORAGE_KEY = "bk_recently_viewed_history";

export interface RecentlyViewedItem {
    id: string;
    slug: string;
    categoryIds: string[];
    timestamp: number;
}

/**
 * Record a product view into localStorage history
 */
export function recordProductView(productId: string, slug: string, categoryIds: string[] = []) {
    if (!productId) return;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        let items: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];

        // Remove existing entry if present
        items = items.filter((i) => i.id !== productId);

        // Prepend new entry
        items.unshift({
            id: productId,
            slug,
            categoryIds,
            timestamp: Date.now(),
        });

        // Limit to 12 recent items
        if (items.length > 12) {
            items = items.slice(0, 12);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        // Ignore localStorage errors
    }
}

interface YouMayAlsoLikeProps {
    currentProductId: string;
    currentCategoryIds?: string[];
    brandId?: string | null;
}

export function YouMayAlsoLike({ currentProductId, currentCategoryIds = [], brandId }: YouMayAlsoLikeProps) {
    const [recentCategories, setRecentCategories] = useState<string[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const items: RecentlyViewedItem[] = JSON.parse(raw);
                // Collect category IDs from past opened products
                const allCatIds = items.flatMap((i) => i.categoryIds || []).filter(Boolean);
                const uniqueCatIds = Array.from(new Set([...currentCategoryIds, ...allCatIds]));
                setRecentCategories(uniqueCatIds);
            } else {
                setRecentCategories(currentCategoryIds);
            }
        } catch {
            setRecentCategories(currentCategoryIds);
        }
    }, [currentProductId, currentCategoryIds.join(",")]);

    const { data: recommendations, isLoading } = useQuery<ProductCardData[]>({
        queryKey: ["you-may-also-like", currentProductId, recentCategories, brandId],
        queryFn: async () => {
            let productIdsMatchingCategories: string[] = [];

            if (recentCategories.length > 0) {
                const { data: linkData } = await supabase
                    .from("product_categories")
                    .select("product_id")
                    .in("category_id", recentCategories);

                if (linkData) {
                    productIdsMatchingCategories = linkData.map((l: any) => l.product_id);
                }
            }

            const { data, error } = await supabase
                .from("products")
                .select("*, brand:brands(name)")
                .eq("status", "published")
                .is("deleted_at", null)
                .neq("id", currentProductId)
                .order("is_featured", { ascending: false })
                .order("rating_average", { ascending: false })
                .limit(16);

            if (error) throw error;

            const products = (data ?? []) as unknown as (ProductCardData & { brand: { name: string } | null; brand_id: string })[];
            const productIds = products.map((p) => p.id);
            const imageMap = new Map<string, string>();

            if (productIds.length > 0) {
                const { data: imagesRes } = await supabase
                    .from("product_images")
                    .select("product_id, url, is_primary")
                    .in("product_id", productIds)
                    .order("sort_order");

                (imagesRes ?? []).forEach((img: any) => {
                    if (img.url && (img.is_primary || !imageMap.has(img.product_id))) {
                        imageMap.set(img.product_id, img.url);
                    }
                });
            }

            // Map brand_name & image with robust fallback
            const mapped: ProductCardData[] = products.map((p) => {
                const directImage = (p as any).primary_image_url;
                const tableImage = imageMap.get(p.id);
                return {
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    base_price: p.base_price,
                    compare_at_price: p.compare_at_price,
                    rating_average: p.rating_average ?? 5,
                    rating_count: p.rating_count ?? 1,
                    primary_image_url: directImage || tableImage || null,
                    in_stock: true,
                    brand_name: p.brand?.name ?? null,
                };
            });

            // Rank products: products from recently viewed collections first!
            if (productIdsMatchingCategories.length > 0) {
                mapped.sort((a, b) => {
                    const aMatches = productIdsMatchingCategories.includes(a.id) ? 1 : 0;
                    const bMatches = productIdsMatchingCategories.includes(b.id) ? 1 : 0;
                    return bMatches - aMatches;
                });
            }

            return mapped.slice(0, 4);
        },
        enabled: Boolean(currentProductId),
    });

    if (!isLoading && (!recommendations || recommendations.length === 0)) {
        return null;
    }

    return (
        <section className="py-12 sm:py-16 bg-bg-secondary/30 border-t border-border/60">
            <div className="container-bk px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-3"
                >
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-btn-primary mb-1">
                            <Sparkles className="h-4 w-4" />
                            <span>RECOMMENDED FOR YOU</span>
                        </div>
                        <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                            You May Also Like
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-text-secondary max-w-xs">
                        Handpicked based on your past browsing history and favorite collections.
                    </p>
                </motion.div>

                {/* Product Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <ProductCardSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {recommendations?.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
