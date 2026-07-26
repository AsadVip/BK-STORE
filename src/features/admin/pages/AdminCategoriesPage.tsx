import { useState } from "react";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { useAdminCategories, useDeleteCategory, useCreateCategory, useUpdateCategory } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/admin/image-upload";
import { formatDate } from "@/lib/utils";

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export default function AdminCategoriesPage() {
    const { data: categories, isLoading } = useAdminCategories();
    const deleteCategory = useDeleteCategory();
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: "",
        image_url: "",
        sort_order: "0",
        is_visible: true,
    });

    const filtered = (categories ?? []).filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.slug.includes(search.toLowerCase()),
    );

    const resetForm = () => {
        setEditingId(null);
        setForm({ name: "", slug: "", description: "", image_url: "", sort_order: "0", is_visible: true });
    };

    const openDialog = () => {
        resetForm();
        setOpen(true);
    };

    const openEditDialog = (c: any) => {
        setEditingId(c.id);
        setForm({
            name: c.name || "",
            slug: c.slug || "",
            description: c.description || "",
            image_url: c.image_url || "",
            sort_order: String(c.sort_order ?? 0),
            is_visible: c.is_visible !== false,
        });
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast({ title: "Name is required", variant: "destructive" });
            return;
        }
        const slug = form.slug.trim() || slugify(form.name);
        try {
            if (editingId) {
                await updateCategory.mutateAsync({
                    id: editingId,
                    name: form.name.trim(),
                    slug,
                    description: form.description.trim() || null,
                    image_url: form.image_url.trim() || null,
                    sort_order: parseInt(form.sort_order, 10) || 0,
                    is_visible: form.is_visible,
                });
                toast({ title: "Category updated successfully!", variant: "success" });
            } else {
                await createCategory.mutateAsync({
                    name: form.name.trim(),
                    slug,
                    description: form.description.trim() || null,
                    image_url: form.image_url.trim() || null,
                    sort_order: parseInt(form.sort_order, 10) || 0,
                    is_visible: form.is_visible,
                    parent_id: null,
                    deleted_at: null,
                });
                toast({ title: "Category created successfully!", variant: "success" });
            }
            setOpen(false);
            resetForm();
        } catch (err) {
            toast({
                title: editingId ? "Failed to update category" : "Failed to create category",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Categories</h1>
                    <p className="text-sm text-text-secondary">{categories?.length ?? 0} categories</p>
                </div>
                <Button onClick={openDialog}>
                    <Plus className="h-4 w-4" /> Add Category
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Input
                        placeholder="Search categories…"
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
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Visible</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">{c.name}</TableCell>
                                        <TableCell className="text-text-secondary">{c.slug}</TableCell>
                                        <TableCell className="text-text-secondary">{c.sort_order}</TableCell>
                                        <TableCell>
                                            <Badge variant={c.is_visible ? "success" : "secondary"}>
                                                {c.is_visible ? "Visible" : "Hidden"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-text-secondary">
                                            {formatDate(c.created_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditDialog(c)}
                                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-text-primary transition-colors"
                                                    aria-label="Edit Category"
                                                    title="Edit Category"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-state-danger/10 hover:text-state-danger transition-colors"
                                                    aria-label="Delete Category"
                                                    title="Delete Category"
                                                    onClick={async () => {
                                                        await deleteCategory.mutateAsync(c.id);
                                                        toast({ title: "Category deleted", variant: "success" });
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <EmptyState
                            icon={FolderTree}
                            title="No categories yet"
                            description="Create your first category to organize products."
                            action={
                                <Button onClick={openDialog}>
                                    <Plus className="h-4 w-4" /> Add Category
                                </Button>
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Category" : "Add Category"}</DialogTitle>
                        <DialogDescription>
                            {editingId ? "Modify category details and preferences." : "Create a new product category."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">Name</Label>
                            <Input
                                id="cat-name"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        name: e.target.value,
                                        slug: f.slug && editingId ? f.slug : slugify(e.target.value),
                                    }))
                                }
                                placeholder="e.g. Electronics"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cat-slug">Slug</Label>
                            <Input
                                id="cat-slug"
                                value={form.slug}
                                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                                placeholder="auto-generated from name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cat-desc">Description</Label>
                            <Textarea
                                id="cat-desc"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="Optional category description"
                                rows={3}
                            />
                        </div>
                        <ImageUpload
                            value={form.image_url}
                            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                            label="Category Image"
                            aspectClassName="aspect-square"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cat-order">Sort Order</Label>
                                <Input
                                    id="cat-order"
                                    type="number"
                                    min="0"
                                    value={form.sort_order}
                                    onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-end space-x-2 pb-2">
                                <Switch
                                    id="cat-visible"
                                    checked={form.is_visible}
                                    onCheckedChange={(checked) => setForm((f) => ({ ...f, is_visible: checked }))}
                                />
                                <Label htmlFor="cat-visible">Visible</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                                {editingId
                                    ? updateCategory.isPending ? "Updating…" : "Update Category"
                                    : createCategory.isPending ? "Creating…" : "Create Category"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
