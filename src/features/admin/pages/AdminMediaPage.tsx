import { useRef, useState } from "react";
import { Image as ImageIcon, Trash2, Upload, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import { useSupabaseImages, useDeleteMedia, useUploadMedia } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

function formatBytes(bytes?: number | null): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminMediaPage() {
    const { data: media, isLoading, refetch, isRefetching } = useSupabaseImages();
    const deleteMedia = useDeleteMedia();
    const uploadMedia = useUploadMedia();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [altText, setAltText] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filtered = (media ?? []).filter((m) => {
        const matchesSearch =
            !search.trim() ||
            (m.fileName ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (m.url ?? "").toLowerCase().includes(search.toLowerCase());
        const matchesSource = sourceFilter === "all" || m.source === sourceFilter;
        return matchesSearch && matchesSource;
    });

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        toast({ title: "Image URL copied to clipboard", variant: "success" });
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const resetForm = () => {
        setAltText("");
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const openDialog = () => {
        resetForm();
        setOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setSelectedFile(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast({ title: "Please select a file to upload", variant: "destructive" });
            return;
        }
        try {
            await uploadMedia.mutateAsync({ file: selectedFile, alt_text: altText.trim() || undefined });
            toast({ title: "Media uploaded", variant: "success" });
            setOpen(false);
            resetForm();
        } catch (err) {
            toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
        }
    };

    return (
        <div>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-2xl font-semibold flex items-center gap-2">
                        Media Library
                        {media && (
                            <Badge variant="secondary" className="font-mono text-xs">
                                {media.length} Total Assets
                            </Badge>
                        )}
                    </h1>
                    <p className="text-sm text-text-secondary">Centralized asset management across Supabase Storage and database tables.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isRefetching || isLoading}
                        className="gap-1.5 text-xs h-9"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button className="gap-2 h-9 text-xs" onClick={openDialog}>
                        <Upload className="h-4 w-4" />
                        Upload
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                            {[
                                { key: "all", label: "All Assets" },
                                { key: "storage", label: "Storage Uploads" },
                                { key: "product", label: "Products" },
                                { key: "banner", label: "Banners" },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setSourceFilter(tab.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                        sourceFilter === tab.key
                                            ? "bg-btn-primary text-white shadow-xs"
                                            : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-neutral-200/60 dark:hover:bg-neutral-800"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <Input
                            placeholder="Search by file name or URL…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-xs h-9 text-xs"
                        />
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-square rounded-xl" />
                            ))}
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {filtered.map((m) => (
                                <div
                                    key={m.id + m.url}
                                    className="group relative overflow-hidden rounded-xl border border-border bg-bg-secondary hover:shadow-md transition-shadow"
                                >
                                    <div className="aspect-square overflow-hidden bg-bg-tertiary relative">
                                        {m.url ? (
                                            <img
                                                src={m.url}
                                                alt={m.fileName ?? "media"}
                                                className="h-full w-full object-cover transition group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-text-secondary">
                                                <ImageIcon className="h-8 w-8" />
                                            </div>
                                        )}

                                        {/* Source Badge */}
                                        <div className="absolute top-2 left-2">
                                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-xs shadow-xs">
                                                {m.source}
                                            </span>
                                        </div>

                                        {/* Quick Actions Overlay */}
                                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-7 w-7 rounded-lg bg-bg-primary/90 text-text-primary hover:bg-bg-primary shadow-xs"
                                                onClick={() => handleCopy(m.url)}
                                                title="Copy public URL"
                                            >
                                                {copiedUrl === m.url ? (
                                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                            <a
                                                href={m.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-7 w-7 rounded-lg bg-bg-primary/90 text-text-primary hover:bg-bg-primary shadow-xs flex items-center justify-center"
                                                title="View original"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="space-y-1 p-3">
                                        <p className="truncate text-xs font-semibold text-text-primary" title={m.fileName}>
                                            {m.fileName ?? "Untitled"}
                                        </p>
                                        <div className="flex items-center justify-between text-[11px] text-text-secondary">
                                            <span>{formatBytes(m.sizeBytes)}</span>
                                            {m.createdAt && (
                                                <span className="text-[10px] font-mono">
                                                    {new Date(m.createdAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={ImageIcon}
                            title="No media found"
                            description={search ? `No images matching "${search}".` : "Upload images to populate your media library."}
                            action={
                                <Button className="gap-2" onClick={openDialog}>
                                    <Upload className="h-4 w-4" />
                                    Upload
                                </Button>
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Media</DialogTitle>
                        <DialogDescription>Select an image file to upload to the media library.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="media-file">Image File</Label>
                            <Input
                                id="media-file"
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                required
                            />
                        </div>
                        {previewUrl && (
                            <div className="overflow-hidden rounded-lg border border-border bg-bg-secondary">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="mx-auto max-h-48 w-auto object-contain"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="media-alt">Alt Text (optional)</Label>
                            <Input
                                id="media-alt"
                                placeholder="Descriptive text for accessibility"
                                value={altText}
                                onChange={(e) => setAltText(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={uploadMedia.isPending || !selectedFile}>
                                {uploadMedia.isPending ? "Uploading…" : "Upload"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
