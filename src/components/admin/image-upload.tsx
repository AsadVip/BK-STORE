import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useImageUpload } from "@/features/admin/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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
 * - User selects a file from their local machine.
 * - The file is uploaded to the Supabase `media` storage bucket.
 * - The resulting public URL is passed to `onChange`.
 * - Shows a live preview and a remove button.
 */
export function ImageUpload({ value, onChange, label, aspectClassName = "aspect-video" }: ImageUploadProps) {
    const uploadImage = useImageUpload();
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const [localPreview, setLocalPreview] = useState<string | null>(null);

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
            <div className="flex items-start gap-3">
                <div
                    className={`relative ${aspectClassName} w-full max-w-[240px] overflow-hidden rounded-lg border border-border bg-bg-secondary`}
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
                                className="absolute right-1.5 top-1.5 rounded-full bg-bg-primary/80 p-1 text-state-danger hover:bg-bg-primary"
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
                <div className="flex flex-col gap-2">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                        id="image-upload-input"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={uploadImage.isPending}
                        onClick={() => inputRef.current?.click()}
                    >
                        {uploadImage.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading…
                            </>
                        ) : (
                            <>
                                <ImagePlus className="h-4 w-4" />
                                {value ? "Replace" : "Upload Image"}
                            </>
                        )}
                    </Button>
                    {value && (
                        <p className="max-w-[200px] truncate text-[11px] text-text-secondary" title={value}>
                            {value}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
