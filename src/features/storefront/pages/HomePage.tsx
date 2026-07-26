import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Truck, ShieldCheck, RefreshCw, Headphones, Sparkles, ChevronRight } from "lucide-react";
import { useCategories, useProducts, useBanners } from "@/features/catalog/api";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/product/product-card-skeleton";
import { PromoBanner } from "@/components/storefront/promo-banner";
import { Reveal } from "@/components/storefront/reveal";
import { Typewriter } from "@/components/storefront/typewriter";
import { CustomerReviews } from "@/components/storefront/customer-reviews";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const VALUE_PROPS = [
    { icon: Truck, title: "Free Delivery", desc: "On orders over Rs 5,000" },
    { icon: ShieldCheck, title: "100% Authentic", desc: "Verified luxury products" },
    { icon: RefreshCw, title: "Easy Returns", desc: "30-day hassle-free returns" },
    { icon: Headphones, title: "24/7 Support", desc: "Always here to help" },
];

export default function HomePage() {
    const { data: categories } = useCategories();
    const { data: newArrivals } = useProducts({ placement: "new_arrival", pageSize: 8 });
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

    return (
        <div>
            {/* ── Hero Section ── */}
            <section className="relative overflow-hidden bg-bg-primary">
                <AnimatePresence>
                    {heroBanner && (
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
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                        </motion.div>
                    )}
                </AnimatePresence>
                {!heroBanner && !heroLoading && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a00] via-[#2d1a0f] to-[#1a0a00]" />
                )}

                <div className="container-bk relative flex min-h-[80vh] flex-col items-center justify-center py-24 text-center">
                    {heroLoading ? (
                        <div className="flex flex-col items-center gap-6">
                            <Skeleton className="h-4 w-40 bg-white/20" />
                            <Skeleton className="h-16 w-[28rem] max-w-full bg-white/20" />
                            <div className="flex gap-4">
                                <Skeleton className="h-14 w-44 rounded-full bg-white/20" />
                                <Skeleton className="h-14 w-44 rounded-full bg-white/20" />
                            </div>
                        </div>
                    ) : heroBanner ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={heroBanner.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="max-w-4xl mx-auto px-4 relative z-10"
                            >
                                <div className="mb-4 sm:mb-6">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-btn-primary/20 backdrop-blur-md px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] text-amber-300 border border-amber-500/40 shadow-lg">
                                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
                                        {(heroBanner.text_overlay && heroBanner.title) ? heroBanner.title : "SPECIAL EDITION"}
                                    </span>
                                </div>
                                <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-2xl max-w-3xl mx-auto">
                                    {heroBanner.text_overlay || heroBanner.title || "WELCOME TO BK STORE"}
                                </h1>
                                <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-sm sm:text-base text-white/90 font-medium leading-relaxed drop-shadow-md">
                                    Discover boutique-grade authentic luxury timepieces and footwear, curated for perfection.
                                </p>
                                <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                                    <Button asChild size="lg" className="h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-extrabold bg-btn-primary text-white hover:bg-btn-primary-hover shadow-2xl rounded-2xl border border-btn-primary/50 transition-all hover:scale-105 active:scale-95">
                                        {heroCtaInternal ? (
                                            <Link to={heroCtaUrl}>
                                                {heroBanner.cta_label || (heroBanner as any).button_text || (heroBanner as any).cta_text || "Shop Collection"} <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1.5" />
                                            </Link>
                                        ) : (
                                            <a href={heroCtaUrl} target="_blank" rel="noreferrer">
                                                {heroBanner.cta_label || (heroBanner as any).button_text || (heroBanner as any).cta_text || "Shop Collection"} <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1.5" />
                                            </a>
                                        )}
                                    </Button>
                                    <Button asChild size="lg" className="h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-semibold bg-black/40 backdrop-blur-md text-white hover:bg-black/70 border border-white/30 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95">
                                        <Link to="/categories">Browse Categories</Link>
                                    </Button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="max-w-3xl relative z-10"
                        >
                            <span className="inline-flex items-center gap-2 rounded-full bg-btn-primary/20 backdrop-blur-sm px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30 mb-6">
                                <Sparkles className="h-3.5 w-3.5" /> Premium Curated Collection
                            </span>
                            <h1 className="font-serif text-5xl font-extrabold leading-tight text-white sm:text-6xl lg:text-7xl tracking-tight drop-shadow-xl">
                                Luxury Watches &<br />Shoes Collection
                            </h1>
                            <p className="mx-auto mt-6 max-w-xl text-base text-white/70 leading-relaxed">
                                Discover a boutique-grade selection of authentic luxury timepieces and footwear, curated for modern living.
                            </p>
                            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                                <Button asChild size="lg" className="h-14 px-10 text-base font-bold bg-btn-primary text-white hover:bg-btn-primary-hover shadow-xl rounded-2xl">
                                    <Link to="/shop">Shop Collection <ArrowRight className="h-5 w-5 ml-1" /></Link>
                                </Button>
                                <Button asChild size="lg" className="h-14 px-10 text-base font-semibold bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/30 rounded-2xl">
                                    <Link to="/categories">Browse Categories</Link>
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Banner dots */}
                {heroBanners && heroBanners.length > 1 && (
                    <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
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
            <section className="border-y border-border/60 bg-gradient-to-r from-bg-secondary via-bg-light to-bg-secondary">
                <div className="container-bk grid grid-cols-2 gap-4 py-10 lg:grid-cols-4">
                    {VALUE_PROPS.map((vp, i) => (
                        <Reveal key={vp.title} direction="up" delay={i * 80} className="flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 hover:bg-white/60 hover:shadow-sm">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-btn-primary/10 text-btn-primary shadow-sm">
                                <vp.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-primary">{vp.title}</p>
                                <p className="text-xs text-text-secondary">{vp.desc}</p>
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
                <div className="mb-10 flex items-end justify-between">
                    <div>
                        <p className="eyebrow mb-2">Explore</p>
                        <h2 className="font-serif text-3xl font-bold text-text-primary">Shop by Category</h2>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="font-semibold text-btn-primary hover:text-btn-primary-hover">
                        <Link to="/categories">View all <ChevronRight className="h-4 w-4" /></Link>
                    </Button>
                </div>

                {/* Category Grid with real images */}
                <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-4">
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
                                        className="group relative block aspect-[3/4] sm:aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 border border-border/40"
                                    >
                                        {(cat as any).image_url ? (
                                            <img
                                                src={(cat as any).image_url}
                                                alt={cat.name}
                                                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bg-secondary via-bg-light to-[#EAE5DF] p-4">
                                                <div className="text-center">
                                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-btn-primary/10 text-btn-primary shadow-sm">
                                                        <Sparkles className="h-6 w-6" />
                                                    </div>
                                                    <span className="font-serif text-lg sm:text-xl font-bold text-text-primary">{cat.name}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent transition-opacity duration-300 group-hover:opacity-95" />
                                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 translate-y-0 sm:translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                                            <h3 className="font-serif text-base sm:text-xl font-extrabold text-white leading-snug drop-shadow-md">{cat.name}</h3>
                                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-amber-300 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
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
            <Reveal as="section" className="bg-bg-secondary py-20">
                <div className="container-bk">
                    <div className="mb-10 flex items-end justify-between">
                        <div>
                            <p className="eyebrow mb-2">Just In</p>
                            <h2 className="font-serif text-3xl font-bold text-text-primary">New Arrivals</h2>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="font-semibold text-btn-primary hover:text-btn-primary-hover">
                            <Link to="/shop">View all <ChevronRight className="h-4 w-4" /></Link>
                        </Button>
                    </div>
                    {newArrivals && newArrivals.items.length > 0 ? (
                        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                            {newArrivals.items.map((p, i) => (
                                <Reveal key={p.id} direction="up" delay={i * 60}>
                                    <ProductCard product={p} />
                                </Reveal>
                            ))}
                        </div>
                    ) : (
                        <ProductGridSkeleton count={8} />
                    )}
                </div>
            </Reveal>

            {/* ── Best Sellers ── */}
            {bestSellers && bestSellers.items.length > 0 && (
                <Reveal as="section" className="container-bk py-20">
                    <div className="mb-10 flex items-end justify-between">
                        <div>
                            <p className="eyebrow mb-2">Customer Favorites</p>
                            <h2 className="font-serif text-3xl font-bold text-text-primary">Best Sellers</h2>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="font-semibold text-btn-primary hover:text-btn-primary-hover">
                            <Link to="/shop">View all <ChevronRight className="h-4 w-4" /></Link>
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                        {bestSellers.items.map((p, i) => (
                            <Reveal key={p.id} direction="up" delay={i * 60}>
                                <ProductCard product={p} />
                            </Reveal>
                        ))}
                    </div>
                </Reveal>
            )}

            {/* ── Customer Reviews ── */}
            <CustomerReviews />

            {/* ── Newsletter CTA with Cinematic Background ── */}
            <Reveal as="section" className="relative overflow-hidden py-28">
                {/* Cinematic background image */}
                <div className="absolute inset-0">
                    <img
                        src="/hero-bg.png"
                        alt="Luxury Collection"
                        className="h-full w-full object-cover object-center"
                    />
                    {/* Multi-layer black opacity overlay for cinematic feel */}
                    <div className="absolute inset-0 bg-black/72" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />
                    {/* Subtle vignette */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />
                </div>

                {/* Content */}
                <div className="container-bk text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30 mb-6">
                            <Sparkles className="h-3.5 w-3.5" /> Exclusive Members Club
                        </span>
                        <h2 className="mx-auto max-w-2xl font-serif text-4xl sm:text-5xl font-extrabold text-white leading-tight drop-shadow-xl">
                            Join the BK Store<br />Inner Circle
                        </h2>
                        <p className="mx-auto mt-5 max-w-md text-white/60 text-sm leading-relaxed">
                            Be the first to know about new arrivals, exclusive offers,<br className="hidden sm:inline" /> and members-only events.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                            <Button asChild size="lg" className="rounded-2xl px-10 h-13 bg-btn-primary text-white font-bold hover:bg-btn-primary-hover shadow-xl">
                                <Link to="/register">Create an Account <ArrowRight className="h-5 w-5 ml-2" /></Link>
                            </Button>
                            <Button asChild size="lg" className="rounded-2xl px-8 h-13 bg-white/10 backdrop-blur-md text-white border border-white/30 font-semibold hover:bg-white/20">
                                <Link to="/shop">Browse Collection</Link>
                            </Button>
                        </div>
                        {/* Stats */}
                        <div className="mt-12 flex items-center justify-center gap-8 sm:gap-16">
                            {[
                                { val: "5000+", label: "Happy Customers" },
                                { val: "500+", label: "Premium Products" },
                                { val: "100%", label: "Authentic Luxury" },
                            ].map((s) => (
                                <div key={s.label} className="text-center">
                                    <div className="font-serif text-2xl sm:text-3xl font-extrabold text-amber-400">{s.val}</div>
                                    <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </Reveal>
        </div>
    );
}
