import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    useSupabaseImages,
    useImageUpload,
    type SupabaseImageItem,
} from "@/features/admin/api";
import {
    Search,
    RefreshCw,
    Check,
    UploadCloud,
    Loader2,
    Database,
    ExternalLink,
    Filter,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface MediaLibraryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Single-select callback: passes selected image URL */
    onSelect?: (url: string) => void;
    /** Multi-select callback: passes array of selected image URLs */
    onSelectMultiple?: (urls: string[]) => void;
    /** Whether multi-select is enabled. Default false. */
    multiSelect?: boolean;
    /** Pre-selected URL or URLs */
    selectedUrls?: string[];
    title?: string;
}

export function MediaLibraryDialog({
    open,
    onOpenChange,
    onSelect,
    onSelectMultiple,
    multiSelect = false,
    selectedUrls = [],
    title = "Select from Supabase Database",
}: MediaLibraryDialogProps) {
    const { data: images, isLoading, refetch, isRefetching } = useSupabaseImages();
    const uploadImage = useImageUpload();
    const { toast } = useToast();

    const [search, setSearch] = useState("");
    const [sourceFilter, setSourceFilter] = useState<string>("all");
    const [selectedSet, setSelectedSet] = useState<Set<string>>(() => new Set(selectedUrls));

    // Keep selectedSet in sync when dialog opens with initial selection
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setSelectedSet(new Set(selectedUrls));
            setSearch("");
            setSourceFilter("all");
        }
        onOpenChange(isOpen);
    };

    // Filter images by search and source
    const filteredImages = useMemo(() => {
        if (!images) return [];
        return images.filter((img) => {
            const matchesSearch =
                !search.trim() ||
                img.fileName.toLowerCase().includes(search.toLowerCase()) ||
                img.url.toLowerCase().includes(search.toLowerCase());

            const matchesSource =
                sourceFilter === "all" || img.source === sourceFilter;

            return matchesSearch && matchesSource;
        });
    }, [images, search, sourceFilter]);

    // Counts by source
    const counts = useMemo(() => {
        if (!images) return { all: 0, storage: 0, product: 0, banner: 0 };
        return {
            all: images.length,
            storage: images.filter((i) => i.source === "storage").length,
            product: images.filter((i) => i.source === "product").length,
            banner: images.filter((i) => i.source === "banner" || i.source === "media_asset").length,
        };
    }, [images]);

    const handleToggleSelect = (url: string) => {
        if (multiSelect) {
            setSelectedSet((prev) => {
                const next = new Set(prev);
                if (next.has(url)) next.delete(url);
                else next.add(url);
                return next;
            });
        } else {
            setSelectedSet(new Set([url]));
        }
    };

    const handleConfirm = () => {
        const arr = Array.from(selectedSet);
        if (arr.length === 0) {
            toast({ title: "Please select an image first", variant: "destructive" });
            return;
        }

        if (multiSelect) {
            onSelectMultiple?.(arr);
        } else {
            onSelect?.(arr[0]);
        }
        onOpenChange(false);
    };

    const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            const uploadedUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const url = await uploadImage.mutateAsync(files[i]);
                uploadedUrls.push(url);
            }

            await refetch();

            if (multiSelect) {
                setSelectedSet((prev) => new Set([...prev, ...uploadedUrls]));
                toast({
                    title: `${uploadedUrls.length} image(s) uploaded to Supabase`,
                    variant: "success",
                });
            } else {
                setSelectedSet(new Set([uploadedUrls[0]]));
                onSelect?.(uploadedUrls[0]);
                onOpenChange(false);
                toast({ title: "Image uploaded and selected", variant: "success" });
            }
        } catch (err) {
            toast({
                title: "Upload failed",
                description: err instanceof Error ? err.message : "Error uploading file",
                variant: "destructive",
            });
        } finally {
            e.target.value = "";
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-bg-primary text-text-primary rounded-2xl shadow-2xl border border-border">
                {/* Header */}
                <DialogHeader className="p-4 sm:p-5 border-b border-border bg-bg-secondary/40 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-btn-primary/10 text-btn-primary flex items-center justify-center">
                                <Database className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                                    {title}
                                    {images && (
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {images.length} available
                                        </Badge>
                                    )}
                                </DialogTitle>
                                <p className="text-xs text-text-secondary mt-0.5">
                                    {multiSelect
                                        ? "Choose one or multiple images already stored in your Supabase database."
                                        : "Click any image to select it for your banner, category, or brand."}
                                </p>
                            </div>
                        </div>

                        {/* Top quick actions: refresh & quick upload */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isRefetching || isLoading}
                                className="h-9 text-xs gap-1.5"
                                title="Refresh images from database"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </Button>

                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    multiple={multiSelect}
                                    accept="image/*"
                                    onChange={handleQuickUpload}
                                    className="hidden"
                                    disabled={uploadImage.isPending}
                                />
                                <div className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-btn-primary text-white text-xs font-semibold hover:opacity-90 shadow-sm transition-opacity">
                                    {uploadImage.isPending ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            <span>Uploading…</span>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="h-3.5 w-3.5" />
                                            <span>Upload New</span>
                                        </>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Filter tabs & Search Bar */}
                    <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        {/* Source Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                            {[
                                { key: "all", label: "All", count: counts.all },
                                { key: "storage", label: "Storage Uploads", count: counts.storage },
                                { key: "product", label: "Products", count: counts.product },
                                { key: "banner", label: "Banners & Media", count: counts.banner },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setSourceFilter(tab.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                        sourceFilter === tab.key
                                            ? "bg-btn-primary text-white shadow-xs"
                                            : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-neutral-200/60 dark:hover:bg-neutral-800"
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className="text-[10px] opacity-75 font-mono">({tab.count})</span>
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
                            <Input
                                placeholder="Search by name or URL…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8.5 pl-8 text-xs bg-bg-secondary/50 border-border"
                            />
                        </div>
                    </div>
                </DialogHeader>

                {/* Main Scrollable Image Grid */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border">
                                    <Skeleton className="h-full w-full" />
                                </div>
                            ))}
                        </div>
                    ) : filteredImages.length === 0 ? (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-xl">
                            <Database className="h-10 w-10 text-text-secondary mb-3 opacity-40" />
                            <h3 className="font-semibold text-sm text-text-primary">No Images Found</h3>
                            <p className="text-xs text-text-secondary mt-1 max-w-sm">
                                {search
                                    ? `No images matching "${search}". Try clearing your search term.`
                                    : "No images found in this filter category."}
                            </p>
                            {search && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearch("")}
                                    className="mt-3 text-xs"
                                >
                                    Clear search
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                            {filteredImages.map((img) => {
                                const isSelected = selectedSet.has(img.url);
                                return (
                                    <div
                                        key={img.id + img.url}
                                        onClick={() => handleToggleSelect(img.url)}
                                        onDoubleClick={() => {
                                            if (!multiSelect) {
                                                onSelect?.(img.url);
                                                onOpenChange(false);
                                            }
                                        }}
                                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-bg-secondary select-none ${
                                            isSelected
                                                ? "border-black dark:border-white ring-3 ring-black/20 dark:ring-white/20 shadow-md scale-[0.98]"
                                                : "border-border hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-sm"
                                        }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.fileName}
                                            loading="lazy"
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />

                                        {/* Selection Checkbox / Ring */}
                                        <div
                                            className={`absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                                                isSelected
                                                    ? "bg-black text-white shadow-md scale-100"
                                                    : "bg-black/40 text-transparent opacity-0 group-hover:opacity-100 group-hover:scale-95"
                                            }`}
                                        >
                                            <Check className={`h-3.5 w-3.5 ${isSelected ? "text-white" : ""}`} />
                                        </div>

                                        {/* Source Badge */}
                                        <div className="absolute top-2 left-2">
                                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-xs shadow-xs">
                                                {img.source === "storage"
                                                    ? "Storage"
                                                    : img.source === "product"
                                                    ? "Product"
                                                    : "Banner"}
                                            </span>
                                        </div>

                                        {/* Bottom Filename Overlay on Hover */}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                                            <span className="text-[10px] font-medium truncate max-w-[120px]" title={img.fileName}>
                                                {img.fileName}
                                            </span>
                                            <a
                                                href={img.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1 hover:text-neutral-300"
                                                title="Open original image"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer with selection summary and confirm button */}
                <DialogFooter className="p-3.5 sm:p-4 border-t border-border bg-bg-secondary/40 shrink-0 flex-row items-center justify-between gap-3">
                    <div className="text-xs text-text-secondary">
                        {selectedSet.size > 0 ? (
                            <span className="font-semibold text-text-primary">
                                {selectedSet.size} {selectedSet.size === 1 ? "image" : "images"} selected
                            </span>
                        ) : (
                            <span>No images selected</span>
                        )}
                        {selectedSet.size > 0 && multiSelect && (
                            <button
                                type="button"
                                onClick={() => setSelectedSet(new Set())}
                                className="ml-2 text-[11px] underline text-text-secondary hover:text-text-primary"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={selectedSet.size === 0}
                            onClick={handleConfirm}
                            className="text-xs font-bold gap-1.5 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                        >
                            <Check className="h-3.5 w-3.5" />
                            {multiSelect
                                ? `Add ${selectedSet.size || ""} Selected`
                                : "Select Image"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
