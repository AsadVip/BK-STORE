import { Link } from "react-router-dom";
import { Heart, Star, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useFlashSaleSetting } from "@/features/admin/api";
import { useQuickView } from "@/lib/cart/use-quick-view-store";
import { cn, computeSalePrice, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
    const openQuickView = useQuickView((s) => s.openQuickView);

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

    const handleQuickView = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        openQuickView(product);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-30px" }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "group relative rounded-2xl sm:rounded-3xl border border-[#01411C]/15 bg-white p-2.5 sm:p-3.5 shadow-md hover:shadow-2xl hover:shadow-[#01411C]/15 hover:border-[#01411C]/40 transition-all duration-300 flex flex-col justify-between overflow-hidden",
                className,
            )}
        >
            <Link to={`/product/${product.slug}`} className="block flex-1 flex flex-col">
                {/* Product Image Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-bg-secondary border border-border/40 shadow-inner">
                    {product.primary_image_url ? (
                        <img
                            src={product.primary_image_url}
                            alt={product.name}
                            loading="lazy"
                            className={cn(
                                "h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105",
                                outOfStock && "opacity-60 saturate-50",
                            )}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center font-serif text-xl sm:text-2xl text-[#01411C]">
                            BK STORE
                        </div>
                    )}

                    {/* Top Badges (Left) */}
                    <div className="absolute left-2 sm:left-3 top-2 sm:top-3 flex flex-col gap-1 z-10">
                        {outOfStock && (
                            <Badge className="bg-slate-900/90 backdrop-blur-md text-white font-bold text-[10px] sm:text-xs px-2.5 py-0.5 shadow-md rounded-full">
                                Out of Stock
                            </Badge>
                        )}
                        {effectiveSalePercent > 0 && !outOfStock && (
                            <Badge className="bg-[#01411C] text-[#D4AF37] font-extrabold text-[10px] sm:text-xs px-2.5 py-0.5 border border-[#D4AF37]/50 shadow-md rounded-full flex items-center gap-1">
                                −{effectiveSalePercent}% OFF
                            </Badge>
                        )}
                    </div>

                    {/* Top Right Wishlist Icon */}
                    {onToggleWishlist && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleWishlist(product.id);
                            }}
                            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                            className="absolute right-2 sm:right-3 top-2 sm:top-3 z-10 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/90 text-[#01411C] backdrop-blur-md transition-all hover:bg-[#01411C] hover:text-[#D4AF37] hover:scale-110 active:scale-90 shadow-md border border-[#01411C]/20"
                        >
                            <Heart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isWishlisted && "fill-[#01411C] text-[#01411C]")} />
                        </button>
                    )}

                    {/* Desktop Hover Full-Width Slide Button Bar — "Select options" */}
                    <div className="hidden sm:flex absolute inset-x-2 bottom-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out z-20">
                        <button
                            type="button"
                            onClick={handleQuickView}
                            disabled={outOfStock}
                            className="w-full bg-[#01411C] hover:bg-[#D4AF37] text-white hover:text-[#01411C] font-extrabold text-xs sm:text-sm py-2.5 rounded-[12px] text-center transition-all duration-300 shadow-lg tracking-wide flex items-center justify-center cursor-pointer border border-[#D4AF37]/40"
                        >
                            Select Options
                        </button>
                    </div>

                    {/* Mobile Permanent Floating Cart (Bucket) Button */}
                    <div className="flex sm:hidden absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.12 }}
                            whileTap={{ scale: 0.90 }}
                            onClick={handleQuickView}
                            aria-label="Quick View options & cart"
                            title="Select options"
                            className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#01411C] text-white shadow-lg border border-[#D4AF37]/40 transition-all active:scale-90"
                        >
                            <ShoppingBag className="h-4 w-4 text-white" />
                        </motion.button>
                    </div>
                </div>

                {/* Details Section */}
                <div className="mt-2.5 sm:mt-3.5 px-0.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
                            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-[#01411C] truncate max-w-[120px]">
                                {product.brand_name || "LUXURY TIMEPIECE"}
                            </span>
                            <div className="flex items-center gap-0.5 text-[#D4AF37] text-[10px] sm:text-xs font-bold shrink-0">
                                <Star className="h-3 w-3 fill-[#D4AF37] text-[#D4AF37]" />
                                <span>{(product.rating_average || 5.0).toFixed(1)}</span>
                            </div>
                        </div>

                        <h3 className="line-clamp-2 sm:line-clamp-1 font-sans text-xs sm:text-base font-bold text-text-primary group-hover:text-[#01411C] transition-colors leading-snug">
                            {product.name}
                        </h3>
                    </div>

                    {/* Price and Savings Row */}
                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100 flex-wrap min-w-0">
                        <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className="font-sans text-sm sm:text-base font-extrabold text-[#01411C]">
                                {formatCurrency(salePrice)}
                            </span>
                            {(isOnSale || (flashSale?.is_active && compareAt && compareAt > salePrice)) && compareAt && compareAt > salePrice && (
                                <span className="text-[10px] sm:text-xs text-slate-400 line-through decoration-slate-400 font-medium">
                                    {formatCurrency(compareAt)}
                                </span>
                            )}
                        </div>
                        {effectiveSalePercent > 0 && !outOfStock && (
                            <span className="shrink-0 text-[9px] sm:text-[10px] font-extrabold text-[#01411C] bg-[#D4AF37]/20 px-2 py-0.5 rounded-md border border-[#D4AF37]/50">
                                -{effectiveSalePercent}%
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
