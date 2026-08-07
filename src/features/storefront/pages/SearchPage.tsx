import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { useProducts } from "@/features/catalog/api";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/product/product-card-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
    const [params] = useSearchParams();
    const q = params.get("q") ?? "";
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [q]);

    const { data, isLoading } = useProducts({ search: q, page, pageSize: 12 });

    return (
        <div className="container-bk py-12 animate-page-fade">
            <div className="mb-8">
                <p className="eyebrow mb-2">Search Results</p>
                <h1 className="font-serif text-3xl font-semibold">
                    {q ? <>Showing results for "{q}"</> : "Search"}
                </h1>
                {data && <p className="mt-2 text-sm text-text-secondary">{data.total} products found</p>}
            </div>

            {isLoading ? (
                <ProductGridSkeleton count={8} />
            ) : data && data.items.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                        {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
                    </div>

                    {/* Pagination */}
                    {data.pages > 1 && (
                        <div className="mt-10 flex items-center justify-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-text-secondary">
                                Page {page} of {data.pages}
                            </span>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page === data.pages}
                                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
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

