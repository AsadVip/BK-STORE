import { useState } from "react";
import { Plus, Trash2, Receipt } from "lucide-react";
import { useAdminTaxRules, useDeleteTaxRule, useToggleTaxRule, useCreateTaxRule } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface TaxForm {
    name: string;
    country: string;
    state: string;
    rate: string;
    inclusive: boolean;
    is_active: boolean;
}

const EMPTY_FORM: TaxForm = {
    name: "",
    country: "",
    state: "",
    rate: "",
    inclusive: false,
    is_active: true,
};

export default function AdminTaxPage() {
    const { data: rules, isLoading } = useAdminTaxRules();
    const deleteRule = useDeleteTaxRule();
    const toggleRule = useToggleTaxRule();
    const createRule = useCreateTaxRule();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<TaxForm>(EMPTY_FORM);

    const filtered = (rules ?? []).filter(
        (r) =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.country.toLowerCase().includes(search.toLowerCase()),
    );

    const resetForm = () => setForm(EMPTY_FORM);

    const openDialog = () => {
        resetForm();
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.country.trim() || !form.rate) {
            toast({ title: "Name, country and rate are required", variant: "destructive" });
            return;
        }
        const rateValue = parseFloat(form.rate);
        if (Number.isNaN(rateValue)) {
            toast({ title: "Rate must be a number", variant: "destructive" });
            return;
        }
        try {
            await createRule.mutateAsync({
                name: form.name.trim(),
                country: form.country.trim(),
                state: form.state.trim() || null,
                rate: rateValue / 100,
                inclusive: form.inclusive,
                is_active: form.is_active,
            });
            toast({ title: "Tax rule created", variant: "success" });
            setOpen(false);
            resetForm();
        } catch (err) {
            toast({ title: "Failed to create tax rule", description: (err as Error).message, variant: "destructive" });
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Tax Settings</h1>
                    <p className="text-sm text-text-secondary">{rules?.length ?? 0} tax rules</p>
                </div>
                <Button onClick={openDialog}>
                    <Plus className="h-4 w-4" /> Add Rule
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Input
                        placeholder="Search by name or country…"
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
                                    <TableHead>Country</TableHead>
                                    <TableHead>State</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Inclusive</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="font-medium">{r.name}</TableCell>
                                        <TableCell>{r.country}</TableCell>
                                        <TableCell className="text-text-secondary">{r.state ?? "—"}</TableCell>
                                        <TableCell>{(r.rate * 100).toFixed(2)}%</TableCell>
                                        <TableCell>
                                            <Badge variant={r.inclusive ? "success" : "secondary"}>
                                                {r.inclusive ? "Inclusive" : "Exclusive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={r.is_active}
                                                onCheckedChange={async (checked) => {
                                                    await toggleRule.mutateAsync({ id: r.id, is_active: checked });
                                                    toast({
                                                        title: checked ? "Rule enabled" : "Rule disabled",
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
                                                    await deleteRule.mutateAsync(r.id);
                                                    toast({ title: "Tax rule deleted", variant: "success" });
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
                            icon={Receipt}
                            title="No tax rules yet"
                            description="Configure tax rules by country and region."
                            action={
                                <Button onClick={openDialog}>
                                    <Plus className="h-4 w-4" /> Add Rule
                                </Button>
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Tax Rule</DialogTitle>
                        <DialogDescription>Configure a tax rule for a country or region.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tax-name">Name</Label>
                            <Input
                                id="tax-name"
                                placeholder="e.g. Pakistan Standard VAT"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax-country">Country</Label>
                            <Input
                                id="tax-country"
                                placeholder="e.g. Pakistan"
                                value={form.country}
                                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax-state">State / Province (optional)</Label>
                            <Input
                                id="tax-state"
                                placeholder="e.g. Punjab"
                                value={form.state}
                                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax-rate">Rate (%)</Label>
                            <Input
                                id="tax-rate"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="e.g. 5 for 5%"
                                value={form.rate}
                                onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="tax-inclusive"
                                checked={form.inclusive}
                                onCheckedChange={(checked) => setForm((f) => ({ ...f, inclusive: checked }))}
                            />
                            <Label htmlFor="tax-inclusive">Inclusive (tax included in price)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="tax-active"
                                checked={form.is_active}
                                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
                            />
                            <Label htmlFor="tax-active">Active</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createRule.isPending}>
                                {createRule.isPending ? "Creating…" : "Create Rule"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
