import { useEffect, useState } from "react";
import { Plus, Trash2, Percent, Flame, Clock, Save, Sparkles } from "lucide-react";
import {
    useAdminCampaigns,
    useDeleteCampaign,
    useToggleCampaignActive,
    useCreateCampaign,
    useFlashSaleSetting,
    useUpdateFlashSale,
    type FlashSaleConfig,
} from "@/features/admin/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

function toLocalDatetimeString(dateInput: string | Date | number): string {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => (n < 10 ? "0" + n : String(n));
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function AdminCampaignsPage() {
    const { data: campaigns, isLoading } = useAdminCampaigns();
    const deleteCampaign = useDeleteCampaign();
    const toggleActive = useToggleCampaignActive();
    const createCampaign = useCreateCampaign();
    const { data: flashSaleConfig } = useFlashSaleSetting();
    const updateFlashSale = useUpdateFlashSale();

    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);

    // Flash sale form state
    const [saleForm, setSaleForm] = useState<FlashSaleConfig>({
        is_active: true,
        sale_title: "MEGA FLASH SALE",
        discount_percentage: 40,
        badge_text: "Upto 40% OFF",
        ends_at: "",
    });

    useEffect(() => {
        if (flashSaleConfig) {
            const dateStr = flashSaleConfig.ends_at
                ? toLocalDatetimeString(flashSaleConfig.ends_at)
                : "";
            setSaleForm({ ...flashSaleConfig, ends_at: dateStr });
        }
    }, [flashSaleConfig]);

    const handleSaveFlashSale = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const endsAtIso = saleForm.ends_at
                ? new Date(saleForm.ends_at).toISOString()
                : new Date(Date.now() + 3 * 86400000).toISOString();

            await updateFlashSale.mutateAsync({
                ...saleForm,
                ends_at: endsAtIso,
            });
            toast({
                title: "Flash Sale updated successfully!",
                description: saleForm.is_active ? "Storewide sale & countdown banner are now LIVE." : "Flash Sale is paused.",
                variant: "success",
            });
        } catch (err) {
            toast({
                title: "Failed to update Flash Sale",
                description: err instanceof Error ? err.message : "Error saving configuration",
                variant: "destructive",
            });
        }
    };

    const [form, setForm] = useState({
        name: "",
        description: "",
        discount_type: "percentage" as "percentage" | "fixed",
        discount_value: "",
        starts_at: "",
        ends_at: "",
        is_active: true,
    });

    const filtered = (campaigns ?? []).filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
    );

    const resetForm = () =>
        setForm({
            name: "",
            description: "",
            discount_type: "percentage",
            discount_value: "",
            starts_at: "",
            ends_at: "",
            is_active: true,
        });

    const openDialog = () => {
        resetForm();
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.discount_value.trim() || !form.starts_at || !form.ends_at) {
            toast({
                title: "Name, discount value, start and end dates are required",
                variant: "destructive",
            });
            return;
        }
        try {
            await createCampaign.mutateAsync({
                name: form.name.trim(),
                description: form.description.trim() || null,
                discount_type: form.discount_type,
                discount_value: parseFloat(form.discount_value),
                starts_at: new Date(form.starts_at).toISOString(),
                ends_at: new Date(form.ends_at).toISOString(),
                is_active: form.is_active,
            });
            toast({ title: "Campaign created" });
            setOpen(false);
            resetForm();
        } catch (err) {
            toast({
                title: "Failed to create campaign",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-8">
            {/* Live Storewide Flash Sale Controller */}
            <Card className="border-2 border-red-500/30 bg-gradient-to-br from-red-950/10 via-bg-secondary to-bg-secondary shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-md">
                                <Flame className="h-5 w-5 animate-pulse" />
                            </div>
                            <div>
                                <CardTitle className="font-serif text-xl flex items-center gap-2">
                                    Storewide Flash Sale Controller
                                    {saleForm.is_active ? (
                                        <Badge className="bg-red-600 text-white hover:bg-red-700">LIVE NOW</Badge>
                                    ) : (
                                        <Badge variant="secondary">PAUSED</Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    Control the top red announcement banner, live countdown timer, and storewide discount percentage.
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="flash-sale-switch" className="text-sm font-bold">Sale Active</Label>
                            <Switch
                                id="flash-sale-switch"
                                checked={saleForm.is_active}
                                onCheckedChange={(val) => setSaleForm((s) => ({ ...s, is_active: val }))}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveFlashSale} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <Label htmlFor="sale_title">Sale Title</Label>
                            <Input
                                id="sale_title"
                                value={saleForm.sale_title}
                                onChange={(e) => setSaleForm((s) => ({ ...s, sale_title: e.target.value }))}
                                placeholder="MEGA FLASH SALE"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="discount_percentage">Storewide Discount (%)</Label>
                            <Input
                                id="discount_percentage"
                                type="number"
                                min="1"
                                max="99"
                                value={saleForm.discount_percentage}
                                onChange={(e) => setSaleForm((s) => ({ ...s, discount_percentage: Number(e.target.value) }))}
                                placeholder="40"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="badge_text">Badge Label Text</Label>
                            <Input
                                id="badge_text"
                                value={saleForm.badge_text}
                                onChange={(e) => setSaleForm((s) => ({ ...s, badge_text: e.target.value }))}
                                placeholder="Upto 40% OFF"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="ends_at">Countdown End Date & Time</Label>
                            <Input
                                id="ends_at"
                                type="datetime-local"
                                value={saleForm.ends_at}
                                onChange={(e) => setSaleForm((s) => ({ ...s, ends_at: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                        <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                            <Button type="submit" disabled={updateFlashSale.isPending} className="bg-red-600 text-white hover:bg-red-700 font-bold px-6 shadow-md">
                                <Save className="h-4 w-4 mr-2" />
                                {updateFlashSale.isPending ? "Updating Flash Sale…" : "Save & Launch Flash Sale"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Discount Campaigns</h1>
                    <p className="text-sm text-text-secondary">{campaigns?.length ?? 0} campaigns</p>
                </div>
                <Button onClick={openDialog}>
                    <Plus className="h-4 w-4" /> Add Campaign
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Input
                        placeholder="Search campaigns…"
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
                                    <TableHead>Type</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Starts</TableHead>
                                    <TableHead>Ends</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">{c.name}</TableCell>
                                        <TableCell className="text-text-secondary">{c.discount_type}</TableCell>
                                        <TableCell>
                                            {c.discount_type === "percentage"
                                                ? `${c.discount_value}%`
                                                : formatCurrency(c.discount_value)}
                                        </TableCell>
                                        <TableCell className="text-text-secondary">
                                            {formatDate(c.starts_at)}
                                        </TableCell>
                                        <TableCell className="text-text-secondary">
                                            {formatDate(c.ends_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={c.is_active}
                                                onCheckedChange={async (checked) => {
                                                    await toggleActive.mutateAsync({
                                                        id: c.id,
                                                        is_active: checked,
                                                    });
                                                    toast({
                                                        title: checked ? "Campaign activated" : "Campaign paused",
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
                                                    await deleteCampaign.mutateAsync(c.id);
                                                    toast({ title: "Campaign deleted", variant: "success" });
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
                            icon={Percent}
                            title="No campaigns yet"
                            description="Schedule a sale or category-wide discount campaign."
                            action={
                                <Button onClick={openDialog}>
                                    <Plus className="h-4 w-4" /> Add Campaign
                                </Button>
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Campaign</DialogTitle>
                        <DialogDescription>Create a new discount campaign.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="camp-name">Name</Label>
                            <Input
                                id="camp-name"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. Black Friday Sale"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="camp-desc">Description</Label>
                            <Textarea
                                id="camp-desc"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="Optional description"
                                rows={2}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="camp-type">Discount Type</Label>
                                <Select
                                    value={form.discount_type}
                                    onValueChange={(v) => setForm((f) => ({ ...f, discount_type: v as typeof f.discount_type }))}
                                >
                                    <SelectTrigger id="camp-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="camp-value">
                                    Discount Value {form.discount_type === "percentage" ? "(%)" : "(PKR)"}
                                </Label>
                                <Input
                                    id="camp-value"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.discount_value}
                                    onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                                    placeholder="0"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="camp-start">Starts At</Label>
                                <Input
                                    id="camp-start"
                                    type="datetime-local"
                                    value={form.starts_at}
                                    onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="camp-end">Ends At</Label>
                                <Input
                                    id="camp-end"
                                    type="datetime-local"
                                    value={form.ends_at}
                                    onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="camp-active"
                                checked={form.is_active}
                                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
                            />
                            <Label htmlFor="camp-active">Active</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createCampaign.isPending}>
                                {createCampaign.isPending ? "Creating…" : "Create Campaign"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
