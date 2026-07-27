import { Link } from "react-router-dom";
import { Heart, Star, ShoppingBag, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useFlashSaleSetting } from "@/features/admin/api";
import { useGuestCart } from "@/lib/cart/guest-cart";
import { cn, computeSalePrice, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export interface ProductCardData {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    compare_at_price: number | null;
    rating_average: number;
    rating_count: number;
    primary_image_url: string | null;
    in_stock: boolean;
    brand_name?: string | null;
}

interface ProductCardProps {
    product: ProductCardData;
    isWishlisted?: boolean;
    onToggleWishlist?: (id: string) => void;
    className?: string;
}

export function ProductCard({ product, isWishlisted, onToggleWishlist, className }: ProductCardProps) {
    const { data: flashSale } = useFlashSaleSetting();
    const addItem = useGuestCart((s) => s.addItem);
    const { toast } = useToast();

    let price = product.base_price;
    let compareAt = product.compare_at_price;

    // Apply global Flash Sale if active
    if (flashSale?.is_active && flashSale?.discount_percentage) {
        const discountRatio = (100 - flashSale.discount_percentage) / 100;
        compareAt = compareAt ?? product.base_price;
        price = product.base_price * discountRatio;
    }

    const { isOnSale, salePrice, discountPercent } = computeSalePrice(price, compareAt);
    const effectiveSalePercent = flashSale?.is_active ? flashSale.discount_percentage : discountPercent;
    const outOfStock = !product.in_stock;

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem({
            variant_id: product.id,
            product_id: product.id,
            product_name: product.name,
            variant_name: "Standard Edition",
            sku: `${product.slug}-default`,
            unit_price: salePrice,
            image_url: product.primary_image_url,
            quantity: 1,
        });
        toast({
            title: "Added to Cart",
            description: product.name,
            variant: "success",
        });
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
                "group relative rounded-2xl sm:rounded-3xl border border-border/70 bg-bg-secondary/40 p-2 sm:p-3 shadow-2xs hover:shadow-xl hover:border-btn-primary/50 transition-all duration-300 flex flex-col justify-between",
                className,
            )}
        >
            <Link to={`/product/${product.slug}`} className="block flex-1 flex flex-col">
                {/* Larger, Sharper Product Image Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-bg-primary border border-border/50 shadow-inner">
                    {product.primary_image_url ? (
                        <img
                            src={product.primary_image_url}
                            alt={product.name}
                            loading="lazy"
                            className={cn(
                                "h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-108",
                                outOfStock && "opacity-60 saturate-50",
                            )}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center font-serif text-xl sm:text-2xl text-text-secondary">
                            BK STORE
                        </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute left-2 sm:left-3 top-2 sm:top-3 flex flex-col gap-1 z-10">
                        {outOfStock && (
                            <Badge className="bg-red-600/90 backdrop-blur-md text-white font-semibold text-[10px] sm:text-xs px-2 py-0.5 shadow-md">
                                Out of Stock
                            </Badge>
                        )}
                        {effectiveSalePercent > 0 && !outOfStock && (
                            <Badge className="bg-red-600 text-white font-semibold text-[10px] sm:text-xs px-2 py-0.5 shadow-md">
                                −{effectiveSalePercent}% OFF
                            </Badge>
                        )}
                    </div>

                    {/* Wishlist Button */}
                    {onToggleWishlist && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleWishlist(product.id);
                            }}
                            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                            className="absolute right-2 sm:right-3 top-2 sm:top-3 z-10 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/80 hover:scale-110 active:scale-90 shadow-md"
                        >
                            <Heart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isWishlisted && "fill-red-500 text-red-500")} />
                        </button>
                    )}

                    {/* Sleek Hover/Tap Action Button Overlay — Hidden by default, slides up smoothly on interaction */}
                    <div className="absolute inset-x-2 sm:inset-x-3 bottom-2 sm:bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-active:opacity-100 group-active:translate-y-0 transition-all duration-300 flex gap-2 z-10">
                        <Button
                            onClick={handleQuickAdd}
                            disabled={outOfStock}
                            className="flex-1 bg-btn-primary/95 hover:bg-btn-primary text-white font-semibold text-[11px] sm:text-xs h-8 sm:h-10 rounded-lg sm:rounded-xl backdrop-blur-md shadow-lg active:scale-95 transition-transform"
                        >
                            <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Add to Cart
                        </Button>
                    </div>
                </div>

                {/* Details Section */}
                <div className="mt-2 sm:mt-3 px-0.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-1 mb-0.5 min-w-0">
                            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-btn-primary truncate max-w-[110px]">
                                {product.brand_name || "LUXURY EDITION"}
                            </span>
                            <div className="flex items-center gap-0.5 text-amber-400 text-[10px] sm:text-xs font-medium shrink-0">
                                <Star className="h-3 w-3 fill-amber-400" />
                                <span>{(product.rating_average || 5.0).toFixed(1)}</span>
                            </div>
                        </div>

                        <h3 className="line-clamp-2 sm:line-clamp-1 font-sans text-xs sm:text-base font-semibold text-text-primary group-hover:text-btn-primary transition-colors leading-tight">
                            {product.name}
                        </h3>
                    </div>

                    {/* Price and Savings Row - Clean Flex without Wrapping Overflow */}
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/40 flex-wrap min-w-0">
                        <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className={`font-sans text-sm sm:text-base font-semibold ${isOnSale || (flashSale?.is_active) ? "text-red-600 dark:text-red-400" : "text-text-primary"}`}>
                                {formatCurrency(salePrice)}
                            </span>
                            {(isOnSale || (flashSale?.is_active && compareAt && compareAt > salePrice)) && compareAt && compareAt > salePrice && (
                                <span className="text-[10px] sm:text-xs text-text-secondary line-through decoration-red-400">
                                    {formatCurrency(compareAt)}
                                </span>
                            )}
                        </div>
                        {effectiveSalePercent > 0 && !outOfStock && (
                            <span className="shrink-0 text-[9px] sm:text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/20">
                                -{effectiveSalePercent}%
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
