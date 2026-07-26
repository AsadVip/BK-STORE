import { useState } from "react";
import { Plus, Trash2, Truck } from "lucide-react";
import { useAdminShippingMethods, useDeleteShippingMethod, useToggleShippingMethod, useCreateShippingMethod } from "@/features/admin/api";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";

const SHIPPING_TYPES = [
    { value: "flat_rate", label: "Flat Rate" },
    { value: "free", label: "Free" },
    { value: "free_threshold", label: "Free Threshold" },
    { value: "zone_based", label: "Zone Based" },
] as const;

export default function AdminShippingPage() {
    const { data: methods, isLoading } = useAdminShippingMethods();
    const deleteMethod = useDeleteShippingMethod();
    const toggleMethod = useToggleShippingMethod();
    const createMethod = useCreateShippingMethod();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
        type: "flat_rate" as (typeof SHIPPING_TYPES)[number]["value"],
        rate: "0",
        free_threshold: "",
        estimated_days_min: "",
        estimated_days_max: "",
        is_active: true,
        sort_order: "0",
    });

    const filtered = (methods ?? []).filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()),
    );

    const resetForm = () =>
        setForm({
            name: "",
            description: "",
            type: "flat_rate",
            rate: "0",
            free_threshold: "",
            estimated_days_min: "",
            estimated_days_max: "",
            is_active: true,
            sort_order: "0",
        });

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
        try {
            await createMethod.mutateAsync({
                name: form.name.trim(),
                description: form.description.trim() || null,
                type: form.type,
                rate: parseFloat(form.rate) || 0,
                free_threshold: form.free_threshold ? parseFloat(form.free_threshold) : null,
                zones: [],
                estimated_days_min: form.estimated_days_min ? parseInt(form.estimated_days_min, 10) : null,
                estimated_days_max: form.estimated_days_max ? parseInt(form.estimated_days_max, 10) : null,
                is_active: form.is_active,
                sort_order: parseInt(form.sort_order, 10) || 0,
            });
            toast({ title: "Shipping method created" });
            setOpen(false);
            resetForm();
        } catch (err) {
            toast({
                title: "Failed to create shipping method",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Shipping Methods</h1>
                    <p className="text-sm text-text-secondary">{methods?.length ?? 0} methods</p>
                </div>
                <Button onClick={openDialog}>
                    <Plus className="h-4 w-4" /> Add Method
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Input
                        placeholder="Search shipping methods…"
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
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Free Threshold</TableHead>
                                    <TableHead>Est. Days</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell className="font-medium">{m.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{m.type}</Badge>
                                        </TableCell>
                                        <TableCell>{formatCurrency(m.rate)}</TableCell>
                                        <TableCell className="text-text-secondary">
                                            {m.free_threshold ? formatCurrency(m.free_threshold) : "—"}
                                        </TableCell>
                                        <TableCell className="text-text-secondary">
                                            {m.estimated_days_min && m.estimated_days_max
                                                ? `${m.estimated_days_min}–${m.estimated_days_max} days`
                                                : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={m.is_active}
                                                onCheckedChange={async (checked) => {
                                                    await toggleMethod.mutateAsync({ id: m.id, is_active: checked });
                                                    toast({
                                                        title: checked ? "Method enabled" : "Method disabled",
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
                                                    await deleteMethod.mutateAsync(m.id);
                                                    toast({ title: "Shipping method deleted", variant: "success" });
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
                            icon={Truck}
                            title="No shipping methods yet"
                            description="Configure flat rate, free threshold, or zone-based shipping."
                            action={
                                <Button onClick={openDialog}>
                                    <Plus className="h-4 w-4" /> Add Method
                                </Button>
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Shipping Method</DialogTitle>
                        <DialogDescription>Create a new shipping method.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ship-name">Name</Label>
                            <Input
                                id="ship-name"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. Standard Delivery"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ship-desc">Description</Label>
                            <Textarea
                                id="ship-desc"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="Optional description"
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ship-type">Type</Label>
                            <Select
                                value={form.type}
                                onValueChange={(v) => setForm((f) => ({ ...f, type: v as typeof f.type }))}
                            >
                                <SelectTrigger id="ship-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SHIPPING_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ship-rate">Rate (PKR)</Label>
                                <Input
                                    id="ship-rate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.rate}
                                    onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ship-threshold">Free Threshold (PKR)</Label>
                                <Input
                                    id="ship-threshold"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.free_threshold}
                                    onChange={(e) => setForm((f) => ({ ...f, free_threshold: e.target.value }))}
                                    placeholder="optional"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ship-min">Est. Min Days</Label>
                                <Input
                                    id="ship-min"
                                    type="number"
                                    min="0"
                                    value={form.estimated_days_min}
                                    onChange={(e) => setForm((f) => ({ ...f, estimated_days_min: e.target.value }))}
                                    placeholder="optional"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ship-max">Est. Max Days</Label>
                                <Input
                                    id="ship-max"
                                    type="number"
                                    min="0"
                                    value={form.estimated_days_max}
                                    onChange={(e) => setForm((f) => ({ ...f, estimated_days_max: e.target.value }))}
                                    placeholder="optional"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ship-order">Sort Order</Label>
                                <Input
                                    id="ship-order"
                                    type="number"
                                    min="0"
                                    value={form.sort_order}
                                    onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-end space-x-2 pb-2">
                                <Switch
                                    id="ship-active"
                                    checked={form.is_active}
                                    onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
                                />
                                <Label htmlFor="ship-active">Active</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMethod.isPending}>
                                {createMethod.isPending ? "Creating…" : "Create Method"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
