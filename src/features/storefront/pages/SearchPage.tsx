import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { useProducts } from "@/features/catalog/api";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/product/product-card-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/lib/seo";

export default function SearchPage() {
    const [params] = useSearchParams();
    const q = params.get("q") ?? "";
    const [page, setPage] = useState(1);

    useSEO({
        title: q ? `Search: "${q}" | BK Store — BK Tajir` : "Search Products | BK Store — BK Tajir",
        description: `Search luxury watches, earbuds, and premium footwear at BK Store (BK Tajir at bktajir.com). Cash on Delivery in Pakistan.`,
        canonicalPath: q ? `/search?q=${encodeURIComponent(q)}` : "/search",
    });

    useEffect(() => {
        setPage(1);
    }, [q]);

    const { data, isLoading } = useProducts({ search: q, page, pageSize: 12 });

    return (
        <div className="container-bk py-12 animate-page-fade">
            <div className="mb-8">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-neutral-600 bg-neutral-100 border border-neutral-200 px-3.5 py-1 rounded-full mb-2">
                    Search Results
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-black">
                    {q ? <>Showing results for "{q}"</> : "Search"}
                </h1>
                {data && <p className="mt-2 text-sm text-neutral-600 font-medium">{data.total} products found</p>}
            </div>

            {isLoading ? (
                <ProductGridSkeleton count={8} />
            ) : data && data.items.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                        {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
                    </div>

                    {/* Pagination */}
                    {data.pages > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="rounded-xl border border-neutral-300 bg-white text-black font-bold hover:bg-black hover:text-white transition-all disabled:opacity-40"
                            >
                                Previous
                            </Button>
                            <span className="text-xs font-bold text-neutral-600 px-3">
                                Page {page} of {data.pages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === data.pages}
                                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                                className="rounded-xl border border-neutral-300 bg-white text-black font-bold hover:bg-black hover:text-white transition-all disabled:opacity-40"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <EmptyState
                    icon={SearchX}
                    title="No results found"
                    description={`We couldn't find any products matching "${q}". Try a different search term.`}
                    action={<Button asChild><Link to="/shop">Browse all products</Link></Button>}
                />
            )}
        </div>
    );
}

