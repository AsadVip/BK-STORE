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
    { icon: Truck, title: "Azadi Free Shipping", desc: "Express delivery across Pakistan" },
    { icon: ShieldCheck, title: "100% Authentic Luxury", desc: "Verified original timepieces" },
    { icon: Gift, title: "Azadi Special Box", desc: "Free patriotic luxury packaging" },
    { icon: RefreshCw, title: "Hassle-Free Exchange", desc: "30-Day easy returns & warranty" },
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
            {/* ── Hero Section (14th August Independence Day Luxury Campaign) ── */}
            <section className="relative overflow-hidden bg-[#001709] min-h-[75vh] sm:min-h-[85vh] flex items-center justify-center">
                {/* Background image & cinematic green backdrop with reduced overlay opacity */}
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
                            <div className="absolute inset-0 bg-gradient-to-r from-[#001709]/60 via-[#01411C]/35 to-[#001709]/60" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#001709]/80 via-transparent to-[#001709]/30" />
                        </motion.div>
                    ) : (
                        <motion.div
                            className="absolute inset-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                        >
                            <img
                                src="/pak_independence_luxury_watch.png"
                                alt="14th August Independence Day Luxury Watch Campaign"
                                className="h-full w-full object-cover object-center scale-105 filter brightness-105 contrast-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#001709]/50 via-[#01411C]/30 to-[#001709]/50" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#001709]/75 via-transparent to-[#001709]/25" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Elegant Radial Gold Lighting Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,transparent_75%)]" />

                {/* Soft Fireworks & Particles Animations Overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[15%] left-[15%] h-32 w-32 rounded-full border border-[#D4AF37]/20 bg-[radial-gradient(circle,rgba(212,175,55,0.25)_0%,transparent_70%)] animate-firework" />
                    <div className="absolute top-[25%] right-[20%] h-44 w-44 rounded-full border border-emerald-400/20 bg-[radial-gradient(circle,rgba(16,185,129,0.25)_0%,transparent_70%)] animate-firework" style={{ animationDelay: '1.2s' }} />
                    <div className="absolute bottom-[20%] left-[25%] h-28 w-28 rounded-full border border-[#D4AF37]/20 bg-[radial-gradient(circle,rgba(212,175,55,0.2)_0%,transparent_70%)] animate-firework" style={{ animationDelay: '2.4s' }} />

                    {/* Floating Soft Gold Particles */}
                    <div className="absolute top-[30%] left-[10%] h-2 w-2 rounded-full bg-[#D4AF37] blur-[1px] animate-particle" style={{ animationDuration: '7s' }} />
                    <div className="absolute top-[60%] right-[15%] h-2.5 w-2.5 rounded-full bg-[#D4AF37] blur-[1px] animate-particle" style={{ animationDuration: '9s', animationDelay: '2s' }} />
                    <div className="absolute top-[20%] right-[35%] h-1.5 w-1.5 rounded-full bg-emerald-300 blur-[1px] animate-particle" style={{ animationDuration: '8s', animationDelay: '1s' }} />
                </div>

                {/* Minar-e-Pakistan Silhouette (Right Side Element - Subtle Line Art) */}
                <div className="hidden lg:block absolute right-8 bottom-0 pointer-events-none z-10 opacity-30 transition-opacity duration-500 hover:opacity-45">
                    <svg className="w-56 h-[480px] text-[#D4AF37]" viewBox="0 0 200 450" fill="none" stroke="currentColor" strokeWidth="1.5">
                        {/* Elegant Minar-e-Pakistan Outline Silhouette */}
                        <path d="M100 20 L100 40 M95 40 L105 40 M98 40 L98 70 M102 70 L98 70 M92 70 L108 70 M96 70 L96 120 M104 120 L96 120 M90 120 L110 120 M94 120 L90 220 M106 120 L110 220 M85 220 L115 220 M88 220 L80 340 M112 220 L120 340 M70 340 L130 340 M75 340 L60 440 M125 340 L140 440 M40 440 L160 440 M30 450 L170 450" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Crescent Moon & Star At Apex */}
                        <path d="M100 8 A6 6 0 1 1 106 14 A5 5 0 1 0 100 8" fill="currentColor" stroke="none" />
                        <polygon points="107,6 108,9 111,9 109,11 110,14 107,12 104,14 105,11 103,9 106,9" fill="currentColor" stroke="none" />
                        {/* Soft Base Rings */}
                        <ellipse cx="100" cy="340" rx="30" ry="6" strokeDasharray="3 3" opacity="0.6" />
                        <ellipse cx="100" cy="220" rx="15" ry="4" strokeDasharray="2 2" opacity="0.6" />
                    </svg>
                </div>

                <div className="container-bk relative flex flex-col items-center justify-center py-20 sm:py-28 text-center z-20">
                    {heroLoading ? (
                        <div className="flex flex-col items-center gap-6">
                            <Skeleton className="h-4 w-40 bg-white/20" />
                            <Skeleton className="h-16 w-[28rem] max-w-full bg-white/20" />
                            <div className="flex gap-4">
                                <Skeleton className="h-14 w-44 rounded-[12px] bg-white/20" />
                                <Skeleton className="h-14 w-44 rounded-[12px] bg-white/20" />
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
                                    <span className="inline-flex items-center gap-2 rounded-full bg-[#01411C]/80 backdrop-blur-md px-5 sm:px-7 py-2 text-xs sm:text-sm font-extrabold uppercase tracking-[0.22em] text-[#D4AF37] border border-[#D4AF37]/50 shadow-xl gold-glow-pulse">
                                        <span className="text-base" role="img" aria-label="Pakistan Flag">🇵🇰</span>
                                        {(heroBanner?.text_overlay && heroBanner?.title) ? heroBanner.title : "14TH AUGUST AZADI LUXURY EDITION"}
                                    </span>
                                </div>

                                <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.12] tracking-tight text-white drop-shadow-2xl max-w-3xl mx-auto">
                                    {heroBanner?.text_overlay || "14th August Independence Day Sale With BK Store"}
                                </h1>

                                <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-sm sm:text-lg text-white/90 font-medium leading-relaxed drop-shadow-md">
                                    Celebrate Freedom with Timeless Luxury — Discover curated boutique timepieces crafted for perfection.
                                </p>

                                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3.5 sm:gap-5 w-full sm:w-auto px-2 sm:px-0">
                                    <Button asChild size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 text-base font-extrabold bg-[#D4AF37] text-[#01411C] hover:bg-white hover:text-[#01411C] shadow-2xl rounded-[12px] border border-white/50 transition-all active:scale-95">
                                        <Link to={heroCtaInternal ? heroCtaUrl : "/shop"}>
                                            Shop Collection <ArrowRight className="h-5 w-5 ml-2" />
                                        </Link>
                                    </Button>
                                    <Button asChild size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 text-base font-extrabold bg-[#01411C]/90 sm:bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-[#D4AF37]/60 rounded-[12px] shadow-xl transition-all active:scale-95">
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
                                    i === heroIndex ? "w-10 bg-[#D4AF37] shadow-md" : "w-2.5 bg-white/40 hover:bg-white/70",
                                )}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Value Props Bar ── */}
            <section className="border-y border-[#01411C]/20 bg-gradient-to-r from-slate-50 via-[#01411C]/5 to-slate-50">
                <div className="container-bk grid grid-cols-2 gap-3 sm:gap-5 py-6 sm:py-10 lg:grid-cols-4">
                    {VALUE_PROPS.map((vp, i) => (
                        <Reveal key={vp.title} direction="up" delay={i * 80} className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl transition-all duration-300 hover:bg-white hover:shadow-md border border-transparent hover:border-[#01411C]/15">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#01411C]/10 text-[#01411C] border border-[#01411C]/20 shadow-xs">
                                <vp.icon className="h-6 w-6 stroke-[2.2]" />
                            </div>
                            <div>
                                <p className="text-sm font-extrabold text-[#01411C]">{vp.title}</p>
                                <p className="text-xs text-text-secondary font-medium">{vp.desc}</p>
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
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#01411C] mb-1">
                            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" /> 14th August Azadi Collections
                        </span>
                        <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#01411C]">Shop by Category</h2>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="font-bold text-[#01411C] hover:text-[#D4AF37] hover:bg-[#01411C]/5">
                        <Link to="/categories">View all <ChevronRight className="h-4 w-4 ml-0.5" /></Link>
                    </Button>
                </div>

                {/* Category Grid with real images, green borders, gold shadows, and premium hover glow */}
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
                                        className="group relative block aspect-[3/4] sm:aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-3xl border border-[#01411C]/30 hover:border-[#01411C] shadow-[0_4px_20px_rgba(212,175,55,0.12)] hover:shadow-[0_0_25px_rgba(1,65,28,0.25)] transition-all duration-300"
                                    >
                                        {/* Top Left Azadi Badge */}
                                        <div className="absolute top-2.5 left-2.5 z-20 rounded-full bg-[#01411C] text-[#D4AF37] text-[9px] sm:text-[10px] font-extrabold px-2.5 py-0.5 shadow-md border border-[#D4AF37]/50 flex items-center gap-1 backdrop-blur-xs">
                                            <span role="img" aria-label="Pakistan Flag">🇵🇰</span> AZADI SPECIAL
                                        </div>

                                        {(cat as any).image_url ? (
                                            <img
                                                src={(cat as any).image_url}
                                                alt={cat.name}
                                                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-108"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#01411C]/10 via-slate-100 to-[#D4AF37]/10 p-4">
                                                <div className="text-center">
                                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#01411C] text-[#D4AF37] shadow-md">
                                                        <Sparkles className="h-6 w-6" />
                                                    </div>
                                                    <span className="font-serif text-lg sm:text-xl font-bold text-[#01411C]">{cat.name}</span>
                                                </div>
                                            </div>
                                        )}
                                        {/* Deep emerald gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#001709]/95 via-[#01411C]/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 translate-y-0 sm:translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                                            <h3 className="font-serif text-base sm:text-xl font-extrabold text-white leading-snug drop-shadow-md">{cat.name}</h3>
                                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] sm:text-xs font-extrabold text-[#D4AF37] opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
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
            <Reveal as="section" className="bg-gradient-to-b from-slate-50 via-[#01411C]/5 to-slate-50 py-20 border-y border-[#01411C]/15">
                <div className="container-bk">
                    <div className="mb-8 sm:mb-12 flex items-end justify-between gap-2 min-w-0">
                        <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#01411C] mb-1">
                                <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" /> 14th August Azadi Release
                            </span>
                            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#01411C]">New Arrivals</h2>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="font-bold text-[#01411C] hover:text-[#D4AF37] hover:bg-[#01411C]/5">
                            <Link to="/shop">View all <ChevronRight className="h-4 w-4 ml-0.5" /></Link>
                        </Button>
                    </div>
                    {newArrivals && newArrivals.items.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
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
                    <div className="mb-8 sm:mb-12 flex items-end justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#01411C] mb-1">
                                <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" /> Customer Favorites
                            </span>
                            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#01411C]">Best Sellers</h2>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="font-bold text-[#01411C] hover:text-[#D4AF37] hover:bg-[#01411C]/5">
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

            {/* ── Membership Section (Cinematic Dark Green Watch Backdrop) ── */}
            <Reveal as="section" className="relative overflow-hidden py-28 bg-[#001709]">
                {/* Cinematic background image with clear visibility */}
                <div className="absolute inset-0">
                    <img
                        src="/pak_membership_luxury_watch.png"
                        alt="Luxury Watch Club"
                        className="h-full w-full object-cover object-center scale-105 filter brightness-105 contrast-105"
                    />
                    {/* Deep Pakistan green overlay with reduced opacity for image visibility */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#001709]/50 via-[#01411C]/30 to-[#001709]/50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#001709]/75 via-transparent to-[#001709]/25" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,transparent_75%)]" />
                </div>

                {/* Soft Floating Gold Sparkle Particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[20%] left-[20%] h-2 w-2 rounded-full bg-[#D4AF37] blur-[1px] animate-particle" style={{ animationDuration: '6s' }} />
                    <div className="absolute bottom-[25%] right-[25%] h-2.5 w-2.5 rounded-full bg-[#D4AF37] blur-[1px] animate-particle" style={{ animationDuration: '8s', animationDelay: '1.5s' }} />
                </div>

                {/* Content */}
                <div className="container-bk text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#01411C]/80 backdrop-blur-md px-5 py-2 text-xs font-extrabold uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/50 mb-6 shadow-xl gold-glow-pulse">
                            <Sparkles className="h-4 w-4 text-[#D4AF37]" /> Exclusive Members Club
                        </span>
                        <h2 className="mx-auto max-w-2xl font-serif text-3xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-2xl">
                            Join the BK Store<br />Inner Circle
                        </h2>
                        <p className="mx-auto mt-5 max-w-md text-white/90 text-sm sm:text-base leading-relaxed font-medium drop-shadow-md">
                            Be the first to access exclusive 14th August luxury releases,<br className="hidden sm:inline" /> VIP discounts, and private events.
                        </p>
                        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3.5 sm:gap-5 w-full sm:w-auto px-2 sm:px-0">
                            <Button asChild size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 text-base font-extrabold bg-[#D4AF37] text-[#01411C] hover:bg-white hover:text-[#01411C] shadow-2xl rounded-[12px] border border-white/50 transition-all active:scale-95">
                                <Link to="/register">Create an Account <ArrowRight className="h-5 w-5 ml-2" /></Link>
                            </Button>
                            <Button asChild size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 text-base font-extrabold bg-[#01411C]/90 sm:bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-[#D4AF37]/60 rounded-[12px] shadow-xl transition-all active:scale-95">
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
                                    <div className="font-serif text-2xl sm:text-4xl font-extrabold text-[#D4AF37] drop-shadow-md">{s.val}</div>
                                    <div className="text-xs text-white/70 mt-1 font-medium tracking-wide">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </Reveal>
        </div>
    );
}
