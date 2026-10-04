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
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-neutral-600 bg-neutral-100 border border-neutral-200 px-4 py-1 rounded-full">
                    <Sparkles className="h-3.5 w-3.5 text-black" /> Curated Collections
                </span>
                <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-black">
                    Explore Categories
                </h1>
                <p className="mt-3 text-sm sm:text-base text-neutral-600 font-medium">
                    Browse our thoughtfully curated selection of original luxury timepieces, footwear, and lifestyle essentials.
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
                                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-3xl border border-neutral-200 hover:border-black shadow-sm hover:shadow-2xl transition-all duration-300 bg-neutral-100"
                            >
                                {cat.image_url ? (
                                    <img
                                        src={cat.image_url}
                                        alt={cat.name}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                                    />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-200">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white mb-3 shadow-md">
                                            <Sparkles className="h-6 w-6" />
                                        </div>
                                        <span className="font-serif text-2xl font-bold text-black">{cat.name}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent transition-opacity duration-300 group-hover:opacity-100" />
                                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col justify-end">
                                    <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
                                        {cat.name}
                                    </h3>
                                    {cat.description && (
                                        <p className="mt-1 line-clamp-1 text-xs text-white/80 font-medium">
                                            {cat.description}
                                        </p>
                                    )}
                                    <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-neutral-300 group-hover:translate-x-1 group-hover:text-white transition-all">
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

