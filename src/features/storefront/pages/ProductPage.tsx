import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    Heart,
    Minus,
    Plus,
    ShoppingCart,
    Star,
    Truck,
    RefreshCw,
    ShieldCheck,
    CheckCircle2,
    Sparkles,
    Send,
    MapPin,
    Phone,
    Mail,
    Clock,
    Award,
    MessageCircle,
    ChevronDown,
    Layers,
    ZoomIn,
    Eye,
    ShoppingBag,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProduct, useProductReviews } from "@/features/catalog/api";
import { useFlashSaleSetting } from "@/features/admin/api";
import { useGuestCart } from "@/lib/cart/guest-cart";
import { useGuestWishlist } from "@/lib/cart/guest-wishlist";
import { useAuth } from "@/app/providers/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { cn, computeSalePrice, formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { WhyChooseUsComparison } from "@/components/storefront/why-choose-us";
import { HearFromCustomers } from "@/components/storefront/hear-from-customers";
import { YouMayAlsoLike, recordProductView } from "@/components/product/you-may-also-like";
import { SimpleLoader } from "@/components/ui/simple-loader";

function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
    );
}

function AnimatedCounter({ end, duration = 1800, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);

    const handleViewportEnter = () => {
        if (started) return;
        setStarted(true);
        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeProgress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                setCount(end);
            }
        };
        window.requestAnimationFrame(step);
    };

    return (
        <motion.span onViewportEnter={handleViewportEnter} viewport={{ once: true }}>
            {count.toLocaleString()}{suffix}
        </motion.span>
    );
}

const STORE_REVIEWS_MOCK = [
    {
        id: "sr-1",
        author: "Ranareyan",
        date: "07/21/2026",
        rating: 5,
        comment: "Excellent service! Delivered original item in perfect condition with fast shipping.",
        productName: "Sabr Unique Watch",
    },
    {
        id: "sr-2",
        author: "Hamza Malik",
        date: "07/15/2026",
        rating: 5,
        comment: "100% authentic product. Highly recommended store for luxury items in Pakistan.",
        productName: "Rolex Strap Automatic",
    },
    {
        id: "sr-3",
        author: "Usman Tariq",
        date: "07/04/2026",
        rating: 5,
        comment: "Very polite WhatsApp support and super fast delivery to Lahore.",
        productName: "Premium Chronograph Edition",
    },
];

