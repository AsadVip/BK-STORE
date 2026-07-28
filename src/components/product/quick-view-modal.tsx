import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, ShieldCheck, Check } from "lucide-react";
import { useQuickView } from "@/lib/cart/use-quick-view-store";
import { useGuestCart } from "@/lib/cart/guest-cart";
import { useProductVariantsById, useProductDetailsById } from "@/features/catalog/api";
import { computeSalePrice, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function QuickViewModal() {
    const { product, isOpen, closeQuickView } = useQuickView();
    const addItem = useGuestCart((s) => s.addItem);
    const { toast } = useToast();
    const navigate = useNavigate();

    const [quantity, setQuantity] = useState(1);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

    // Fetch dynamic variants & full description from database/API
    const { data: dbVariants = [], isLoading: loadingVariants } = useProductVariantsById(product?.id);
    const { data: productDetails } = useProductDetailsById(product?.id);

    // Auto-select first variant when variants load
    useEffect(() => {
        if (dbVariants && dbVariants.length > 0) {
            setSelectedVariantId(dbVariants[0].id);
        } else {
            setSelectedVariantId(null);
        }
        setQuantity(1);
    }, [product?.id, dbVariants]);

    if (!product) return null;

    // Determine active variant object
    const activeVariant = dbVariants.find((v: any) => v.id === selectedVariantId) || dbVariants[0] || null;

    // Price, compareAt, SKU, Image, and Stock computation
    const basePrice = activeVariant?.price ?? product.base_price;
    const compareAt = activeVariant?.compare_at_price ?? product.compare_at_price;
    const activeImage = activeVariant?.image_url || product.primary_image_url;
    const activeSku = activeVariant?.sku || `${product.slug}-default`;

    const { isOnSale, salePrice, discountPercent } = computeSalePrice(basePrice, compareAt);

    // Stock checking
    const outOfStock = activeVariant
        ? (activeVariant as any).stock_quantity <= 0
        : !product.in_stock;

    // Description text
    const displayDescription = (productDetails as any)?.description || (product as any)?.description ||
        "Crafted with precision, high-grade materials, and timeless elegance. Guaranteed 100% original quality with fast cash on delivery across Pakistan.";

    const handleAddToCart = () => {
        const variantName = activeVariant
            ? (activeVariant.name || activeVariant.title || activeVariant.sku || "Selected Variant")
            : null;

        addItem({
            variant_id: activeVariant?.id || product.id,
            product_id: product.id,
            product_name: product.name,
            variant_name: variantName,
            sku: activeSku,
            unit_price: salePrice,
            image_url: activeImage,
            quantity: quantity,
        });
        toast({
            title: "Added to Cart",
            description: `${product.name} ${variantName ? `(${variantName})` : ""}`,
            variant: "success",
        });
        closeQuickView();
    };

    const handleBuyNow = () => {
        const variantName = activeVariant
            ? (activeVariant.name || activeVariant.title || activeVariant.sku || "Selected Variant")
            : null;

        addItem({
            variant_id: activeVariant?.id || product.id,
            product_id: product.id,
            product_name: product.name,
            variant_name: variantName,
            sku: activeSku,
            unit_price: salePrice,
            image_url: activeImage,
            quantity: quantity,
        });
        closeQuickView();
        navigate("/checkout");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md"
                        onClick={closeQuickView}
                    />

                    {/* Modal Window — Pure High End Luxury Design */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-border/80 bg-bg-primary shadow-2xl"
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={closeQuickView}
                            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black hover:scale-110 active:scale-95 shadow-md"
                            aria-label="Close modal"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="grid md:grid-cols-2 gap-6 p-6 sm:p-8">
                            {/* Product Image */}
                            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-bg-secondary border border-border/60 shadow-inner">
                                {activeImage ? (
                                    <img
                                        src={activeImage}
                                        alt={product.name}
                                        className="h-full w-full object-cover object-center transition-all duration-300"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-text-secondary">
                                        BK STORE
                                    </div>
                                )}

                                {discountPercent > 0 && !outOfStock && (
                                    <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                                        −{discountPercent}% OFF
                                    </span>
                                )}

                                {outOfStock && (
                                    <span className="absolute top-3 left-3 bg-black/80 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                                        Out of Stock
                                    </span>
                                )}
                            </div>

                            {/* Product Details & Actions */}
                            <div className="flex flex-col justify-between space-y-4">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                                        {product.brand_name || "LUXURY EDITION"}
                                    </span>
                                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary mt-0.5 leading-snug">
                                        {product.name}
                                    </h2>

                                    {/* Price Display */}
                                    <div className="mt-2.5 flex items-baseline gap-2">
                                        <span className="font-sans text-xl sm:text-2xl font-extrabold text-text-primary">
                                            {formatCurrency(salePrice)}
                                        </span>
                                        {isOnSale && compareAt && compareAt > salePrice && (
                                            <span className="text-sm font-medium text-text-secondary line-through">
                                                {formatCurrency(compareAt)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Product Description */}
                                    <p className="mt-3 text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-3">
                                        {displayDescription}
                                    </p>

                                    {/* Dynamic Product Variants (Rendered ONLY if product has variants created in Admin) */}
                                    {dbVariants && dbVariants.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                                    Available Variants ({dbVariants.length})
                                                </label>
                                                {activeVariant && (
                                                    <span className="text-[11px] font-mono text-text-secondary">
                                                        SKU: {activeSku}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-0.5">
                                                {dbVariants.map((variant: any) => {
                                                    const isSelected = selectedVariantId === variant.id;
                                                    const isVarOutOfStock = variant.stock_quantity <= 0;
                                                    const variantLabel = variant.name || variant.title || variant.option_values?.name || variant.sku || "Option";

                                                    return (
                                                        <button
                                                            key={variant.id}
                                                            type="button"
                                                            onClick={() => setSelectedVariantId(variant.id)}
                                                            className={`group relative h-11 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 border ${
                                                                isSelected
                                                                    ? "bg-black text-white border-black shadow-md shadow-black/20 scale-[1.02]"
                                                                    : "bg-white text-black border-black/20 hover:border-black hover:scale-[1.02] shadow-2xs"
                                                            } ${isVarOutOfStock ? "opacity-60" : ""}`}
                                                        >
                                                            <span>{variantLabel}</span>
                                                            {variant.price && variant.price !== product.base_price && (
                                                                <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-text-secondary"}`}>
                                                                    ({formatCurrency(variant.price)})
                                                                </span>
                                                            )}
                                                            {isSelected && (
                                                                <Check className="h-3.5 w-3.5 text-white ml-0.5" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quantity Selector */}
                                    <div className="mt-4 flex items-center gap-4">
                                        <label className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                            Quantity:
                                        </label>
                                        <div className="flex items-center rounded-xl border border-border/80 bg-bg-secondary shadow-2xs">
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="flex h-9 w-9 items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="w-8 text-center font-mono text-sm font-bold text-text-primary">
                                                {quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="flex h-9 w-9 items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2.5 pt-4 border-t border-border/60">
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <Button
                                            onClick={handleAddToCart}
                                            disabled={outOfStock}
                                            className="w-full rounded-xl bg-black font-bold text-white shadow-md hover:bg-black/90 h-12 text-xs sm:text-sm active:scale-95 transition-transform uppercase tracking-wider"
                                        >
                                            <ShoppingBag className="h-4 w-4 mr-1.5" /> Add to Cart
                                        </Button>
                                        <Button
                                            onClick={handleBuyNow}
                                            disabled={outOfStock}
                                            variant="outline"
                                            className="w-full rounded-xl border-black bg-white text-black font-bold shadow-md hover:bg-black hover:text-white h-12 text-xs sm:text-sm active:scale-95 transition-all uppercase tracking-wider"
                                        >
                                            Buy Now
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
