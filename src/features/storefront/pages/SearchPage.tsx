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
    const { data, isLoading } = useProducts({ search: q, pageSize: 24 });

    return (
        <div className="container-bk py-12">
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
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
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

