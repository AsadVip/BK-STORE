import { useRef, useState } from "react";
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { useAdminMedia, useDeleteMedia, useUploadMedia } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

function formatBytes(bytes: number | null): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminMediaPage() {
    const { data: media, isLoading } = useAdminMedia();
    const deleteMedia = useDeleteMedia();
    const uploadMedia = useUploadMedia();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [altText, setAltText] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filtered = (media ?? []).filter((m) =>
        (m.file_name ?? "").toLowerCase().includes(search.toLowerCase()),
    );

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
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Media Library</h1>
                    <p className="text-sm text-text-secondary">Centralized asset management via Supabase Storage.</p>
                </div>
                <Button className="gap-2" onClick={openDialog}>
                    <Upload className="h-4 w-4" />
                    Upload
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Input
                        placeholder="Search by file name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mb-4 max-w-sm"
                    />

                    {isLoading ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-square rounded-xl" />
                            ))}
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {filtered.map((m) => (
                                <div
                                    key={m.id}
                                    className="group relative overflow-hidden rounded-xl border border-border bg-bg-secondary"
                                >
                                    <div className="aspect-square overflow-hidden bg-bg-tertiary">
                                        {m.url ? (
                                            <img
                                                src={m.url}
                                                alt={m.alt_text ?? m.file_name ?? "media"}
                                                className="h-full w-full object-cover transition group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-text-secondary">
                                                <ImageIcon className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1 p-3">
                                        <p className="truncate text-sm font-medium">{m.file_name ?? "Untitled"}</p>
                                        <p className="text-xs text-text-secondary">{formatBytes(m.size_bytes)}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-2 h-8 w-8 bg-bg-primary/80 opacity-0 transition group-hover:opacity-100"
                                        onClick={async () => {
                                            await deleteMedia.mutateAsync({ id: m.id, storage_path: m.storage_path });
                                            toast({ title: "Media deleted", variant: "success" });
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-state-danger" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={ImageIcon}
                            title="No media found"
                            description="Upload images to populate your media library."
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
