import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useCategories } from "@/features/catalog/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesPage() {
    const { data: categories, isLoading } = useCategories();

    return (
        <div className="container-bk py-12">
            <div className="mb-10 text-center max-w-2xl mx-auto">
                <p className="eyebrow mb-2">Curated Collections</p>
                <h1 className="font-serif text-4xl font-extrabold tracking-tight sm:text-5xl text-text-primary">
                    Explore Categories
                </h1>
                <p className="mt-3 text-body-lg text-text-secondary">
                    Browse our thoughtfully curated selection of luxury home, fashion, and lifestyle essentials.
                </p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {categories?.map((cat, i) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: i * 0.05 }}
                        >
                            <Link
                                to={`/shop/${cat.slug}`}
                                className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-bg-secondary via-bg-light to-[#EAE5DF] shadow-md transition-all duration-300 hover:shadow-2xl"
                            >
                                {cat.image_url ? (
                                    <img
                                        src={cat.image_url}
                                        alt={cat.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-black/10 via-transparent to-black/20">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-btn-primary/10 text-btn-primary mb-3">
                                            <Sparkles className="h-6 w-6" />
                                        </div>
                                        <span className="font-serif text-2xl font-bold text-text-primary">{cat.name}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end">
                                    <h3 className="font-serif text-2xl font-bold text-white tracking-tight drop-shadow-md">
                                        {cat.name}
                                    </h3>
                                    {cat.description && (
                                        <p className="mt-1 line-clamp-1 text-xs text-white/70">
                                            {cat.description}
                                        </p>
                                    )}
                                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-200 group-hover:translate-x-1 transition-transform">
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

