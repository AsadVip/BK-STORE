import { useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, X, Grid2X2, Grid3X3, RotateCcw } from "lucide-react";

import { useProducts, useCategories, useBrands, useBanners, type ShopFilters } from "@/features/catalog/api";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/product/product-card-skeleton";
import { PromoBanner } from "@/components/storefront/promo-banner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";

const SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "popular", label: "Most Popular" },
    { value: "rating", label: "Top Rated" },
];

export default function ShopPage() {
    const { categorySlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: categories } = useCategories();
    const { data: brands } = useBrands();
    const { data: topBanners } = useBanners("shop_top");

    const activeCategory = useMemo(
        () => categories?.find((c) => c.slug === categorySlug),
        [categories, categorySlug],
    );

    const [sort, setSort] = useState<ShopFilters["sort"]>("newest");
    const [page, setPage] = useState(1);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
    const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

    const filters: ShopFilters = {
        category: activeCategory?.id,
        brand: selectedBrand,
        maxPrice,
        sort,
        page,
        pageSize: 12,
    };

    const { data, isLoading } = useProducts(filters);

    const updateParam = (key: string, value: string | null) => {
        const next = new URLSearchParams(searchParams);
        if (value === null) next.delete(key);
        else next.set(key, value);
        setSearchParams(next, { replace: true });
    };

    return (
        <div className="container-bk py-10 animate-page-fade">
            {/* Header */}
            <div className="mb-8 space-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#01411C] bg-[#01411C]/10 border border-[#01411C]/20 px-3.5 py-1 rounded-full">
                    🇵🇰 14th August Azadi Collection
                </span>
                <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-[#01411C]">
                    {activeCategory ? activeCategory.name : "All Timepieces & Products"}
                </h1>
                {activeCategory?.description && (
                    <p className="mt-2 max-w-2xl text-text-secondary font-medium text-sm sm:text-base">{activeCategory.description}</p>
                )}
            </div>

            {/* Shop top promo banner */}
            {topBanners && topBanners.length > 0 && (
                <div className="mb-8">
                    <PromoBanner banner={topBanners[0]} variant="compact" />
                </div>
            )}

            <div className="flex gap-8">
                {/* Filter sidebar (desktop) */}
                <aside className="hidden w-64 shrink-0 lg:block">
                    <FilterPanel
                        categories={categories}
                        brands={brands}
                        activeCategorySlug={categorySlug}
                        selectedBrand={selectedBrand}
                        onSelectBrand={setSelectedBrand}
                        maxPrice={maxPrice}
                        onMaxPrice={setMaxPrice}
                    />
                </aside>

                {/* Main */}
                <div className="min-w-0 flex-1">
                    {/* Toolbar */}
                    <div className="mb-6 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
                        <p className="text-sm text-text-secondary">
                            {data ? `${data.total} products` : "Loading…"}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setFilterOpen(true)}>
                                <SlidersHorizontal className="h-4 w-4" /> Filters
                            </Button>
                            <Select value={sort} onValueChange={(v) => setSort(v as ShopFilters["sort"])}>
                                <SelectTrigger className="w-44"><SelectValue placeholder="Sort by" /></SelectTrigger>
                                <SelectContent>
                                    {SORT_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Grid */}
                    {isLoading ? (
                        <ProductGridSkeleton count={12} />
                    ) : data && data.items.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
                            {data.items.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={SlidersHorizontal}
                            title="No products found"
                            description="Try adjusting your filters or search terms."
                            action={<Button asChild><Link to="/shop">Clear filters</Link></Button>}
                        />
                    )}

                    {/* Pagination */}
                    {data && data.pages > 1 && (
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
                </div>
            </div>

            {/* Mobile filter drawer */}
            {filterOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
                    <div className="absolute right-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-bg-primary p-6 shadow-xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="font-serif text-xl font-semibold">Filters</h2>
                            <button onClick={() => setFilterOpen(false)} aria-label="Close filters">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <FilterPanel
                            categories={categories}
                            brands={brands}
                            activeCategorySlug={categorySlug}
                            selectedBrand={selectedBrand}
                            onSelectBrand={setSelectedBrand}
                            maxPrice={maxPrice}
                            onMaxPrice={setMaxPrice}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

interface FilterPanelProps {
    categories?: ReturnType<typeof useCategories>["data"];
    brands?: ReturnType<typeof useBrands>["data"];
    activeCategorySlug?: string;
    selectedBrand?: string;
    onSelectBrand: (id: string | undefined) => void;
    maxPrice?: number;
    onMaxPrice: (v: number | undefined) => void;
}

function FilterPanel({ categories, brands, activeCategorySlug, selectedBrand, onSelectBrand, maxPrice, onMaxPrice }: FilterPanelProps) {
    return (
        <div className="space-y-8">
            <div>
                <h3 className="mb-3 font-sans text-xs font-bold uppercase tracking-wider text-text-secondary">Categories</h3>
                {categories ? (
                    <ul className="space-y-1.5">
                        <li>
                            <Link
                                to="/shop"
                                className={cn(
                                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-bg-secondary hover:text-text-primary",
                                    !activeCategorySlug ? "bg-bg-secondary text-btn-primary font-semibold" : "text-text-secondary"
                                )}
                            >
                                All Products
                            </Link>
                        </li>
                        {categories.map((c) => {
                            const isActive = activeCategorySlug === c.slug;
                            return (
                                <li key={c.id}>
                                    <Link
                                        to={`/shop/${c.slug}`}
                                        className={cn(
                                            "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-bg-secondary hover:text-text-primary",
                                            isActive ? "bg-bg-secondary text-btn-primary font-semibold" : "text-text-secondary"
                                        )}
                                    >
                                        <span>{c.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4 w-3/4" />)}</div>
                )}
            </div>

            <div>
                <h3 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-text-secondary">Brand</h3>
                {brands ? (
                    <ul className="space-y-1.5">
                        <li>
                            <button
                                className={cn("text-sm hover:text-text-primary", !selectedBrand ? "text-text-primary font-medium" : "text-text-secondary")}
                                onClick={() => onSelectBrand(undefined)}
                            >
                                All Brands
                            </button>
                        </li>
                        {brands.map((b) => (
                            <li key={b.id}>
                                <button
                                    className={cn("text-sm hover:text-text-primary", selectedBrand === b.id ? "text-text-primary font-medium" : "text-text-secondary")}
                                    onClick={() => onSelectBrand(b.id)}
                                >
                                    {b.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-4 w-2/3" />)}</div>
                )}
            </div>

            <div>
                <h3 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-text-secondary">Max Price</h3>
                <input
                    type="range"
                    min={0}
                    max={1000}
                    step={50}
                    value={maxPrice ?? 1000}
                    onChange={(e) => onMaxPrice(Number(e.target.value))}
                    className="w-full accent-btn-primary"
                />
                <p className="mt-1 text-sm text-text-secondary">
                    Up to {formatCurrency(maxPrice ?? 1000)}
                </p>
            </div>
        </div>
    );
}
