import React, { memo } from "react";
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

function ProductCardComponent({ product, isWishlisted, onToggleWishlist, className }: ProductCardProps) {
    const { data: flashSale } = useFlashSaleSetting();
    const openQuickView = useQuickView((s) => s.openQuickView);

    const { isOnSale, salePrice, compareAt, discountPercent } = computeSalePrice(
        product.base_price,
        product.compare_at_price,
        flashSale,
    );
    const outOfStock = !product.in_stock;

    const handleQuickView = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        openQuickView(product);
    };

    return (
        <div
            className={cn(
                "group relative rounded-2xl sm:rounded-3xl border border-neutral-200 bg-white p-2.5 sm:p-3.5 shadow-xs hover:shadow-xl hover:border-black transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 active:scale-[0.99] flex flex-col justify-between overflow-hidden",
                className,
            )}
        >
            <Link to={`/product/${product.slug}`} className="block flex-1 flex flex-col">
                {/* Product Image Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200/60 shadow-inner">
                    {product.primary_image_url ? (
                        <img
                            src={product.primary_image_url}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            className={cn(
                                "h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105",
                                outOfStock && "opacity-60 saturate-50",
                            )}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center font-serif text-xl sm:text-2xl text-black font-bold">
                            BK STORE
                        </div>
                    )}

                    {/* Top Badges (Left) */}
                    <div className="absolute left-2 sm:left-3 top-2 sm:top-3 flex flex-col gap-1 z-10">
                        {outOfStock && (
                            <Badge className="bg-neutral-900 text-white font-bold text-[10px] sm:text-xs px-2.5 py-0.5 shadow-sm rounded-full">
                                Out of Stock
                            </Badge>
                        )}
                        {discountPercent > 0 && !outOfStock && (
                            <Badge className="bg-black text-white font-extrabold text-[10px] sm:text-xs px-2.5 py-0.5 border border-black shadow-sm rounded-full flex items-center gap-1">
                                −{discountPercent}% OFF
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
                            className="absolute right-2 sm:right-3 top-2 sm:top-3 z-10 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-black transition-all hover:bg-black hover:text-white hover:scale-110 active:scale-90 shadow-md border border-neutral-200"
                        >
                            <Heart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isWishlisted && "fill-black text-black")} />
                        </button>
                    )}

                    {/* Desktop Hover Full-Width Slide Button Bar — "Select options" */}
                    <div className="hidden sm:flex absolute inset-x-2 bottom-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out z-20">
                        <button
                            type="button"
                            onClick={handleQuickView}
                            disabled={outOfStock}
                            className="w-full bg-black hover:bg-neutral-800 text-white font-extrabold text-xs sm:text-sm py-2.5 rounded-xl text-center transition-all duration-300 shadow-lg tracking-wide flex items-center justify-center cursor-pointer border border-black"
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
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shadow-lg border border-black transition-all active:scale-90"
                        >
                            <ShoppingBag className="h-4 w-4 text-white" />
                        </motion.button>
                    </div>
                </div>

                {/* Details Section */}
                <div className="mt-2.5 sm:mt-3.5 px-0.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
                            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 truncate max-w-[120px]">
                                {product.brand_name || "LUXURY TIMEPIECE"}
                            </span>
                            <div className="flex items-center gap-0.5 text-black text-[10px] sm:text-xs font-bold shrink-0">
                                <Star className="h-3 w-3 fill-black text-black" />
                                <span>{(product.rating_average || 5.0).toFixed(1)}</span>
                            </div>
                        </div>

                        <h3 className="line-clamp-2 sm:line-clamp-1 font-sans text-xs sm:text-base font-bold text-black group-hover:text-neutral-600 transition-colors leading-snug">
                            {product.name}
                        </h3>
                    </div>

                    {/* Price and Savings Row */}
                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-neutral-100 flex-wrap min-w-0">
                        <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className="font-sans text-sm sm:text-base font-extrabold text-black">
                                {formatCurrency(salePrice)}
                            </span>
                            {isOnSale && compareAt && compareAt > salePrice && (
                                <span className="text-[10px] sm:text-xs text-neutral-400 line-through decoration-neutral-400 font-medium">
                                    {formatCurrency(compareAt)}
                                </span>
                            )}
                        </div>
                        {discountPercent > 0 && !outOfStock && (
                            <span className="shrink-0 text-[9px] sm:text-[10px] font-extrabold text-white bg-black px-2 py-0.5 rounded-md border border-black">
                                -{discountPercent}%
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}

export const ProductCard = memo(ProductCardComponent);
