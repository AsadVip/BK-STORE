import { useState } from "react";
import { Plus, Pencil, Trash2, Package, Star, ImagePlus, Layers, UploadCloud, Tag } from "lucide-react";
import { useAdminProducts, useDeleteProduct, useCreateProduct, useUpdateProduct, useImageUpload } from "@/features/admin/api";
import { useCategories } from "@/features/catalog/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "warning" | "danger"> = {
    draft: "secondary",
    published: "success",
    archived: "warning",
};

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

interface ImageItem {
    url: string;
    is_primary: boolean;
}

interface VariantItem {
    name: string;
    sku: string;
    price: string; // Selling / Discount Price
    compare_at_price: string; // Real / Original Price
    stock_quantity: string;
    image_url?: string;
}

export default function AdminProductsPage() {
    const { data: products, isLoading } = useAdminProducts();
    const { data: categories } = useCategories();
    const deleteProduct = useDeleteProduct();
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const uploadImage = useImageUpload();
    const { toast } = useToast();

    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("general");
    const [manualImageUrl, setManualImageUrl] = useState("");

    const [form, setForm] = useState({
        name: "",
        slug: "",
        category_id: "",
        description: "",
        base_price: "",
        compare_at_price: "",
        status: "published" as "draft" | "published" | "archived",
        is_new_arrival: false,
        is_best_seller: false,
        is_featured: false,
        is_men: true,
        is_women: false,
        images: [] as ImageItem[],
        variants: [] as VariantItem[],
    });

    const filtered = (products ?? []).filter((p) =>
        (p?.name || "").toLowerCase().includes(search.toLowerCase()) || (p?.slug || "").toLowerCase().includes(search.toLowerCase()),
    );

    const resetForm = () => {
        setEditingId(null);
        setActiveTab("general");
        setManualImageUrl("");
        setForm({
            name: "",
            slug: "",
            category_id: "",
            description: "",
            base_price: "",
            compare_at_price: "",
            status: "published",
            is_new_arrival: false,
            is_best_seller: false,
            is_featured: false,
            is_men: true,
            is_women: false,
            images: [],
            variants: [{ name: "Standard", sku: "", price: "", compare_at_price: "", stock_quantity: "50", image_url: "" }],
        });
    };

    const openDialog = () => {
        resetForm();
        setOpen(true);
    };

    const openEditDialog = (p: any) => {
        setEditingId(p.id);
        setActiveTab("general");
        setManualImageUrl("");

        const existingImages: ImageItem[] = (p.images && p.images.length > 0)
            ? p.images.map((img: any) => ({ url: img.url, is_primary: !!img.is_primary }))
            : [];

        const existingVariants: VariantItem[] = (p.variants && p.variants.length > 0)
            ? p.variants.map((v: any) => ({
                name: v.name || "Default",
                sku: v.sku || "",
                price: String(v.price ?? p.base_price ?? ""),
                compare_at_price: v.compare_at_price ? String(v.compare_at_price) : (p.compare_at_price ? String(p.compare_at_price) : ""),
                stock_quantity: String(v.stock_quantity ?? 50),
                image_url: v.image_url || v.option_values?.image_url || "",
            }))
            : [{ name: "Standard", sku: `${p.slug}-default`, price: String(p.base_price || ""), compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "", stock_quantity: String(p.stock_quantity ?? 50), image_url: "" }];

        setForm({
            name: p.name || "",
            slug: p.slug || "",
            category_id: p.categories?.[0]?.id || "",
            description: p.description || "",
            base_price: String(p.base_price || ""),
            compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "",
            status: p.status || "published",
            is_new_arrival: !!p.is_new_arrival,
            is_best_seller: !!p.is_best_seller,
            is_featured: !!p.is_featured,
            is_women: p.is_women === true || p.vendor_id === "women" || (typeof p.meta_description === "string" && p.meta_description.includes('"is_women":true')),
            is_men: (p.is_women === true || p.vendor_id === "women") ? (p.is_men === true) : true,
            images: existingImages,
            variants: existingVariants,
        });
        setOpen(true);
    };

    // Image handlers
    const handleAddImage = (url: string) => {
        if (!url.trim()) return;
        setForm((f) => {
            const isFirst = f.images.length === 0;
            return {
                ...f,
                images: [...f.images, { url: url.trim(), is_primary: isFirst }],
            };
        });
        setManualImageUrl("");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const url = await uploadImage.mutateAsync(file);
                handleAddImage(url);
            }
            toast({ title: "Images uploaded successfully!", variant: "success" });
        } catch (err) {
            toast({
                title: "Upload failed",
                description: err instanceof Error ? err.message : "Unknown upload error",
                variant: "destructive",
            });
        } finally {
            e.target.value = "";
        }
    };

    const handleSetPrimaryImage = (index: number) => {
        setForm((f) => ({
            ...f,
            images: f.images.map((img, i) => ({
                ...img,
                is_primary: i === index,
            })),
        }));
    };

    const handleRemoveImage = (index: number) => {
        setForm((f) => {
            const updated = f.images.filter((_, i) => i !== index);
            if (updated.length > 0 && !updated.some((img) => img.is_primary)) {
                updated[0].is_primary = true;
            }
            return { ...f, images: updated };
        });
    };

    // Variant handlers
    const handleAddVariant = () => {
        setForm((f) => ({
            ...f,
            variants: [
                ...f.variants,
                {
                    name: `Variant ${f.variants.length + 1}`,
                    sku: f.slug ? `${f.slug}-v${f.variants.length + 1}` : "",
                    price: f.base_price || "0",
                    compare_at_price: f.compare_at_price || "",
                    stock_quantity: "20",
                    image_url: "",
                },
            ],
        }));
    };

    const handleUpdateVariant = (index: number, field: keyof VariantItem, value: string) => {
        setForm((f) => {
            const next = [...f.variants];
            next[index] = { ...next[index], [field]: value };
            return { ...f, variants: next };
        });
    };

    const handleRemoveVariant = (index: number) => {
        setForm((f) => ({
            ...f,
            variants: f.variants.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.base_price.trim()) {
            toast({ title: "Name and discount price are required", variant: "destructive" });
            return;
        }
        const slug = form.slug.trim() || slugify(form.name);
        const parsedBasePrice = parseFloat(form.base_price);
        const parsedComparePrice = form.compare_at_price ? parseFloat(form.compare_at_price) : null;

        const preparedVariants = form.variants.map((v, i) => ({
            name: v.name.trim() || `Variant ${i + 1}`,
            sku: v.sku.trim() || `${slug}-v${i + 1}-${Date.now()}`,
            price: v.price ? parseFloat(v.price) : parsedBasePrice,
            compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : parsedComparePrice,
            stock_quantity: v.stock_quantity ? parseInt(v.stock_quantity, 10) : 0,
            image_url: v.image_url?.trim() || null,
        }));

        try {
            if (editingId) {
                await updateProduct.mutateAsync({
                    id: editingId,
                    name: form.name.trim(),
                    slug,
                    category_id: form.category_id || null,
                    description: form.description.trim() || null,
                    status: form.status,
                    base_price: parsedBasePrice,
                    compare_at_price: parsedComparePrice,
                    is_new_arrival: form.is_new_arrival,
                    is_best_seller: form.is_best_seller,
                    is_featured: form.is_featured,
                    is_men: form.is_men,
                    is_women: form.is_women,
                    images: form.images,
                    variants: preparedVariants,
                });
                toast({ title: "Product updated successfully!", variant: "success" });
            } else {
                await createProduct.mutateAsync({
                    name: form.name.trim(),
                    slug,
                    category_id: form.category_id || null,
                    description: form.description.trim() || null,
                    status: form.status,
                    base_price: parsedBasePrice,
                    compare_at_price: parsedComparePrice,
                    currency: "PKR",
                    is_new_arrival: form.is_new_arrival,
                    is_best_seller: form.is_best_seller,
                    is_featured: form.is_featured,
                    is_men: form.is_men,
                    is_women: form.is_women,
                    images: form.images,
                    variants: preparedVariants,
                });
                toast({ title: "Product created successfully!", variant: "success" });
            }
            setOpen(false);
            resetForm();
        } catch (err) {
            toast({
                title: editingId ? "Failed to update product" : "Failed to create product",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        }
    };

    // Calculate live main discount percentage for form display
    const realPriceNum = parseFloat(form.compare_at_price || "0");
    const discountPriceNum = parseFloat(form.base_price || "0");
    const liveDiscountPercent = (realPriceNum > discountPriceNum && realPriceNum > 0)
        ? Math.round(((realPriceNum - discountPriceNum) / realPriceNum) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Products</h1>
                    <p className="text-sm text-text-secondary">{products?.length ?? 0} total products in catalog</p>
                </div>
                <Button onClick={openDialog} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Product
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Input
                        placeholder="Search products by name or slug…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mb-4 max-w-sm"
                    />
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : filtered.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Pricing (Real vs Discount)</TableHead>
                                    <TableHead>Images</TableHead>
                                    <TableHead>Variants</TableHead>
                                    <TableHead>Total Stock</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((p) => {
                                    const primaryImg = p.images?.find((img) => img.is_primary)?.url || p.images?.[0]?.url;
                                    const variantCount = p.variants?.length || 0;
                                    const imageCount = p.images?.length || 0;
                                    const realPrice = p.compare_at_price;
                                    const discountPrice = p.base_price;
                                    const discountPct = (realPrice && realPrice > discountPrice)
                                        ? Math.round(((realPrice - discountPrice) / realPrice) * 100)
                                        : 0;

                                    return (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-bg-secondary flex items-center justify-center">
                                                        {primaryImg ? (
                                                            <img src={primaryImg} alt={p.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <Package className="h-5 w-5 text-text-secondary" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-text-primary">{p.name}</div>
                                                        <div className="text-xs text-text-secondary font-mono">{p.slug}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={STATUS_VARIANTS[p.status] ?? "secondary"}>
                                                    {p.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-text-primary">
                                                            {formatCurrency(discountPrice)}
                                                        </span>
                                                        {discountPct > 0 && (
                                                            <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 font-extrabold text-[10px] px-1.5 py-0 border border-red-500/20">
                                                                −{discountPct}%
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {realPrice && realPrice > discountPrice && (
                                                        <div className="text-xs text-text-secondary line-through">
                                                            Real: {formatCurrency(realPrice)}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="gap-1 font-normal">
                                                    <ImagePlus className="h-3 w-3" /> {imageCount} {imageCount === 1 ? "image" : "images"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="gap-1 font-normal">
                                                    <Layers className="h-3 w-3" /> {variantCount} {variantCount === 1 ? "variant" : "variants"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {p.stock_quantity} pcs
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => openEditDialog(p)}
                                                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                                                        aria-label="Edit product"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className="rounded-md p-1.5 text-muted-foreground hover:bg-state-danger/10 hover:text-state-danger transition-colors"
                                                        aria-label="Delete product"
                                                        onClick={async () => {
                                                            await deleteProduct.mutateAsync(p.id);
                                                            toast({ title: "Product deleted" });
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <EmptyState
                            icon={Package}
                            title="No products found"
                            description="Add your first product with real/discount pricing, variants & gallery images to get started."
                            action={
                                <Button onClick={openDialog} className="gap-2">
                                    <Plus className="h-4 w-4" /> Add Product
                                </Button>
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
                        <DialogDescription>
                            Set Real Price & Discount Price, upload multiple gallery images, and manage product variants.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="general">1. General & Pricing</TabsTrigger>
                                <TabsTrigger value="gallery">
                                    2. Gallery ({form.images.length})
                                </TabsTrigger>
                                <TabsTrigger value="variants">
                                    3. Variants ({form.variants.length})
                                </TabsTrigger>
                            </TabsList>

                            {/* TAB 1: GENERAL INFO & PRICING */}
                            <TabsContent value="general" className="space-y-4 pt-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="prod-name">Product Name *</Label>
                                        <Input
                                            id="prod-name"
                                            value={form.name}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    name: e.target.value,
                                                    slug: f.slug ? f.slug : slugify(e.target.value),
                                                }))
                                            }
                                            placeholder="e.g. Rolex Submariner Date"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="prod-slug">URL Slug</Label>
                                        <Input
                                            id="prod-slug"
                                            value={form.slug}
                                            onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                                            placeholder="auto-generated slug"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="prod-category">Category</Label>
                                        <Select
                                            value={form.category_id}
                                            onValueChange={(val) => setForm((f) => ({ ...f, category_id: val }))}
                                        >
                                            <SelectTrigger id="prod-category">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(categories ?? []).map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="prod-status">Status</Label>
                                        <Select
                                            value={form.status}
                                            onValueChange={(v) => setForm((f) => ({ ...f, status: v as typeof f.status }))}
                                        >
                                            <SelectTrigger id="prod-status">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="published">Published</SelectItem>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="prod-desc">Description</Label>
                                    <Textarea
                                        id="prod-desc"
                                        value={form.description}
                                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                        placeholder="Detailed product overview and key specifications..."
                                        rows={3}
                                    />
                                </div>

                                {/* PRICING SECTION (Real Price vs Discount Price) */}
                                <div className="rounded-xl border border-border/80 bg-bg-secondary/40 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-btn-primary" />
                                            <Label className="text-sm font-bold">Pricing Setup (PKR)</Label>
                                        </div>
                                        {liveDiscountPercent > 0 && (
                                            <Badge className="bg-red-500 text-white font-extrabold text-xs px-2.5 py-0.5">
                                                −{liveDiscountPercent}% DISCOUNT
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="prod-compare" className="text-xs font-semibold text-text-secondary">
                                                Real Price / Original Price (PKR)
                                            </Label>
                                            <Input
                                                id="prod-compare"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={form.compare_at_price}
                                                onChange={(e) => setForm((f) => ({ ...f, compare_at_price: e.target.value }))}
                                                placeholder="e.g. 20000 (Shown as line-through)"
                                                className="border-dashed"
                                            />
                                            <p className="text-[11px] text-text-secondary">Original non-discounted market price.</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="prod-price" className="text-xs font-bold text-text-primary">
                                                Discount Price / Selling Price (PKR) *
                                            </Label>
                                            <Input
                                                id="prod-price"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={form.base_price}
                                                onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))}
                                                placeholder="e.g. 15000 (Final customer price)"
                                                required
                                            />
                                            <p className="text-[11px] text-text-secondary">Actual price charged to buyer.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Homepage Placement */}
                                <div className="space-y-3 rounded-xl border border-border/80 bg-bg-secondary/40 p-4">
                                    <Label className="text-sm font-semibold">Store Placement Flags</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="flag-new-arrival"
                                                checked={form.is_new_arrival}
                                                onCheckedChange={(c) => setForm((f) => ({ ...f, is_new_arrival: c === true }))}
                                            />
                                            <Label htmlFor="flag-new-arrival" className="cursor-pointer text-xs">New Arrivals</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="flag-best-seller"
                                                checked={form.is_best_seller}
                                                onCheckedChange={(c) => setForm((f) => ({ ...f, is_best_seller: c === true }))}
                                            />
                                            <Label htmlFor="flag-best-seller" className="cursor-pointer text-xs">Best Sellers</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="flag-featured"
                                                checked={form.is_featured}
                                                onCheckedChange={(c) => setForm((f) => ({ ...f, is_featured: c === true }))}
                                            />
                                            <Label htmlFor="flag-featured" className="cursor-pointer text-xs">Featured</Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Target Gender & Category Collection (Men TOP, Women BELOW) */}
                                <div className="space-y-3 rounded-xl border border-border/80 bg-bg-secondary/40 p-4">
                                    <div>
                                        <Label className="text-sm font-bold text-text-primary">Target Audience / Gender Collection</Label>
                                        <p className="text-[11px] text-text-secondary">Select audience category for this product (Men's collection on top, Women's below):</p>
                                    </div>
                                    <div className="space-y-2.5 pt-1">
                                        {/* Men's (Top) */}
                                        <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-bg-primary p-3 shadow-2xs hover:border-btn-primary/50 transition-colors">
                                            <Checkbox
                                                id="target-men"
                                                checked={form.is_men}
                                                onCheckedChange={(c) => setForm((f) => ({ ...f, is_men: c === true, is_women: c === true ? false : f.is_women }))}
                                            />
                                            <Label htmlFor="target-men" className="cursor-pointer text-xs font-extrabold text-text-primary flex items-center gap-2">
                                                <span>Men's Collection / Men's Watch ⌚</span>
                                                <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">(TOP)</span>
                                            </Label>
                                        </div>

                                        {/* Women's (Niche / Below) */}
                                        <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-bg-primary p-3 shadow-2xs hover:border-btn-primary/50 transition-colors">
                                            <Checkbox
                                                id="target-women"
                                                checked={form.is_women}
                                                onCheckedChange={(c) => setForm((f) => ({ ...f, is_women: c === true, is_men: c === true ? false : f.is_men }))}
                                            />
                                            <Label htmlFor="target-women" className="cursor-pointer text-xs font-extrabold text-text-primary flex items-center gap-2">
                                                <span>Women's Collection / Women's Watch 💄</span>
                                                <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">(BELOW / NICHE)</span>
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 2: GALLERY IMAGES */}
                            <TabsContent value="gallery" className="space-y-4 pt-3">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-bg-secondary/50 p-4">
                                    <div>
                                        <h4 className="text-sm font-semibold">Upload Product Images</h4>
                                        <p className="text-xs text-text-secondary">Upload multiple photos. Click star to set primary image.</p>
                                    </div>
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            disabled={uploadImage.isPending}
                                        />
                                        <div className="inline-flex items-center gap-2 rounded-lg bg-btn-primary px-3.5 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition-opacity">
                                            <UploadCloud className="h-4 w-4" />
                                            {uploadImage.isPending ? "Uploading…" : "Upload Image Files"}
                                        </div>
                                    </label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Or paste image URL (e.g. https://...)"
                                        value={manualImageUrl}
                                        onChange={(e) => setManualImageUrl(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddImage(manualImageUrl)}
                                        disabled={!manualImageUrl.trim()}
                                    >
                                        Add URL
                                    </Button>
                                </div>

                                {/* Images Grid */}
                                {form.images.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                                        {form.images.map((img, idx) => (
                                            <div
                                                key={idx}
                                                className={`relative group aspect-square rounded-xl overflow-hidden border-2 bg-bg-secondary shadow-sm ${
                                                    img.is_primary ? "border-btn-primary ring-2 ring-btn-primary/30" : "border-border"
                                                }`}
                                            >
                                                <img src={img.url} alt="" className="h-full w-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetPrimaryImage(idx)}
                                                        className={`p-1.5 rounded-full ${
                                                            img.is_primary ? "bg-amber-500 text-white" : "bg-white/80 text-gray-800 hover:bg-white"
                                                        }`}
                                                        title="Set as Primary Image"
                                                    >
                                                        <Star className="h-4 w-4 fill-current" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(idx)}
                                                        className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700"
                                                        title="Remove Image"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                {img.is_primary && (
                                                    <div className="absolute top-1.5 left-1.5 bg-btn-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                                                        Primary
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center rounded-xl border border-border/60 bg-bg-secondary/30">
                                        <ImagePlus className="h-8 w-8 mx-auto text-text-secondary mb-2" />
                                        <p className="text-xs text-text-secondary">No gallery images added yet. Upload files above.</p>
                                    </div>
                                )}
                            </TabsContent>

                            {/* TAB 3: VARIANTS & STOCK */}
                            <TabsContent value="variants" className="space-y-4 pt-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold">Product Variants & Pricing</h4>
                                        <p className="text-xs text-text-secondary">Manage sizes/colors with individual Real Price, Discount Price & Stock.</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddVariant}
                                        className="gap-1.5 text-xs"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add Variant Row
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {form.variants.map((variant, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-xl border border-border p-3.5 bg-bg-secondary/30 space-y-3"
                                        >
                                            <div className="grid grid-cols-12 gap-2 items-center">
                                                <div className="col-span-3 space-y-1">
                                                    <Label className="text-[11px] text-text-secondary">Variant Name</Label>
                                                    <Input
                                                        placeholder="e.g. Small / Red"
                                                        value={variant.name}
                                                        onChange={(e) => handleUpdateVariant(idx, "name", e.target.value)}
                                                        className="h-8 text-xs font-medium"
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-[11px] text-text-secondary">SKU</Label>
                                                    <Input
                                                        placeholder="SKU-101"
                                                        value={variant.sku}
                                                        onChange={(e) => handleUpdateVariant(idx, "sku", e.target.value)}
                                                        className="h-8 text-xs font-mono"
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-[11px] text-text-secondary">Real Price</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder={form.compare_at_price || "Real Price"}
                                                        value={variant.compare_at_price}
                                                        onChange={(e) => handleUpdateVariant(idx, "compare_at_price", e.target.value)}
                                                        className="h-8 text-xs border-dashed text-text-secondary"
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-[11px] font-bold text-text-primary">Discount Price *</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder={form.base_price || "0"}
                                                        value={variant.price}
                                                        onChange={(e) => handleUpdateVariant(idx, "price", e.target.value)}
                                                        className="h-8 text-xs font-bold"
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-[11px] text-text-secondary">Stock</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="20"
                                                        value={variant.stock_quantity}
                                                        onChange={(e) => handleUpdateVariant(idx, "stock_quantity", e.target.value)}
                                                        className="h-8 text-xs font-bold"
                                                    />
                                                </div>
                                                <div className="col-span-1 flex items-end justify-center pt-4">
                                                    {form.variants.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveVariant(idx)}
                                                            className="text-text-secondary hover:text-red-500 p-1"
                                                            title="Delete Variant"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Variant Image Selector Row */}
                                            <div className="flex items-center gap-3 pt-1 border-t border-border/40">
                                                <div className="h-9 w-9 shrink-0 rounded-lg border border-border bg-bg-secondary flex items-center justify-center overflow-hidden">
                                                    {variant.image_url ? (
                                                        <img src={variant.image_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <ImagePlus className="h-4 w-4 text-text-secondary" />
                                                    )}
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                                                    {form.images.length > 0 && (
                                                        <Select
                                                            value={variant.image_url || ""}
                                                            onValueChange={(val) => handleUpdateVariant(idx, "image_url", val)}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <SelectValue placeholder="Select gallery image for variant" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none_selected">None / Default</SelectItem>
                                                                {form.images.map((img, i) => (
                                                                    <SelectItem key={i} value={img.url}>
                                                                        Image #{i + 1} {img.is_primary ? "(Primary)" : ""}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                    <Input
                                                        placeholder="Or paste direct Variant Image URL…"
                                                        value={variant.image_url || ""}
                                                        onChange={(e) => handleUpdateVariant(idx, "image_url", e.target.value === "none_selected" ? "" : e.target.value)}
                                                        className="h-8 text-xs font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="pt-4 border-t border-border">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                                {editingId
                                    ? updateProduct.isPending ? "Updating…" : "Update Product"
                                    : createProduct.isPending ? "Creating…" : "Create Product"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
