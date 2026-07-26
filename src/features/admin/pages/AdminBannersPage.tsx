import { useState } from "react";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import {
    useAdminBanners,
    useDeleteBanner,
    useToggleBannerPublished,
    useCreateBanner,
} from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/admin/image-upload";
import { formatDate } from "@/lib/utils";

const PLACEMENTS = [
    { value: "home_hero", label: "Home Hero" },
    { value: "home_secondary", label: "Home Secondary" },
    { value: "shop_top", label: "Shop Top" },
    { value: "site_wide", label: "Site Wide" },
    { value: "footer", label: "Footer" },
] as const;

export default function AdminBannersPage() {
    const { data: banners, isLoading } = useAdminBanners();
    const deleteBanner = useDeleteBanner();
    const togglePublished = useToggleBannerPublished();
    const createBanner = useCreateBanner();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        title: "",
        image_url: "",
        link_url: "",
        placement: "home_hero" as (typeof PLACEMENTS)[number]["value"],
        text_overlay: "",
        cta_label: "",
        start_at: "",
        end_at: "",
        is_published: true,
        sort_order: "0",
    });

    const filtered = (banners ?? []).filter((b) =>
        b.title.toLowerCase().includes(search.toLowerCase()),
    );

    const resetForm = () =>
        setForm({
            title: "",
            image_url: "",
            link_url: "",
            placement: "home_hero",
            text_overlay: "",
            cta_label: "",
            start_at: "",
            end_at: "",
            is_published: true,
            sort_order: "0",
        });

    const openDialog = () => {
        resetForm();
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.image_url.trim()) {
            toast({ title: "Title and image URL are required", variant: "destructive" });
            return;
        }
        try {
            await createBanner.mutateAsync({
                title: form.title.trim(),
                image_url: form.image_url.trim(),
                link_url: form.link_url.trim() || null,
                placement: form.placement,
                text_overlay: form.text_overlay.trim() || null,
                cta_label: form.cta_label.trim() || null,
                start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
                end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
                is_published: form.is_published,
                sort_order: parseInt(form.sort_order, 10) || 0,
            });
            toast({ title: "Banner created" });
            setOpen(false);
            resetForm();
        } catch (err) {
            toast({
                title: "Failed to create banner",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Banners</h1>
                    <p className="text-sm text-text-secondary">{banners?.length ?? 0} banners</p>
                </div>
                <Button onClick={openDialog}>
                    <Plus className="h-4 w-4" /> Add Banner
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Input
                        placeholder="Search banners…"
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
                                    <TableHead>Image</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Placement</TableHead>
                                    <TableHead>Schedule</TableHead>
                                    <TableHead>Published</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell>
                                            <img
                                                src={b.image_url}
                                                alt={b.title}
                                                className="h-10 w-16 rounded-md border border-border object-cover"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{b.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{b.placement}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-text-secondary">
                                            {b.start_at || b.end_at
                                                ? `${b.start_at ? formatDate(b.start_at) : "Now"} → ${b.end_at ? formatDate(b.end_at) : "—"}`
                                                : "Always"}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={b.is_published}
                                                onCheckedChange={async (checked) => {
                                                    await togglePublished.mutateAsync({
                                                        id: b.id,
                                                        is_published: checked,
                                                    });
                                                    toast({
                                                        title: checked ? "Banner published" : "Banner hidden",
                                                        variant: "success",
                                                    });
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <button
                                                className="rounded-md p-1.5 text-muted-foreground hover:bg-state-danger/10 hover:text-state-danger"
                                                aria-label="Delete"
                                                onClick={async () => {
                                                    await deleteBanner.mutateAsync(b.id);
                                                    toast({ title: "Banner deleted", variant: "success" });
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <EmptyState
                            icon={ImageIcon}
                            title="No banners yet"
                            description="Add a promotional banner to highlight on your storefront."
                            action={
                                <Button onClick={openDialog}>
                                    <Plus className="h-4 w-4" /> Add Banner
                                </Button>
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Banner</DialogTitle>
                        <DialogDescription>Create a new promotional banner.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="banner-title">Title</Label>
                            <Input
                                id="banner-title"
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                placeholder="e.g. Summer Sale"
                                required
                            />
                        </div>
                        <ImageUpload
                            value={form.image_url}
                            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                            label="Banner Image"
                            aspectClassName="aspect-[16/9]"
                        />
                        <div className="space-y-2">
                            <Label htmlFor="banner-link">Link URL</Label>
                            <Input
                                id="banner-link"
                                value={form.link_url}
                                onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                                placeholder="https://…"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="banner-placement">Placement</Label>
                            <Select
                                value={form.placement}
                                onValueChange={(v) => setForm((f) => ({ ...f, placement: v as typeof f.placement }))}
                            >
                                <SelectTrigger id="banner-placement">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PLACEMENTS.map((p) => (
                                        <SelectItem key={p.value} value={p.value}>
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="banner-cta">CTA Label</Label>
                                <Input
                                    id="banner-cta"
                                    value={form.cta_label}
                                    onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))}
                                    placeholder="Shop Now"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="banner-order">Sort Order</Label>
                                <Input
                                    id="banner-order"
                                    type="number"
                                    min="0"
                                    value={form.sort_order}
                                    onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="banner-overlay">Text Overlay</Label>
                            <Input
                                id="banner-overlay"
                                value={form.text_overlay}
                                onChange={(e) => setForm((f) => ({ ...f, text_overlay: e.target.value }))}
                                placeholder="Optional overlay text"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="banner-start">Start At</Label>
                                <Input
                                    id="banner-start"
                                    type="datetime-local"
                                    value={form.start_at}
                                    onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="banner-end">End At</Label>
                                <Input
                                    id="banner-end"
                                    type="datetime-local"
                                    value={form.end_at}
                                    onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="banner-published"
                                checked={form.is_published}
                                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_published: checked }))}
                            />
                            <Label htmlFor="banner-published">Published</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createBanner.isPending}>
                                {createBanner.isPending ? "Creating…" : "Create Banner"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
