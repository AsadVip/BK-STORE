import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Truck, ShieldCheck, RefreshCw, Headphones, Sparkles, ChevronRight, Gift, Tag } from "lucide-react";
import { useCategories, useProducts, useBanners } from "@/features/catalog/api";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/product/product-card-skeleton";
import { PromoBanner } from "@/components/storefront/promo-banner";
import { Reveal } from "@/components/storefront/reveal";
import { Typewriter } from "@/components/storefront/typewriter";
import { HearFromCustomers } from "@/components/storefront/hear-from-customers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const VALUE_PROPS = [
    { icon: Truck, title: "Express Free Shipping", desc: "Express delivery across Pakistan" },
    { icon: ShieldCheck, title: "100% Authentic Luxury", desc: "Verified original timepieces" },
    { icon: Gift, title: "Signature Gift Packaging", desc: "Complimentary luxury box" },
    { icon: RefreshCw, title: "Hassle-Free Exchange", desc: "30-Day easy returns & warranty" },
];

export default function HomePage() {
    const { data: categories } = useCategories();
    const { data: newArrivals, isLoading: loadingNewArrivals } = useProducts({ placement: "new_arrival", pageSize: 8 });
    const { data: allProducts, isLoading: loadingAllProducts } = useProducts({ pageSize: 8 });
    const { data: bestSellers } = useProducts({ placement: "best_seller", pageSize: 4 });
    const { data: heroBanners, isLoading: heroLoading } = useBanners("home_hero");
    const { data: secondaryBanners } = useBanners("home_secondary");

    const [heroIndex, setHeroIndex] = useState(0);
    useEffect(() => {
        if (!heroBanners || heroBanners.length <= 1) return;
        const id = setInterval(() => {
            setHeroIndex((i) => (i + 1) % heroBanners.length);
        }, 6000);
        return () => clearInterval(id);
    }, [heroBanners]);

    useEffect(() => {
        if (heroBanners && heroIndex >= heroBanners.length) setHeroIndex(0);
    }, [heroBanners, heroIndex]);

    const heroBanner = heroBanners?.[heroIndex];
    const heroCtaUrl = heroBanner?.link_url ?? "/shop";
    const heroCtaInternal = heroCtaUrl.startsWith("/");

    const defaultHeadlines = [
        "Timeless Luxury & Original Craftsmanship",
        "Pakistan's Premier Horology Destination",
        "Curated Luxury Timepieces & Footwear",
    ];

    const heroHeadline = heroBanner?.text_overlay?.trim()
        ? (heroBanner.text_overlay.includes("|")
            ? heroBanner.text_overlay.split("|").map((s) => s.trim()).filter(Boolean)
            : heroBanner.text_overlay.trim())
        : defaultHeadlines;

    return (
        <div>
            {/* ── Hero Section (Cinematic Black Overlay with Crisp White Typography) ── */}
            <section className="relative overflow-hidden bg-black border-b border-neutral-900 min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center">
                <AnimatePresence>
                    {heroBanner ? (
                        <motion.div
                            key={heroBanner.id}
                            className="absolute inset-0"
                            initial={{ opacity: 0, scale: 1.04 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.0 }}
                        >
                            <img
                                src={heroBanner.image_url}
                                alt={heroBanner.title}
                                className="h-full w-full object-cover object-center"
                            />
                            {/* Balanced light-black overlay so background image is clearly visible with crisp white text contrast */}
                            <div className="absolute inset-0 bg-black/35" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/45" />
                        </motion.div>
                    ) : (
                        <motion.div
                            className="absolute inset-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                        >
                            <img
                                src="/hero-bg.png"
                                alt="BK Store Luxury Watch Campaign"
                                className="h-full w-full object-cover object-center scale-105 filter contrast-105 opacity-90"
                            />
                            <div className="absolute inset-0 bg-black/35" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/45" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Subtle edge vignette for text focus without hiding the background image */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.35)_100%)]" />

                <div className="container-bk relative flex flex-col items-center justify-center py-20 sm:py-28 text-center z-20">
                    {heroLoading ? (
                        <div className="flex flex-col items-center gap-6">
                            <Skeleton className="h-4 w-40 bg-neutral-800" />
                            <Skeleton className="h-16 w-[28rem] max-w-full bg-neutral-800" />
                            <div className="flex gap-4">
                                <Skeleton className="h-14 w-44 rounded-xl bg-neutral-800" />
                                <Skeleton className="h-14 w-44 rounded-xl bg-neutral-800" />
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={heroBanner ? heroBanner.id : "default-hero"}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="max-w-4xl mx-auto px-3 sm:px-4 relative z-10"
                            >
                                <div className="mb-4 sm:mb-6">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 text-white backdrop-blur-md px-5 sm:px-7 py-2 text-xs sm:text-sm font-extrabold uppercase tracking-[0.22em] shadow-lg border border-white/20">
                                        <Sparkles className="h-3.5 w-3.5 text-white" />
                                        {(heroBanner?.text_overlay && heroBanner?.title) ? heroBanner.title : "BK STORE — EXCLUSIVE LUXURY EDITION"}
                                    </span>
                                </div>

                                <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.12] tracking-tight text-white max-w-3xl mx-auto drop-shadow-xl min-h-[2.5em] sm:min-h-[2.2em] flex items-center justify-center">
                                    <Typewriter
                                        text={heroHeadline}
                                        speed={45}
                                        delay={250}
                                        pause={2600}
                                        loop={true}
                                        cursorClassName="text-white drop-shadow-lg"
                                    />
                                </h1>

                                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3.5 sm:gap-5 w-full sm:w-auto px-2 sm:px-0">
                                    <Button asChild size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 text-base font-extrabold bg-white text-black hover:bg-neutral-200 shadow-2xl rounded-xl transition-all active:scale-95">
                                        <Link to={heroCtaInternal ? heroCtaUrl : "/shop"}>
                                            Shop Collection <ArrowRight className="h-5 w-5 ml-2" />
                                        </Link>
                                    </Button>
                                    <Button asChild size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 text-base font-extrabold bg-white/10 hover:bg-white hover:text-black text-white border-2 border-white/80 backdrop-blur-md rounded-xl shadow-xl transition-all active:scale-95">
                                        <Link to="/categories">Explore Collection</Link>
                                    </Button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Banner dots if multiple hero banners exist */}
                {heroBanners && heroBanners.length > 1 && (
                    <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                        {heroBanners.map((b, i) => (
                            <button
                                key={b.id}
                                type="button"
                                onClick={() => setHeroIndex(i)}
                                className={cn(
                                    "h-2.5 rounded-full transition-all duration-300",
                                    i === heroIndex ? "w-10 bg-white shadow-md" : "w-2.5 bg-white/40 hover:bg-white/70",
                                )}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Value Props Bar ── */}
            <section className="border-y border-neutral-200 bg-neutral-50">
                <div className="container-bk grid grid-cols-2 gap-3 sm:gap-5 py-6 sm:py-10 lg:grid-cols-4">
                    {VALUE_PROPS.map((vp, i) => (
                        <Reveal key={vp.title} direction="up" delay={i * 80} className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl transition-all duration-300 hover:bg-white hover:shadow-md border border-transparent hover:border-neutral-200">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-white shadow-xs">
                                <vp.icon className="h-6 w-6 stroke-[2.2]" />
                            </div>
                            <div>
                                <p className="text-sm font-extrabold text-black">{vp.title}</p>
                                <p className="text-xs text-neutral-600 font-medium">{vp.desc}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ── Secondary Promo Banners ── */}
            {secondaryBanners && secondaryBanners.length > 0 && (
                <Reveal as="section" className="container-bk py-12">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {secondaryBanners.slice(0, 2).map((b) => (
                            <PromoBanner key={b.id} banner={b} variant="compact" />
                        ))}
                    </div>
                </Reveal>
            )}

            {/* ── Shop by Category ── */}
            <Reveal as="section" className="container-bk py-20">
                <div className="mb-8 sm:mb-12 flex items-end justify-between gap-2 min-w-0">
                    <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-neutral-600 bg-neutral-100 border border-neutral-200 px-3.5 py-1 rounded-full mb-2">
                            <Sparkles className="h-3.5 w-3.5 text-black" /> Curated Collections
                        </span>
                        <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-black">Shop by Category</h2>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="font-bold text-black hover:text-black hover:bg-neutral-100">
                        <Link to="/categories">View all <ChevronRight className="h-4 w-4 ml-0.5" /></Link>
                    </Button>
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4">
                    {categories
                        ? categories.slice(0, 8).map((cat, i) => (
                            <Reveal key={cat.id} direction="up" delay={i * 70}>
                                <motion.div
                                    whileHover={{ y: -6 }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <Link
                                        to={`/shop/${cat.slug}`}
                                        className="group relative block aspect-[3/4] sm:aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-3xl border border-neutral-200 hover:border-black shadow-sm hover:shadow-2xl transition-all duration-300 bg-neutral-100"
                                    >
                                        {(cat as any).image_url ? (
                                            <img
                                                src={(cat as any).image_url}
                                                alt={cat.name}
                                                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-108"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-200 p-4">
                                                <div className="text-center">
                                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white shadow-md">
                                                        <Sparkles className="h-6 w-6" />
                                                    </div>
                                                    <span className="font-serif text-lg sm:text-xl font-bold text-black">{cat.name}</span>
                                                </div>
                                            </div>
                                        )}
                                        {/* Cinematic gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent opacity-85 transition-opacity duration-300 group-hover:opacity-100" />
                                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 translate-y-0 sm:translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                                            <h3 className="font-serif text-base sm:text-xl font-extrabold text-white leading-snug drop-shadow-md">{cat.name}</h3>
                                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] sm:text-xs font-extrabold text-neutral-300 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                                                Shop Collection <ArrowRight className="h-3 w-3" />
                                            </p>
                                        </div>
                                    </Link>
                                </motion.div>
                            </Reveal>
                        ))
                        : Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="aspect-[3/4] sm:aspect-[4/5] rounded-2xl sm:rounded-3xl" />
                        ))}
                </div>
            </Reveal>

            {/* ── New Arrivals ── */}
            <Reveal as="section" className="bg-neutral-50/80 py-20 border-y border-neutral-200">
                <div className="container-bk">
                    <div className="mb-8 sm:mb-12 flex items-end justify-between gap-2 min-w-0">
                        <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-neutral-600 bg-white border border-neutral-200 px-3.5 py-1 rounded-full mb-2">
                                <Sparkles className="h-3.5 w-3.5 text-black" /> Curated Watches & Footwear
                            </span>
                            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-black">New Arrivals</h2>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="font-bold text-black hover:text-black hover:bg-neutral-100">
                            <Link to="/shop">View all <ChevronRight className="h-4 w-4 ml-0.5" /></Link>
                        </Button>
                    </div>
                    {loadingNewArrivals && loadingAllProducts ? (
                        <ProductGridSkeleton count={8} />
                    ) : newArrivals && newArrivals.items.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                            {newArrivals.items.map((p, i) => (
                                <Reveal key={p.id} direction="up" delay={i * 60}>
                                    <ProductCard product={p} />
                                </Reveal>
                            ))}
                        </div>
                    ) : allProducts && allProducts.items.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                            {allProducts.items.map((p, i) => (
                                <Reveal key={p.id} direction="up" delay={i * 60}>
                                    <ProductCard product={p} />
                                </Reveal>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-neutral-500 py-8">No products available at the moment.</p>
                    )}
                </div>
            </Reveal>

            {/* ── Best Sellers ── */}
            {bestSellers && bestSellers.items.length > 0 && (
                <Reveal as="section" className="container-bk py-20">
                    <div className="mb-8 sm:mb-12 flex items-end justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-neutral-600 bg-neutral-100 border border-neutral-200 px-3.5 py-1 rounded-full mb-2">
                                <Sparkles className="h-3.5 w-3.5 text-black" /> Customer Favorites
                            </span>
                            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-black">Best Sellers</h2>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="font-bold text-black hover:text-black hover:bg-neutral-100">
                            <Link to="/shop">View all <ChevronRight className="h-4 w-4 ml-0.5" /></Link>
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4">
                        {bestSellers.items.map((p, i) => (
                            <Reveal key={p.id} direction="up" delay={i * 60}>
                                <ProductCard product={p} />
                            </Reveal>
                        ))}
                    </div>
                </Reveal>
            )}

            {/* ── Real WhatsApp Customer Reviews Marquee ── */}
            <HearFromCustomers />

            {/* ── Membership Section (Luxury White Card) ── */}
            <section className="py-20 bg-neutral-100/60 border-t border-neutral-200">
                <div className="container-bk">
                    <div className="relative overflow-hidden rounded-3xl bg-white text-black p-8 sm:p-14 lg:p-20 shadow-xl border-2 border-black text-center group">
                        {/* Background Luxury Chronograph Watch Image */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                            <img
                                src="/inner-circle-watch.jpg"
                                alt="BK Store Luxury Watch Heritage"
                                className="h-full w-full object-cover object-center opacity-25 filter contrast-125 grayscale scale-100 group-hover:scale-105 transition-transform duration-700"
                            />
                            {/* Seamless white overlays to guarantee 100% black typography readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/90" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.92)_100%)]" />
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative z-10"
                        >
                            <span className="inline-flex items-center gap-2 rounded-full bg-black text-white px-5 py-2 text-xs font-extrabold uppercase tracking-widest mb-6 shadow-md">
                                <Sparkles className="h-4 w-4 text-white" /> Exclusive Members Club
                            </span>
                            <h2 className="mx-auto max-w-2xl font-serif text-3xl sm:text-5xl md:text-6xl font-extrabold text-black leading-tight">
                                Join the BK Store<br />Inner Circle
                            </h2>
                            <p className="mx-auto mt-5 max-w-md text-neutral-600 text-sm sm:text-base leading-relaxed font-medium">
                                Be the first to access exclusive luxury releases,<br className="hidden sm:inline" /> private member discounts, and VIP invitations.
                            </p>
                            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3.5 sm:gap-5 w-full sm:w-auto px-2 sm:px-0">
                                <Button asChild size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 text-base font-extrabold bg-black text-white hover:bg-neutral-800 shadow-xl rounded-xl transition-all active:scale-95">
                                    <Link to="/register">Create an Account <ArrowRight className="h-5 w-5 ml-2" /></Link>
                                </Button>
                                <Button asChild size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 text-base font-extrabold bg-white text-black hover:bg-neutral-100 border-2 border-black rounded-xl shadow-md transition-all active:scale-95">
                                    <Link to="/shop">Browse Collection</Link>
                                </Button>
                            </div>
                            {/* Stats */}
                            <div className="mt-12 sm:mt-16 flex items-center justify-center gap-8 sm:gap-16 flex-wrap">
                                {[
                                    { val: "5000+", label: "Happy Customers" },
                                    { val: "500+", label: "Authentic Products" },
                                    { val: "100%", label: "Authentic Luxury" },
                                ].map((s) => (
                                    <div key={s.label} className="text-center">
                                        <div className="font-serif text-2xl sm:text-4xl font-extrabold text-black">{s.val}</div>
                                        <div className="text-xs text-neutral-500 mt-1 font-semibold tracking-wide uppercase">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
