import { useState } from "react";
import { Plus, Trash2, Ticket } from "lucide-react";
import { useAdminCoupons, useCreateCoupon } from "@/features/admin/api";
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
import { supabase } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminCouponsPage() {
    const { data: coupons, isLoading } = useAdminCoupons();
    const createCoupon = useCreateCoupon();
    const { toast } = useToast();
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        code: "",
        description: "",
        discount_type: "percentage" as "percentage" | "fixed",
        discount_value: "",
        scope: "cart" as "cart" | "product" | "category",
        min_order_value: "0",
        max_discount_amount: "",
        usage_limit: "",
        usage_limit_per_customer: "1",
        starts_at: "",
        expires_at: "",
        is_active: true,
    });

    const filtered = (coupons ?? []).filter((c) =>
        c.code.toLowerCase().includes(search.toLowerCase()),
    );

    const resetForm = () =>
        setForm({
            code: "",
            description: "",
            discount_type: "percentage",
            discount_value: "",
            scope: "cart",
            min_order_value: "0",
            max_discount_amount: "",
            usage_limit: "",
            usage_limit_per_customer: "1",
            starts_at: "",
            expires_at: "",
            is_active: true,
        });

    const openDialog = () => {
        resetForm();
        setOpen(true);
    };

    const removeCoupon = async (id: string) => {
        await supabase.from("coupons").delete().eq("id", id);
        qc.invalidateQueries({ queryKey: ["admin-coupons"] });
        toast({ title: "Coupon deleted", variant: "success" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code.trim() || !form.discount_value.trim()) {
            toast({ title: "Code and discount value are required", variant: "destructive" });
            return;
        }
        try {
            await createCoupon.mutateAsync({
                code: form.code.trim().toUpperCase(),
                description: form.description.trim() || null,
                discount_type: form.discount_type,
                discount_value: parseFloat(form.discount_value),
                scope: form.scope,
                target_ids: [],
                min_order_value: parseFloat(form.min_order_value) || 0,
                max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
                usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
                usage_limit_per_customer: parseInt(form.usage_limit_per_customer, 10) || 1,
                starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
                expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
                is_active: form.is_active,
            });
            toast({ title: "Coupon created" });
            setOpen(false);
            resetForm();
        } catch (err) {
            toast({
                title: "Failed to create coupon",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Coupons</h1>
                    <p className="text-sm text-text-secondary">{coupons?.length ?? 0} coupons</p>
                </div>
                <Button onClick={openDialog}>
                    <Plus className="h-4 w-4" /> Add Coupon
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Input
                        placeholder="Search coupons…"
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
                                    <TableHead>Code</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Scope</TableHead>
                                    <TableHead>Usage</TableHead>
                                    <TableHead>Validity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-mono font-medium">{c.code}</TableCell>
                                        <TableCell className="text-text-secondary">{c.discount_type}</TableCell>
                                        <TableCell>
                                            {c.discount_type === "percentage"
                                                ? `${c.discount_value}%`
                                                : formatCurrency(c.discount_value)}
                                        </TableCell>
                                        <TableCell className="text-text-secondary">{c.scope}</TableCell>
                                        <TableCell className="text-text-secondary">
                                            {c.used_count}
                                            {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                                        </TableCell>
                                        <TableCell className="text-xs text-text-secondary">
                                            {c.starts_at ? formatDate(c.starts_at) : "—"} →{" "}
                                            {c.expires_at ? formatDate(c.expires_at) : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={c.is_active ? "success" : "secondary"}>
                                                {c.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <button
                                                className="rounded-md p-1.5 text-muted-foreground hover:bg-state-danger/10 hover:text-state-danger"
                                                aria-label="Delete"
                                                onClick={() => removeCoupon(c.id)}
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
                            icon={Ticket}
                            title="No coupons yet"
                            description="Create discount coupons to drive sales."
                            action={
                                <Button onClick={openDialog}>
                                    <Plus className="h-4 w-4" /> Add Coupon
                                </Button>
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Coupon</DialogTitle>
                        <DialogDescription>Create a new discount coupon.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="coupon-code">Code</Label>
                            <Input
                                id="coupon-code"
                                value={form.code}
                                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                                placeholder="e.g. SUMMER20"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="coupon-desc">Description</Label>
                            <Textarea
                                id="coupon-desc"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="Optional description"
                                rows={2}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="coupon-type">Discount Type</Label>
                                <Select
                                    value={form.discount_type}
                                    onValueChange={(v) => setForm((f) => ({ ...f, discount_type: v as typeof f.discount_type }))}
                                >
                                    <SelectTrigger id="coupon-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="coupon-value">
                                    Discount Value {form.discount_type === "percentage" ? "(%)" : "(PKR)"}
                                </Label>
                                <Input
                                    id="coupon-value"
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
                        <div className="space-y-2">
                            <Label htmlFor="coupon-scope">Scope</Label>
                            <Select
                                value={form.scope}
                                onValueChange={(v) => setForm((f) => ({ ...f, scope: v as typeof f.scope }))}
                            >
                                <SelectTrigger id="coupon-scope">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cart">Cart</SelectItem>
                                    <SelectItem value="product">Product</SelectItem>
                                    <SelectItem value="category">Category</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="coupon-min">Min Order (PKR)</Label>
                                <Input
                                    id="coupon-min"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.min_order_value}
                                    onChange={(e) => setForm((f) => ({ ...f, min_order_value: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="coupon-max">Max Discount (PKR)</Label>
                                <Input
                                    id="coupon-max"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.max_discount_amount}
                                    onChange={(e) => setForm((f) => ({ ...f, max_discount_amount: e.target.value }))}
                                    placeholder="optional"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="coupon-limit">Usage Limit</Label>
                                <Input
                                    id="coupon-limit"
                                    type="number"
                                    min="0"
                                    value={form.usage_limit}
                                    onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                                    placeholder="unlimited"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="coupon-per">Per Customer</Label>
                                <Input
                                    id="coupon-per"
                                    type="number"
                                    min="1"
                                    value={form.usage_limit_per_customer}
                                    onChange={(e) => setForm((f) => ({ ...f, usage_limit_per_customer: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="coupon-start">Starts At</Label>
                                <Input
                                    id="coupon-start"
                                    type="datetime-local"
                                    value={form.starts_at}
                                    onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="coupon-expires">Expires At</Label>
                                <Input
                                    id="coupon-expires"
                                    type="datetime-local"
                                    value={form.expires_at}
                                    onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="coupon-active"
                                checked={form.is_active}
                                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
                            />
                            <Label htmlFor="coupon-active">Active</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createCoupon.isPending}>
                                {createCoupon.isPending ? "Creating…" : "Create Coupon"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
