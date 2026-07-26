import { useState } from "react";
import { Globe, Plus, Trash2 } from "lucide-react";
import { useAdminSeo, useDeleteSeo, useCreateSeo } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/admin/image-upload";
import { formatDate } from "@/lib/utils";

const ENTITY_TYPES = [
    { value: "page", label: "Page" },
    { value: "product", label: "Product" },
    { value: "category", label: "Category" },
    { value: "brand", label: "Brand" },
    { value: "collection", label: "Collection" },
];

interface SeoForm {
    entity_type: string;
    entity_id: string;
    path: string;
    meta_title: string;
    meta_description: string;
    og_title: string;
    og_description: string;
    og_image_url: string;
    canonical_url: string;
    robots_index: boolean;
}

const EMPTY_FORM: SeoForm = {
    entity_type: "page",
    entity_id: "",
    path: "",
    meta_title: "",
    meta_description: "",
    og_title: "",
    og_description: "",
    og_image_url: "",
    canonical_url: "",
    robots_index: true,
};

export default function AdminSeoPage() {
    const { data: seo, isLoading } = useAdminSeo();
    const deleteSeo = useDeleteSeo();
    const createSeo = useCreateSeo();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<SeoForm>(EMPTY_FORM);

    const filtered = (seo ?? []).filter((s) =>
        (s.path ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (s.entity_type ?? "").toLowerCase().includes(search.toLowerCase()),
    );

    const resetForm = () => setForm(EMPTY_FORM);

    const openDialog = () => {
        resetForm();
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.entity_type.trim()) {
            toast({ title: "Entity type is required", variant: "destructive" });
            return;
        }
        try {
            await createSeo.mutateAsync({
                entity_type: form.entity_type.trim(),
                entity_id: form.entity_id.trim() || null,
                path: form.path.trim() || null,
                meta_title: form.meta_title.trim() || null,
                meta_description: form.meta_description.trim() || null,
                og_title: form.og_title.trim() || null,
                og_description: form.og_description.trim() || null,
                og_image_url: form.og_image_url.trim() || null,
                canonical_url: form.canonical_url.trim() || null,
                robots_index: form.robots_index,
                structured_data: null,
            });
            toast({ title: "SEO entry created", variant: "success" });
            setOpen(false);
            resetForm();
        } catch (err) {
            toast({ title: "Failed to create SEO entry", description: (err as Error).message, variant: "destructive" });
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">SEO Management</h1>
                    <p className="text-sm text-text-secondary">Manage meta tags, sitemaps, and redirects.</p>
                </div>
                <Button onClick={openDialog}>
                    <Plus className="h-4 w-4" /> Add SEO Entry
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Input
                        placeholder="Search by path or entity type…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mb-4 max-w-sm"
                    />

                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : filtered.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Entity</TableHead>
                                    <TableHead>Path</TableHead>
                                    <TableHead>Meta Title</TableHead>
                                    <TableHead>Canonical</TableHead>
                                    <TableHead>Index</TableHead>
                                    <TableHead>Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell>
                                            <Badge variant="secondary">{s.entity_type}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{s.path ?? "—"}</TableCell>
                                        <TableCell className="max-w-xs truncate">{s.meta_title ?? "—"}</TableCell>
                                        <TableCell className="max-w-xs truncate text-xs text-text-secondary">
                                            {s.canonical_url ?? "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={s.robots_index ? "success" : "secondary"}>
                                                {s.robots_index ? "Index" : "No-index"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-text-secondary">{formatDate(s.updated_at)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={async () => {
                                                    await deleteSeo.mutateAsync(s.id);
                                                    toast({ title: "SEO entry deleted", variant: "success" });
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-state-danger" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <EmptyState
                            icon={Globe}
                            title="No SEO entries"
                            description="Add SEO metadata for pages, products, or categories."
                            action={
                                <Button onClick={openDialog}>
                                    <Plus className="h-4 w-4" /> Add SEO Entry
                                </Button>
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add SEO Entry</DialogTitle>
                        <DialogDescription>Configure meta tags and indexing for a page or entity.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="seo-entity-type">Entity Type</Label>
                            <select
                                id="seo-entity-type"
                                className="flex h-10 w-full rounded-md border border-input bg-bg-primary px-3 py-2 text-sm"
                                value={form.entity_type}
                                onChange={(e) => setForm((f) => ({ ...f, entity_type: e.target.value }))}
                                required
                            >
                                {ENTITY_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="seo-entity-id">Entity ID (optional)</Label>
                            <Input
                                id="seo-entity-id"
                                placeholder="e.g. product UUID"
                                value={form.entity_id}
                                onChange={(e) => setForm((f) => ({ ...f, entity_id: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="seo-path">Path (optional)</Label>
                            <Input
                                id="seo-path"
                                placeholder="e.g. /shop or /product/slug"
                                value={form.path}
                                onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="seo-meta-title">Meta Title</Label>
                            <Input
                                id="seo-meta-title"
                                placeholder="Browser tab / search result title"
                                value={form.meta_title}
                                onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="seo-meta-desc">Meta Description</Label>
                            <Textarea
                                id="seo-meta-desc"
                                placeholder="Short description for search engines"
                                value={form.meta_description}
                                onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="seo-og-title">OG Title (optional)</Label>
                            <Input
                                id="seo-og-title"
                                placeholder="Social share title"
                                value={form.og_title}
                                onChange={(e) => setForm((f) => ({ ...f, og_title: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="seo-og-desc">OG Description (optional)</Label>
                            <Textarea
                                id="seo-og-desc"
                                placeholder="Social share description"
                                value={form.og_description}
                                onChange={(e) => setForm((f) => ({ ...f, og_description: e.target.value }))}
                            />
                        </div>
                        <ImageUpload
                            value={form.og_image_url}
                            onChange={(url) => setForm((f) => ({ ...f, og_image_url: url }))}
                            label="OG Image (optional)"
                            aspectClassName="aspect-[1200/630]"
                        />
                        <div className="space-y-2">
                            <Label htmlFor="seo-canonical">Canonical URL (optional)</Label>
                            <Input
                                id="seo-canonical"
                                placeholder="https://…"
                                value={form.canonical_url}
                                onChange={(e) => setForm((f) => ({ ...f, canonical_url: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="seo-robots"
                                checked={form.robots_index}
                                onCheckedChange={(checked) => setForm((f) => ({ ...f, robots_index: checked }))}
                            />
                            <Label htmlFor="seo-robots">Allow search engines to index</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createSeo.isPending}>
                                {createSeo.isPending ? "Creating…" : "Create Entry"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
