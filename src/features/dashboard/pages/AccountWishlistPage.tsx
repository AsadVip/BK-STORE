import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useGuestWishlist } from "@/lib/cart/guest-wishlist";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/product/product-card-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function AccountWishlistPage() {
    const guestIds = useGuestWishlist((s) => s.productIds);
    const toggle = useGuestWishlist((s) => s.toggle);

    const { data: products, isLoading } = useQuery<ProductCardData[]>({
        queryKey: ["wishlist-products", guestIds],
        queryFn: async () => {
            if (guestIds.length === 0) return [];
            const { data } = await supabase
                .from("products")
                .select("id, name, slug, base_price, compare_at_price, rating_average, rating_count, status")
                .in("id", guestIds)
                .eq("status", "published");
            const rows = (data ?? []) as unknown as ProductCardData[];
            const { data: images } = await supabase.from("product_images").select("product_id, url, is_primary").in("product_id", guestIds);
            const { data: variants } = await supabase.from("product_variants").select("product_id, stock_quantity").in("product_id", guestIds);
            const imageMap = new Map<string, string>();
            (images ?? []).forEach((img) => { const i = img as unknown as { product_id: string; url: string }; if (i.url) imageMap.set(i.product_id, i.url); });
            const stockMap = new Map<string, boolean>();
            const variantProductIds = new Set<string>();
            (variants ?? []).forEach((v) => { const vr = v as unknown as { product_id: string; stock_quantity: number }; variantProductIds.add(vr.product_id); if (vr.stock_quantity > 0) stockMap.set(vr.product_id, true); });
            return rows.map((p) => ({ ...p, primary_image_url: imageMap.get(p.id) ?? null, in_stock: variantProductIds.has(p.id) ? (stockMap.get(p.id) ?? false) : true }));
        },
        enabled: guestIds.length > 0,
    });

    return (
        <div>
            <h1 className="mb-8 font-serif text-3xl font-semibold">My Wishlist</h1>
            {isLoading ? (
                <ProductGridSkeleton count={4} />
            ) : products && products.length > 0 ? (
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {products.map((p) => <ProductCard key={p.id} product={p} isWishlisted onToggleWishlist={toggle} />)}
                </div>
            ) : (
                <EmptyState
                    icon={Heart}
                    title="Your wishlist is empty"
                    description="Save items you love by tapping the heart icon."
                    action={<Button asChild><Link to="/shop">Browse Products</Link></Button>}
                />
            )}
        </div>
    );
}
