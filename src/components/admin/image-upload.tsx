import { useRef, useState } from "react";
import { ImagePlus, Loader2, X, Database } from "lucide-react";
import { useImageUpload } from "@/features/admin/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MediaLibraryDialog } from "@/components/admin/media-library-dialog";

interface ImageUploadProps {
    /** Current image URL value (controlled). */
    value: string;
    /** Called when a file is uploaded and a public URL is obtained. */
    onChange: (url: string) => void;
    /** Optional label for the upload area. */
    label?: string;
    /** Aspect ratio hint for the preview box. Defaults to "aspect-video". */
    aspectClassName?: string;
}

/**
 * Reusable image upload field.
 * - User can select a file from their local machine OR select from already uploaded images in Supabase database.
 * - Shows a live preview, replace/upload button, select from DB button, and remove button.
 */
export function ImageUpload({ value, onChange, label, aspectClassName = "aspect-video" }: ImageUploadProps) {
    const uploadImage = useImageUpload();
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);

    const displayUrl = value || localPreview;

    const handleFile = async (file: File) => {
        if (localPreview) URL.revokeObjectURL(localPreview);
        const preview = URL.createObjectURL(file);
        setLocalPreview(preview);
        try {
            const url = await uploadImage.mutateAsync(file);
            onChange(url);
            toast({ title: "Image uploaded", variant: "success" });
        } catch (err) {
            toast({
                title: "Upload failed",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        } finally {
            if (localPreview) {
                URL.revokeObjectURL(localPreview);
                setLocalPreview(null);
            }
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleRemove = () => {
        if (localPreview) {
            URL.revokeObjectURL(localPreview);
            setLocalPreview(null);
        }
        onChange("");
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium leading-none text-text-primary">{label}</label>
            )}
            <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                <div
                    className={`relative ${aspectClassName} w-full max-w-[240px] shrink-0 overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-2xs`}
                >
                    {displayUrl ? (
                        <>
                            <img
                                src={displayUrl}
                                alt="Preview"
                                className="h-full w-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white hover:bg-black transition-colors"
                                aria-label="Remove image"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </>
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-text-secondary">
                            <ImagePlus className="h-6 w-6" />
                            <span className="text-[11px]">No image</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                        id="image-upload-input"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2 text-xs"
                            disabled={uploadImage.isPending}
                            onClick={() => inputRef.current?.click()}
                        >
                            {uploadImage.isPending ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Uploading…
                                </>
                            ) : (
                                <>
                                    <ImagePlus className="h-3.5 w-3.5" />
                                    {value ? "Replace" : "Upload File"}
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="gap-2 text-xs border border-border bg-bg-secondary hover:bg-neutral-200/80 dark:hover:bg-neutral-800"
                            onClick={() => setPickerOpen(true)}
                        >
                            <Database className="h-3.5 w-3.5 text-text-primary" />
                            Select from Database
                        </Button>
                    </div>

                    {value && (
                        <p className="max-w-[240px] truncate text-[11px] text-text-secondary font-mono" title={value}>
                            {value}
                        </p>
                    )}
                </div>
            </div>

            {/* Supabase Media Library Dialog */}
            <MediaLibraryDialog
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onSelect={(url) => onChange(url)}
                selectedUrls={value ? [value] : []}
                title="Select Image from Database"
            />
        </div>
    );
}
