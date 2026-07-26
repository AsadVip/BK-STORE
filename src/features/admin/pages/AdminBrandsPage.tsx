import { useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useAdminBrands, useDeleteBrand, useCreateBrand } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function AdminBrandsPage() {
    const { data: brands, isLoading } = useAdminBrands();
    const deleteBrand = useDeleteBrand();
    const createBrand = useCreateBrand();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: "",
        logo_url: "",
        website_url: "",
        is_featured: false,
    });

    const filtered = (brands ?? []).filter(
        (b) =>
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.slug.includes(search.toLowerCase()),
    );

    const resetForm = () =>
        setForm({ name: "", slug: "", description: "", logo_url: "", website_url: "", is_featured: false });

    const openDialog = () => {
        resetForm();
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
            await createBrand.mutateAsync({
                name: form.name.trim(),
                slug,
                description: form.description.trim() || null,
                logo_url: form.logo_url.trim() || null,
                website_url: form.website_url.trim() || null,
                is_featured: form.is_featured,
                deleted_at: null,
            });
            toast({ title: "Brand created" });
            setOpen(false);
            resetForm();
        } catch (err) {
            toast({
                title: "Failed to create brand",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Brands</h1>
                    <p className="text-sm text-text-secondary">{brands?.length ?? 0} brands</p>
                </div>
                <Button onClick={openDialog}>
                    <Plus className="h-4 w-4" /> Add Brand
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Input
                        placeholder="Search brands…"
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
                                    <TableHead>Website</TableHead>
                                    <TableHead>Featured</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell className="font-medium">{b.name}</TableCell>
                                        <TableCell className="text-text-secondary">{b.slug}</TableCell>
                                        <TableCell className="text-text-secondary">
                                            {b.website_url ? (
                                                <a
                                                    href={b.website_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-btn-primary hover:underline"
                                                >
                                                    Visit
                                                </a>
                                            ) : (
                                                "—"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={b.is_featured ? "success" : "secondary"}>
                                                {b.is_featured ? "Featured" : "Standard"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-text-secondary">
                                            {formatDate(b.created_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                                                    aria-label="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-state-danger/10 hover:text-state-danger"
                                                    aria-label="Delete"
                                                    onClick={async () => {
                                                        await deleteBrand.mutateAsync(b.id);
                                                        toast({ title: "Brand deleted", variant: "success" });
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
                            icon={Tag}
                            title="No brands yet"
                            description="Add your first brand to get started."
                            action={
                                <Button onClick={openDialog}>
                                    <Plus className="h-4 w-4" /> Add Brand
                                </Button>
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Brand</DialogTitle>
                        <DialogDescription>Create a new brand.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="brand-name">Name</Label>
                            <Input
                                id="brand-name"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        name: e.target.value,
                                        slug: f.slug ? f.slug : slugify(e.target.value),
                                    }))
                                }
                                placeholder="e.g. Acme"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand-slug">Slug</Label>
                            <Input
                                id="brand-slug"
                                value={form.slug}
                                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                                placeholder="auto-generated from name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand-desc">Description</Label>
                            <Textarea
                                id="brand-desc"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="Optional brand description"
                                rows={3}
                            />
                        </div>
                        <ImageUpload
                            value={form.logo_url}
                            onChange={(url) => setForm((f) => ({ ...f, logo_url: url }))}
                            label="Brand Logo"
                            aspectClassName="aspect-square"
                        />
                        <div className="space-y-2">
                            <Label htmlFor="brand-website">Website URL</Label>
                            <Input
                                id="brand-website"
                                value={form.website_url}
                                onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
                                placeholder="https://…"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="brand-featured"
                                checked={form.is_featured}
                                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_featured: checked }))}
                            />
                            <Label htmlFor="brand-featured">Featured brand</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createBrand.isPending}>
                                {createBrand.isPending ? "Creating…" : "Create Brand"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
