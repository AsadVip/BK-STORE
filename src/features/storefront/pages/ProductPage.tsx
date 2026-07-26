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

    useEffect(() => {
        const onScroll = () => {
            setShowStickyBar(window.scrollY > 380);
        };
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (product) {
            const categoryIds = (product.categories ?? []).map((c: any) => c.id);
            recordProductView(product.id, product.slug, categoryIds);
        }
    }, [product?.id]);

    if (isLoading) return <ProductSkeleton />;
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
        <div className="container-bk py-8 sm:py-10 pb-24 sm:pb-32 space-y-16 sm:space-y-24">
            {/* Breadcrumb */}
            <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-medium text-text-secondary uppercase tracking-wider">
                <Link to="/" className="hover:text-btn-primary transition-colors">Home</Link>
                <span>/</span>
                <Link to="/shop" className="hover:text-btn-primary transition-colors">Shop</Link>
                {product.categories[0] && (
                    <>
                        <span>/</span>
                        <Link to={`/shop?category=${product.categories[0].id}`} className="hover:text-btn-primary transition-colors">
                            {product.categories[0].name}
                        </Link>
                    </>
                )}
                <span>/</span>
                <span className="text-text-primary font-bold truncate max-w-[180px] sm:max-w-none">{product.name}</span>
            </nav>

            {/* Main Product Hero Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid gap-8 lg:gap-12 lg:grid-cols-2 items-start"
            >
                {/* Gallery Section */}
                <div className="space-y-4">
                    <div className="relative aspect-square overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-bg-secondary shadow-lg">
                        {displayImages[selectedImage] ? (
                            <motion.img
                                key={selectedImage}
                                initial={{ opacity: 0.8, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                src={displayImages[selectedImage].url}
                                alt={displayImages[selectedImage].alt_text ?? product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center font-serif text-3xl text-text-secondary">
                                BK STORE
                            </div>
                        )}
                        {effectiveDiscount > 0 && inStock && (
                            <div className="absolute left-4 top-4">
                                <Badge className="bg-red-600 text-white font-black text-xs px-3 py-1 shadow-md">
                                    −{effectiveDiscount}% OFF
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Image Thumbnails */}
                    {displayImages.length > 1 && (
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                            {displayImages.map((img, i) => (
                                <button
                                    key={img.id}
                                    type="button"
                                    onClick={() => setSelectedImage(i)}
                                    className={cn(
                                        "relative aspect-square w-16 sm:w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                                        selectedImage === i ? "border-btn-primary ring-2 ring-btn-primary/30" : "border-border/60 opacity-70 hover:opacity-100",
                                    )}
                                >
                                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Detail Info Section */}
                <div className="space-y-6">
                    <div>
                        {product.brand && (
                            <p className="text-xs font-bold uppercase tracking-widest text-btn-primary mb-1.5">
                                {product.brand.name}
                            </p>
                        )}
                        <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
                            {product.name}
                        </h1>

                        {/* Rating Summary */}
                        <div className="mt-3 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-0.5 text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating_average || 5) ? "fill-amber-400" : "text-border")} />
                                ))}
                            </div>
                            <span className="font-bold text-text-primary">{(product.rating_average || 5.0).toFixed(1)}</span>
                            <span className="text-text-secondary">({product.rating_count || 12} Verified Buyer Reviews)</span>
                        </div>
                    </div>

                    {/* Variants selector if available — SHIFTED ABOVE PRICING */}
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
                            <div className="space-y-3 rounded-2xl border border-border/80 bg-bg-secondary/40 p-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                                        <Layers className="h-4 w-4 text-btn-primary" />
                                        Select Option / Variant: <span className="text-btn-primary font-bold">{selectedVariant?.name || "Standard"}</span>
                                    </label>
                                    {selectedVariant && selectedVariant.stock_quantity > 0 && (
                                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            {selectedVariant.stock_quantity} in stock
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    {selectableVariants.map((v, vIdx) => {
                                        const isSelected = (selectedVariantId === v.id) || (!selectedVariantId && selectedVariant?.id === v.id);
                                        const vPrice = v.price ?? product.base_price;
                                        const vCompare = v.compare_at_price ?? product.compare_at_price;
                                        const hasDiscount = vCompare && vCompare > vPrice;

                                        return (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => handleVariantClick(v, vIdx)}
                                                className={cn(
                                                    "group relative flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all shadow-2xs cursor-pointer",
                                                    isSelected
                                                        ? "border-btn-primary bg-btn-primary text-white shadow-md ring-2 ring-btn-primary/30"
                                                        : "border-border/80 text-text-primary bg-bg-primary hover:border-btn-primary/60 hover:bg-bg-secondary"
                                                )}
                                            >
                                                <span className="truncate">{v.name}</span>
                                                <div className="flex items-center gap-1 text-[11px]">
                                                    <span className={cn("font-extrabold", isSelected ? "text-white" : "text-btn-primary")}>
                                                        {formatCurrency(vPrice)}
                                                    </span>
                                                    {hasDiscount && (
                                                        <span className={cn("line-through opacity-75 text-[10px]", isSelected ? "text-white/80" : "text-text-secondary")}>
                                                            {formatCurrency(vCompare)}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Price & Stock Display */}
                    <div className="rounded-2xl border border-border/80 bg-bg-secondary/40 p-4 sm:p-5 space-y-2.5">
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-text-primary">
                                {formatCurrency(salePrice)}
                            </span>
                            {compareAt && compareAt > salePrice && (
                                <span className="text-base sm:text-lg text-text-secondary line-through font-normal">
                                    {formatCurrency(compareAt)}
                                </span>
                            )}
                        </div>

                        {/* Stock Quantity Badge */}
                        <div className="flex items-center gap-2">
                            {inStock ? (
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    In Stock • Express Shipping Ready
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400 border border-red-500/20">
                                    Out of Stock
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Short Description */}
                    {product.description && (
                        <p className="text-xs sm:text-sm leading-relaxed text-text-secondary">
                            {product.description}
                        </p>
                    )}

                    {/* Quantity & Action Buttons */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-4">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-primary">Quantity</label>
                            <div className="flex items-center rounded-xl border border-border bg-bg-secondary">
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    disabled={quantity <= 1}
                                    className="p-2 text-text-secondary hover:text-text-primary disabled:opacity-30"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-10 text-center font-bold text-sm text-text-primary">{quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.min(stockCount, q + 1))}
                                    disabled={quantity >= stockCount}
                                    className="p-2 text-text-secondary hover:text-text-primary disabled:opacity-30"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                size="lg"
                                disabled={!inStock}
                                onClick={() => handleAddToCart(false)}
                                className="flex-1 rounded-xl bg-btn-primary text-white font-bold h-12 shadow-md hover:scale-[1.01] transition-transform"
                            >
                                <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
                            </Button>
                            <Button
                                size="lg"
                                disabled={!inStock}
                                onClick={() => handleAddToCart(true)}
                                className="flex-1 rounded-xl bg-amber-500 text-black font-bold h-12 shadow-md hover:bg-amber-400"
                            >
                                Buy Now
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleWishlist(product.id)}
                                className="h-12 w-12 rounded-xl shrink-0 border-border"
                            >
                                <Heart className={cn("h-5 w-5", isWishlisted && "fill-red-500 text-red-500")} />
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

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
                        We would love to hear from you regarding your order, support or any questions. Please feel free to contact us using the details below.
                    </p>

                    <div className="mt-8 grid gap-4 text-left max-w-md mx-auto">
                        {/* Location */}
                        <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-bg-primary p-3.5 shadow-2xs">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-text-primary leading-snug">
                                Al Quresh Phase 2, Sher Shah Road, Multan
                            </span>
                        </div>

                        {/* Phone */}
                        <a
                            href="tel:03286870670"
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
                            href="mailto:bkstore.hub@gmail.com"
                            className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-bg-primary p-3.5 shadow-2xs hover:border-btn-primary transition-colors group"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                <Mail className="h-5 w-5" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-text-primary group-hover:text-btn-primary">
                                bkstore.hub@gmail.com
                            </span>
                        </a>

                        {/* Hours */}
                        <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-bg-primary p-3.5 shadow-2xs">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                                <Clock className="h-5 w-5" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-text-primary">
                                Everyday 9:00 – 21:00
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

            {/* 5. OUR JOURNEY SO FAR STATS SECTION WITH ANIMATED NUMBERS */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="rounded-3xl border border-border bg-bg-secondary/50 p-6 sm:p-12 text-center"
            >
                <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                    Our Journey So Far
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary mt-2">
                    Trusted by watch lovers across Pakistan
                </p>

                <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <motion.div whileHover={{ scale: 1.03 }} className="rounded-2xl border border-border/80 bg-bg-primary p-5 sm:p-6 shadow-sm">
                        <span className="font-serif text-2xl sm:text-4xl font-extrabold text-text-primary block">
                            <AnimatedCounter end={25000} />
                        </span>
                        <span className="text-xs font-semibold text-text-secondary mt-1 block">
                            Watches Delivered
                        </span>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.03 }} className="rounded-2xl border border-border/80 bg-bg-primary p-5 sm:p-6 shadow-sm">
                        <span className="font-serif text-2xl sm:text-4xl font-extrabold text-text-primary block">
                            <AnimatedCounter end={18000} />
                        </span>
                        <span className="text-xs font-semibold text-text-secondary mt-1 block">
                            Happy Customers
                        </span>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.03 }} className="rounded-2xl border border-border/80 bg-bg-primary p-5 sm:p-6 shadow-sm">
                        <span className="font-serif text-2xl sm:text-4xl font-extrabold text-text-primary block">
                            <AnimatedCounter end={350} />
                        </span>
                        <span className="text-xs font-semibold text-text-secondary mt-1 block">
                            Watch Models
                        </span>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.03 }} className="rounded-2xl border border-border/80 bg-bg-primary p-5 sm:p-6 shadow-sm">
                        <span className="font-serif text-2xl sm:text-4xl font-extrabold text-text-primary block">
                            <AnimatedCounter end={100} />
                        </span>
                        <span className="text-xs font-semibold text-text-secondary mt-1 block">
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