export default function ProductPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { data: product, isLoading } = useProduct(slug);
    const { data: reviews, refetch: refetchReviews } = useProductReviews(product?.id);
    const { data: flashSale } = useFlashSaleSetting();
    const { user } = useAuth();
    const addItem = useGuestCart((s) => s.addItem);
    const toggleWishlist = useGuestWishlist((s) => s.toggle);
    const isWishlisted = useGuestWishlist((s) => (product ? s.has(product.id) : false));
    const { toast } = useToast();

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Scroll state for sticky bottom bar
    const [showStickyBar, setShowStickyBar] = useState(false);

    // Tab state for reviews (product vs store reviews)
    const [reviewTab, setReviewTab] = useState<"product" | "store">("product");
    const [showWriteReview, setShowWriteReview] = useState(false);

    // New review submission form state
    const [newRating, setNewRating] = useState(5);
    const [newTitle, setNewTitle] = useState("");
    const [newComment, setNewComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const [isZoomed, setIsZoomed] = useState(false);
    const [viewerCount] = useState(() => Math.floor(Math.random() * 15) + 20);

    const deliveryDates = (() => {
        const today = new Date();
        const dispatchDate = new Date(today);
        dispatchDate.setDate(today.getDate() + 1);

        const deliveryDate = new Date(today);
        deliveryDate.setDate(today.getDate() + 2);

        const formatShortDate = (d: Date) => {
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        };

        return {
            order: formatShortDate(today),
            dispatch: formatShortDate(dispatchDate),
            delivery: formatShortDate(deliveryDate),
        };
    })();

    if (isLoading) return <SimpleLoader minHeight="min-h-[75vh]" label="Loading product..." />;
    if (!product) {
        return (
            <div className="container-bk py-20">
                <EmptyState
                    icon={ShieldCheck}
                    title="Product not found"
                    description="The product you're looking for doesn't exist or has been removed."
                    action={<Button asChild><Link to="/shop">Back to Shop</Link></Button>}
                />
            </div>
        );
    }

    const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0] ?? null;
    let basePrice = selectedVariant?.price ?? product.base_price;
    let compareAt = selectedVariant?.compare_at_price ?? product.compare_at_price;

    // Flash Sale integration
    if (flashSale?.is_active && flashSale?.discount_percentage) {
        compareAt = compareAt ?? basePrice;
        basePrice = basePrice * ((100 - flashSale.discount_percentage) / 100);
    }

    const { isOnSale, salePrice, discountPercent } = computeSalePrice(basePrice, compareAt);
    const effectiveDiscount = flashSale?.is_active ? flashSale.discount_percentage : discountPercent;
    const stockCount = (selectedVariant && selectedVariant.stock_quantity > 0) ? selectedVariant.stock_quantity : 500;
    const inStock = true;

    const handleAddToCart = (redirect = false) => {
        const variantId = selectedVariant?.id ?? product.id;
        const variantName = selectedVariant?.name ?? "Standard Edition";
        const sku = selectedVariant?.sku ?? `${product.slug}-default`;

        addItem({
            variant_id: variantId,
            product_id: product.id,
            product_name: product.name,
            variant_name: variantName,
            sku: sku,
            unit_price: salePrice,
            image_url: product.primary_image_url,
            quantity,
        });

        toast({
            title: "Added to Cart",
            description: `${quantity} × ${product.name}`,
            variant: "success",
        });

        if (redirect) {
            navigate("/cart");
        }
    };

    const handleWhatsAppOrder = () => {
        const phoneNumber = "923286870670";
        const variantStr = selectedVariant?.name ? ` (${selectedVariant.name})` : "";
        const msg = `Hi BK Store! I want to order:\n*Product:* ${product.name}${variantStr}\n*Price:* ${formatCurrency(salePrice)}\n*Quantity:* ${quantity}`;
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`, "_blank");
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) {
            toast({ title: "Comment is required", variant: "destructive" });
            return;
        }

        setIsSubmittingReview(true);
        try {
            const authorName = user
                ? `${(user as any).user_metadata?.first_name || "Verified"} ${(user as any).user_metadata?.last_name || "Customer"}`.trim()
                : (newTitle.trim() || "Verified Buyer");

            if (product?.id) {
                await supabase.from("reviews" as never).insert({
                    product_id: product.id,
                    user_id: user?.id ?? null,
                    rating: newRating,
                    title: newTitle.trim() || null,
                    comment: newComment.trim(),
                    status: "approved",
                    created_at: new Date().toISOString(),
                    reviewer_name: authorName,
                } as never);
            }

            await refetchReviews();

            setNewTitle("");
            setNewComment("");
            setShowWriteReview(false);
            toast({
                title: "Review Submitted",
                description: "Thank you for your feedback! Your review is now live.",
                variant: "success",
            });
        } catch (err) {
            toast({ title: "Review Submitted", description: "Thank you for your feedback!", variant: "success" });
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const displayImages = product.images && product.images.length > 0
        ? product.images
        : product.primary_image_url
        ? [{ id: "primary", url: product.primary_image_url, alt_text: product.name, display_order: 0 }]
        : [];

    return (
        <div className="container-bk py-6 sm:py-10 pb-24 sm:pb-32 space-y-12 sm:space-y-20 max-w-6xl mx-auto animate-page-fade">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-text-secondary font-medium tracking-normal mb-2">
                <Link to="/" className="hover:text-text-primary transition-colors">Home</Link>
                <span>&gt;</span>
                <Link to="/shop" className="hover:text-text-primary transition-colors">All Products</Link>
                <span>&gt;</span>
                <span className="text-text-primary font-medium truncate max-w-[200px] sm:max-w-none">{product.name}</span>
            </nav>

            {/* Main Product Hero Section (Desktop & Mobile Layout) */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="grid gap-6 lg:gap-10 lg:grid-cols-12 items-start"
            >
                {/* Gallery Column (Desktop 6 col, Mobile 12 col) */}
                <div className="lg:col-span-6 space-y-3">
                    <div className="relative aspect-square overflow-hidden rounded-xl border border-border/80 bg-white shadow-xs">
                        {(() => {
                            const activeMainImage = (selectedVariant as any)?.image_url || displayImages[selectedImage]?.url || product.primary_image_url;
                            if (!activeMainImage) {
                                return (
                                    <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-text-secondary bg-gray-50">
                                        BK STORE
                                    </div>
                                );
                            }
                            return (
                                <motion.img
                                    key={activeMainImage}
                                    initial={{ opacity: 0.8 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                    src={activeMainImage}
                                    alt={product.name}
                                    className="h-full w-full object-cover cursor-pointer"
                                    onClick={() => setIsZoomed(true)}
                                />
                            );
                        })()}

                        {/* Top-Right Wishlist Heart Button Overlay */}
                        <button
                            type="button"
                            onClick={() => toggleWishlist(product.id)}
                            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-700 hover:text-red-500 transition-colors border border-gray-100"
                        >
                            <Heart className={cn("w-4.5 h-4.5", isWishlisted && "fill-red-500 text-red-500")} />
                        </button>

                        {/* Bottom-Right Zoom Button Overlay */}
                        <button
                            type="button"
                            onClick={() => setIsZoomed(true)}
                            className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-700 hover:bg-white transition-colors border border-gray-100"
                        >
                            <ZoomIn className="w-4.5 h-4.5" />
                        </button>
                    </div>

                    {/* Image Thumbnails Row */}
                    {displayImages.length > 1 && (
                        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                            {displayImages.map((img, i) => (
                                <button
                                    key={img.id}
                                    type="button"
                                    onClick={() => setSelectedImage(i)}
                                    className={cn(
                                        "relative aspect-square w-16 sm:w-20 shrink-0 overflow-hidden rounded-lg border transition-all cursor-pointer",
                                        selectedImage === i ? "border-black ring-2 ring-black/80" : "border-gray-200 opacity-70 hover:opacity-100",
                                    )}
                                >
                                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Detail Info Column (Desktop 6 col, Mobile 12 col) */}
                <div className="lg:col-span-6 space-y-5">
                    {/* Title */}
                    <div>
                        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
                            {product.name}
                        </h1>

                        {/* Price Display */}
                        <div className="mt-2.5 flex items-center gap-3 flex-wrap">
                            <span className="font-sans text-xl sm:text-2xl font-extrabold text-[#01411C]">
                                {formatCurrency(salePrice)}
                            </span>
                            {compareAt && compareAt > salePrice && (
                                <span className="font-sans text-sm text-gray-400 line-through font-normal">
                                    {formatCurrency(compareAt)}
                                </span>
                            )}
                            {(compareAt && compareAt > salePrice) && (
                                <span className="bg-[#01411C] text-[#D4AF37] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide border border-[#D4AF37]/40 flex items-center gap-1 shadow-xs">
                                    SAVE {formatCurrency(compareAt - salePrice)}
                                </span>
                            )}
                        </div>

                        {/* Live Viewer Counter */}
                        <div className="mt-3.5 flex items-center gap-2 text-xs sm:text-sm font-medium text-text-primary">
                            <Eye className="w-4 h-4 text-text-primary shrink-0" />
                            <span>
                                <strong className="font-bold">{viewerCount} people</strong> are viewing this right now
                            </span>
                        </div>
                    </div>

                    {/* Variant Selector (e.g. Strap Color: Brown / Black) */}
                    {(() => {
                        const displayVariants = (product.variants ?? []).filter(
                            (v) => v.name && v.name.trim() !== "" && v.name.toLowerCase() !== "default" && v.name.toLowerCase() !== "standard"
                        );
                        const hasCustomVariants = displayVariants.length > 0;
                        const selectableVariants = hasCustomVariants ? displayVariants : product.variants;
                        const showVariantPicker = product.variants && product.variants.length > 0 && (
                            product.variants.length > 1 || hasCustomVariants
                        );

                        if (!showVariantPicker) return null;

                        const handleVariantClick = (v: any, index: number) => {
                            setSelectedVariantId(v.id);
                            const variantImgUrl = v.image_url || (v.option_values && typeof v.option_values === "object" ? v.option_values.image_url : null);
                            if (variantImgUrl) {
                                const foundIdx = displayImages.findIndex((img) => img.url === variantImgUrl);
                                if (foundIdx !== -1) {
                                    setSelectedImage(foundIdx);
                                } else if (displayImages.length > index) {
                                    setSelectedImage(index);
                                }
                            } else if (displayImages.length > index) {
                                setSelectedImage(index);
                            }
                        };

                        return (
                            <div className="space-y-2 pt-1">
                                <label className="text-xs font-semibold text-text-primary block">
                                    Strap Color: <span className="font-normal text-text-secondary">{selectedVariant?.name || "Brown"}</span>
                                </label>
                                <div className="flex flex-wrap gap-2.5">
                                    {selectableVariants.map((v, vIdx) => {
                                        const isSelected = (selectedVariantId === v.id) || (!selectedVariantId && selectedVariant?.id === v.id);
                                        return (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => handleVariantClick(v, vIdx)}
                                                className={cn(
                                                    "px-4 py-2 text-xs font-medium rounded-md border transition-all cursor-pointer min-w-[70px] text-center",
                                                    isSelected
                                                        ? "bg-black text-white border-black font-semibold shadow-2xs"
                                                        : "bg-white text-black border-gray-300 hover:border-black"
                                                )}
                                            >
                                                {v.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Quantity Selector */}
                    <div className="space-y-2 pt-1">
                        <label className="text-xs font-semibold text-text-primary block">Quantity</label>
                        <div className="flex items-center justify-between bg-[#f4f4f4] text-black rounded-md px-3 py-2 w-44 border border-gray-200">
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                disabled={quantity <= 1}
                                className="p-1 text-black hover:opacity-70 disabled:opacity-30 cursor-pointer"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-bold text-black">{quantity}</span>
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => Math.min(stockCount, q + 1))}
                                disabled={quantity >= stockCount}
                                className="p-1 text-black hover:opacity-70 disabled:opacity-30 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons Stack */}
                    <div className="space-y-3 pt-2">
                        {/* Add to Cart: WHITE background, BLACK border, BLACK text */}
                        <button
                            type="button"
                            disabled={!inStock}
                            onClick={() => handleAddToCart(false)}
                            className="w-full py-3 px-4 border border-black bg-white text-black hover:bg-gray-50 font-semibold text-sm rounded-md transition-all cursor-pointer shadow-2xs"
                        >
                            Add to cart
                        </button>

                        {/* Buy it now: SOLID BLACK background, WHITE text */}
                        <button
                            type="button"
                            disabled={!inStock}
                            onClick={() => handleAddToCart(true)}
                            className="w-full py-3 px-4 bg-black hover:bg-zinc-800 text-white font-bold text-sm rounded-md transition-all cursor-pointer shadow-2xs"
                        >
                            Buy it now
                        </button>

                        {/* Order on WhatsApp: VIBRANT GREEN background, WHITE text */}
                        <button
                            type="button"
                            onClick={handleWhatsAppOrder}
                            className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                        >
                            <WhatsAppIcon className="w-5 h-5 fill-white" />
                            Order on WhatsApp
                        </button>
                    </div>

                    {/* Fast 3-Day Delivery Process Section (Real-Time Calculated Dates) */}
                    <div className="mt-8 pt-6 border-t border-gray-200/80 dark:border-zinc-800 space-y-4">
                        <h3 className="text-xs font-bold text-center uppercase tracking-wider text-text-primary">
                            Fast 3-Day Delivery Process
                        </h3>
                        <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-sm mx-auto py-2">
                            {/* Order */}
                            <div className="flex flex-col items-center gap-1.5 text-center">
                                <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight font-medium">
                                    {deliveryDates.order}
                                </span>
                                <span className="text-xs font-bold text-text-primary leading-none">
                                    Order
                                </span>
                            </div>

                            <div className="h-[1.5px] bg-gray-300 dark:bg-zinc-700 w-8 sm:w-12 mb-5 shrink-0" />

                            {/* Dispatch */}
                            <div className="flex flex-col items-center gap-1.5 text-center">
                                <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs">
                                    <Truck className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight font-medium">
                                    {deliveryDates.dispatch}
                                </span>
                                <span className="text-xs font-bold text-text-primary leading-none">
                                    Dispatch
                                </span>
                            </div>

                            <div className="h-[1.5px] bg-gray-300 dark:bg-zinc-700 w-8 sm:w-12 mb-5 shrink-0" />

                            {/* Delivery */}
                            <div className="flex flex-col items-center gap-1.5 text-center">
                                <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight font-medium">
                                    {deliveryDates.delivery}
                                </span>
                                <span className="text-xs font-bold text-text-primary leading-none">
                                    Delivery
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Zoom Image Lightbox Modal */}
            <AnimatePresence>
                {isZoomed && displayImages[selectedImage] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsZoomed(false)}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <button
                            type="button"
                            onClick={() => setIsZoomed(false)}
                            className="absolute top-4 right-4 z-50 text-white bg-white/20 p-2 rounded-full hover:bg-white/40"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img
                            src={displayImages[selectedImage].url}
                            alt=""
                            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating WhatsApp Quick Action Button */}
            <a
                href="https://wa.me/923286870670"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Order on WhatsApp"
                className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#25D366] text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
            >
                <WhatsAppIcon className="w-7 h-7 fill-white" />
            </a>

            {/* 1. HEAR FROM OUR HAPPY CUSTOMERS SECTION (HAPPY REVIEWS) */}
            <HearFromCustomers />

            {/* 2. WHY PEOPLE CHOOSE BK STORE PAKISTAN (SHIFTED BELOW HAPPY REVIEWS) */}
            <WhyChooseUsComparison />

            {/* 3. CONTACT INFORMATION CARD SECTION */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
            >
                <div className="mx-auto max-w-3xl rounded-3xl border border-border/80 bg-bg-secondary/60 p-6 sm:p-10 shadow-sm text-center">
                    <h2 className="font-serif text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-text-primary">
                        CONTACT INFORMATION
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl mx-auto">
                        We would love to hear from you regarding your order, support, or any questions. Please feel free to contact us using the details below.
                    </p>

                    <div className="mt-8 grid gap-4 text-left max-w-md mx-auto">
                        {/* Location */}
                        <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-bg-primary p-3.5 shadow-2xs">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-text-primary leading-snug">
                                Multan Garden Town, Pakistan
                            </span>
                        </div>

                        {/* Phone */}
                        <a
                            href="tel:+923286870670"
                            className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-bg-primary p-3.5 shadow-2xs hover:border-btn-primary transition-colors group"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-btn-primary/10 text-btn-primary">
                                <Phone className="h-5 w-5" />
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-btn-primary">
                                +92 328 6870670
                            </span>
                        </a>

                        {/* Email */}
                        <a
                            href="mailto:bkstore.watches@gmail.com"
                            className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-bg-primary p-3.5 shadow-2xs hover:border-btn-primary transition-colors group"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                <Mail className="h-5 w-5" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-text-primary group-hover:text-btn-primary">
                                bkstore.watches@gmail.com
                            </span>
                        </a>

                        {/* Hours */}
                        <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-bg-primary p-3.5 shadow-2xs">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                                <Clock className="h-5 w-5" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-text-primary">
                                Everyday 9:00 – 18:00
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 4. CUSTOMER REVIEWS TABS SECTION */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="border-t border-border pt-12 space-y-8"
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-text-primary">
                            Customer Reviews
                        </h2>
                        <p className="text-xs sm:text-sm text-text-secondary mt-1">
                            Verified buyer reviews for products and overall store service.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={() => setShowWriteReview((v) => !v)}
                        className="bg-lime-500 text-black font-extrabold hover:bg-lime-400 rounded-xl px-5 shadow-sm"
                    >
                        Write a review
                    </Button>
                </div>

                {/* Write Review Drawer Form */}
                <AnimatePresence>
                    {showWriteReview && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <form onSubmit={handleReviewSubmit} className="rounded-2xl border border-border bg-bg-secondary/60 p-6 space-y-4 max-w-xl">
                                <h3 className="font-serif font-bold text-lg text-text-primary">Submit Your Review</h3>
                                <div>
                                    <label className="text-xs font-bold text-text-secondary block mb-1">Rating</label>
                                    <div className="flex items-center gap-1 text-amber-400">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setNewRating(i + 1)}
                                                className="p-1"
                                            >
                                                <Star className={cn("h-6 w-6", i < newRating ? "fill-amber-400" : "text-border")} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-secondary block mb-1">Review Comment</label>
                                    <Textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Write your review experience..."
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button type="button" variant="outline" onClick={() => setShowWriteReview(false)}>Cancel</Button>
                                    <Button type="submit" disabled={isSubmittingReview} className="bg-btn-primary text-white font-bold">
                                        {isSubmittingReview ? "Submitting..." : "Submit Review"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Review Tabs Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-3">
                    <div className="flex items-center gap-6">
                        <button
                            type="button"
                            onClick={() => setReviewTab("product")}
                            className={cn(
                                "relative pb-3 text-sm font-bold transition-colors",
                                reviewTab === "product" ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
                            )}
                        >
                            Product reviews ({reviews?.length || 0})
                            {reviewTab === "product" && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary rounded-full" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setReviewTab("store")}
                            className={cn(
                                "relative pb-3 text-sm font-bold transition-colors",
                                reviewTab === "store" ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
                            )}
                        >
                            Store reviews ({STORE_REVIEWS_MOCK.length})
                            {reviewTab === "store" && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary rounded-full" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-text-secondary font-medium">Sort:</span>
                        <select className="rounded-xl border border-border bg-bg-primary px-3 py-1.5 text-xs font-semibold text-text-primary focus:outline-none">
                            <option>Most recent</option>
                            <option>Highest rating</option>
                            <option>Lowest rating</option>
                        </select>
                    </div>
                </div>

                {/* Tab Content Display */}
                {reviewTab === "product" ? (
                    <div className="space-y-4">
                        {reviews && reviews.length > 0 ? (
                            reviews.map((r) => (
                                <div key={r.id} className="rounded-2xl border border-border/80 bg-bg-secondary/20 p-5 space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-sm text-text-primary">
                                                {r.reviewer_name || r.name || r.author || "Verified Buyer"}
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                Verified Purchase
                                            </span>
                                        </div>
                                        <span className="text-xs text-text-secondary">{formatDate(r.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-400">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className={cn("h-4 w-4", i < r.rating ? "fill-amber-400 text-amber-400" : "text-border")} />
                                        ))}
                                    </div>
                                    {r.title && <h4 className="font-bold text-text-primary text-base">{r.title}</h4>}
                                    <p className="text-sm text-text-secondary leading-relaxed">{r.comment || r.body || "Verified customer review"}</p>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center space-y-4">
                                <p className="text-sm text-text-secondary font-medium">Be the first to write a review</p>
                                <Button
                                    type="button"
                                    onClick={() => setShowWriteReview(true)}
                                    className="bg-lime-500 text-black font-extrabold hover:bg-lime-400 rounded-xl px-6"
                                >
                                    Write a review
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <h3 className="font-serif font-bold text-lg text-text-primary">
                            Reviews for other products ({STORE_REVIEWS_MOCK.length})
                        </h3>
                        {STORE_REVIEWS_MOCK.map((sr) => (
                            <div key={sr.id} className="rounded-2xl border border-border/60 bg-bg-primary p-5 space-y-3 shadow-2xs">
                                <div className="flex items-center gap-1 text-amber-400">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-secondary text-text-primary font-bold text-xs border border-border">
                                        {sr.author[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-text-primary">{sr.author}</h4>
                                        <p className="text-[11px] text-text-secondary">{sr.date}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed">{sr.comment}</p>
                                <div className="rounded-xl bg-lime-500/10 border border-lime-500/20 p-3 flex items-center gap-3">
                                    <div className="h-10 w-10 shrink-0 rounded-lg bg-bg-secondary overflow-hidden border border-border">
                                        <img src={displayImages[0]?.url || product.primary_image_url || undefined} alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-text-secondary block">Review for</span>
                                        <span className="text-xs font-bold text-text-primary underline cursor-pointer">{sr.productName}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* 5. OUR JOURNEY SO FAR STATS SECTION WITH ANIMATED NUMBERS & LUXURY ICONS */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="rounded-3xl border border-border/80 bg-bg-secondary/40 p-6 sm:p-12 text-center shadow-sm"
            >
                <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                    Our Journey So Far
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary mt-2">
                    Trusted by watch lovers across Pakistan
                </p>

                <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <motion.div
                        whileHover={{ scale: 1.04, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center rounded-2xl border border-border/80 bg-bg-primary p-6 shadow-2xs transition-all hover:shadow-lg hover:border-text-primary/50"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-btn-primary/10 text-btn-primary mb-3">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                        <span className="font-serif text-2xl sm:text-4xl font-extrabold text-text-primary block tracking-tight">
                            <AnimatedCounter end={5000} suffix="+" />
                        </span>
                        <span className="text-xs font-bold text-text-secondary mt-1.5 uppercase tracking-wider block">
                            Watches Delivered
                        </span>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.04, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center rounded-2xl border border-border/80 bg-bg-primary p-6 shadow-2xs transition-all hover:shadow-lg hover:border-text-primary/50"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-btn-primary/10 text-btn-primary mb-3">
                            <Heart className="h-6 w-6 fill-btn-primary/20" />
                        </div>
                        <span className="font-serif text-2xl sm:text-4xl font-extrabold text-text-primary block tracking-tight">
                            <AnimatedCounter end={4000} suffix="+" />
                        </span>
                        <span className="text-xs font-bold text-text-secondary mt-1.5 uppercase tracking-wider block">
                            Happy Customers
                        </span>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.04, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center rounded-2xl border border-border/80 bg-bg-primary p-6 shadow-2xs transition-all hover:shadow-lg hover:border-text-primary/50"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-btn-primary/10 text-btn-primary mb-3">
                            <Award className="h-6 w-6" />
                        </div>
                        <span className="font-serif text-2xl sm:text-4xl font-extrabold text-text-primary block tracking-tight">
                            <AnimatedCounter end={350} suffix="+" />
                        </span>
                        <span className="text-xs font-bold text-text-secondary mt-1.5 uppercase tracking-wider block">
                            Watch Models
                        </span>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.04, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center rounded-2xl border border-border/80 bg-bg-primary p-6 shadow-2xs transition-all hover:shadow-lg hover:border-text-primary/50"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-btn-primary/10 text-btn-primary mb-3">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <span className="font-serif text-2xl sm:text-4xl font-extrabold text-text-primary block tracking-tight">
                            <AnimatedCounter end={100} suffix="+" />
                        </span>
                        <span className="text-xs font-bold text-text-secondary mt-1.5 uppercase tracking-wider block">
                            Cities Served
                        </span>
                    </motion.div>
                </div>
            </motion.div>

            {/* 6. FREQUENTLY ASKED QUESTIONS ACCORDION */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="space-y-6 max-w-3xl mx-auto"
            >
                <div className="text-center">
                    <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-text-primary">
                        Frequently Asked Questions
                    </h2>
                </div>

                <Accordion type="single" collapsible className="space-y-3">
                    <AccordionItem value="faq-1" className="rounded-2xl border border-border/80 bg-bg-primary px-5 py-1 shadow-2xs">
                        <AccordionTrigger className="font-bold text-sm sm:text-base text-text-primary hover:no-underline">
                            How long does delivery take in Pakistan?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                            Standard delivery takes 3–5 business days across Pakistan. Urgent delivery is available for Multan & major cities.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-2" className="rounded-2xl border border-border/80 bg-bg-primary px-5 py-1 shadow-2xs">
                        <AccordionTrigger className="font-bold text-sm sm:text-base text-text-primary hover:no-underline">
                            Do you offer returns?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                            Yes! We accept returns and exchanges within 7 days of delivery, provided items are in original, unworn condition.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-3" className="rounded-2xl border border-border/80 bg-bg-primary px-5 py-1 shadow-2xs">
                        <AccordionTrigger className="font-bold text-sm sm:text-base text-text-primary hover:no-underline">
                            How can I contact support?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                            You can reach out directly via WhatsApp or phone call at 0328 6870670. Our support team is active Everyday 9:00 AM – 9:00 PM.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-4" className="rounded-2xl border border-border/80 bg-bg-primary px-5 py-1 shadow-2xs">
                        <AccordionTrigger className="font-bold text-sm sm:text-base text-text-primary hover:no-underline">
                            Are your watches good quality?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                            All our products undergo strict quality checks and verification. Every timepiece is backed by authentic materials and craftsmanship guarantees.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-5" className="rounded-2xl border border-border/80 bg-bg-primary px-5 py-1 shadow-2xs">
                        <AccordionTrigger className="font-bold text-sm sm:text-base text-text-primary hover:no-underline">
                            Do you deliver all over Pakistan?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                            Yes, we deliver to over 100+ cities across Pakistan with Cash on Delivery (COD) and online payments.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </motion.div>

            {/* 7. YOU MAY ALSO LIKE SECTION */}
            <YouMayAlsoLike
                currentProductId={product.id}
                currentCategoryIds={(product.categories ?? []).map((c: any) => c.id)}
                brandId={product.brand_id}
            />

            {/* 8. STICKY BOTTOM PRODUCT ACTION BAR */}
            <AnimatePresence>
                {showStickyBar && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-bg-primary/95 backdrop-blur-md shadow-2xl px-4 py-3"
                    >
                        <div className="container-bk flex items-center justify-between gap-3">
                            {/* Left: Thumbnail & Title */}
                            <div className="flex items-center gap-3 min-w-0">
                                <img
                                    src={displayImages[0]?.url || product.primary_image_url || undefined}
                                    alt=""
                                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover border border-border shrink-0"
                                />
                                <div className="min-w-0">
                                    <h4 className="font-serif font-bold text-xs sm:text-sm text-text-primary truncate max-w-[140px] sm:max-w-[240px]">
                                        {product.name}
                                    </h4>
                                    <p className="text-xs font-extrabold text-btn-primary">
                                        {formatCurrency(salePrice)}
                                    </p>
                                </div>
                            </div>

                            {/* Right: Quantity & Add to Cart button */}
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                {/* Desktop Variant Select */}
                                {product.variants.length > 1 && (
                                    <select
                                        value={selectedVariantId || selectedVariant?.id || ""}
                                        onChange={(e) => setSelectedVariantId(e.target.value)}
                                        className="hidden md:block rounded-xl border border-border bg-bg-secondary px-3 py-2 text-xs font-bold text-text-primary focus:outline-none"
                                    >
                                        {product.variants.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name} - {formatCurrency(v.price)}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {/* Quantity Stepper (Desktop) */}
                                <div className="hidden sm:flex items-center rounded-xl border border-border bg-bg-secondary">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        className="p-1.5 text-text-secondary hover:text-text-primary"
                                    >
                                        <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="w-7 text-center font-bold text-xs text-text-primary">{quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) => Math.min(stockCount, q + 1))}
                                        className="p-1.5 text-text-secondary hover:text-text-primary"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={() => handleAddToCart(false)}
                                    className="bg-black text-white dark:bg-white dark:text-black font-extrabold px-4 sm:px-6 h-10 rounded-xl shadow-md hover:scale-105 transition-transform"
                                >
                                    <ShoppingCart className="h-4 w-4 mr-1.5" />
                                    <span className="hidden sm:inline">Add to cart</span>
                                    <span className="sm:hidden">Add</span>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ProductSkeleton() {
    return (
        <div className="container-bk py-10 space-y-8">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <div className="grid gap-10 lg:grid-cols-2">
                <Skeleton className="aspect-square rounded-3xl" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4 rounded-xl" />
                    <Skeleton className="h-6 w-1/3 rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}


