import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useCategories } from "@/features/catalog/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesPage() {
    const { data: categories, isLoading } = useCategories();

    return (
        <div className="container-bk py-12 animate-page-fade">
            <div className="mb-10 text-center max-w-2xl mx-auto space-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#01411C] bg-[#01411C]/10 border border-[#01411C]/20 px-4 py-1 rounded-full">
                    <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" /> 🇵🇰 14th August Azadi Collections
                </span>
                <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-[#01411C]">
                    Explore Categories
                </h1>
                <p className="mt-3 text-sm sm:text-base text-text-secondary font-medium">
                    Browse our thoughtfully curated 14th August selection of luxury timepieces and lifestyle essentials.
                </p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {categories?.map((cat, i) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <Link
                                to={`/shop/${cat.slug}`}
                                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-3xl border border-[#01411C]/30 hover:border-[#01411C] shadow-[0_4px_20px_rgba(212,175,55,0.12)] hover:shadow-[0_0_25px_rgba(1,65,28,0.25)] transition-all duration-300"
                            >
                                {/* Top Left Azadi Badge */}
                                <div className="absolute top-2.5 left-2.5 z-20 rounded-full bg-[#01411C] text-[#D4AF37] text-[9px] sm:text-[10px] font-extrabold px-2.5 py-0.5 shadow-md border border-[#D4AF37]/50 flex items-center gap-1 backdrop-blur-xs">
                                    <span role="img" aria-label="Pakistan Flag">🇵🇰</span> AZADI EDITION
                                </div>

                                {cat.image_url ? (
                                    <img
                                        src={cat.image_url}
                                        alt={cat.name}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                                    />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#01411C]/10 via-slate-100 to-[#D4AF37]/10">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#01411C] text-[#D4AF37] mb-3 shadow-md">
                                            <Sparkles className="h-6 w-6" />
                                        </div>
                                        <span className="font-serif text-2xl font-bold text-[#01411C]">{cat.name}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#001709]/90 via-[#01411C]/30 to-transparent transition-opacity duration-300 group-hover:opacity-100" />
                                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col justify-end">
                                    <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
                                        {cat.name}
                                    </h3>
                                    {cat.description && (
                                        <p className="mt-1 line-clamp-1 text-xs text-white/80 font-medium">
                                            {cat.description}
                                        </p>
                                    )}
                                    <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#D4AF37] group-hover:translate-x-1 transition-transform">
                                        Explore Collection <ArrowRight className="h-3.5 w-3.5" />
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

