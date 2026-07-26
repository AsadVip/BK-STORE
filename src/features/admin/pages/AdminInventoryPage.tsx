import { useState } from "react";
import { Boxes, Save } from "lucide-react";
import { useAdminInventory, useUpdateVariantStock } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function AdminInventoryPage() {
    const { data: variants, isLoading } = useAdminInventory();
    const updateStock = useUpdateVariantStock();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [drafts, setDrafts] = useState<Record<string, string>>({});

    const filtered = (variants ?? []).filter(
        (v) => v.sku.toLowerCase().includes(search.toLowerCase()) || (v.name ?? "").toLowerCase().includes(search.toLowerCase()),
    );

    const lowStockCount = (variants ?? []).filter(
        (v) => v.track_inventory && v.stock_quantity <= v.low_stock_threshold,
    ).length;

    const saveStock = async (id: string) => {
        const value = drafts[id];
        if (value === undefined) return;
        const qty = Number(value);
        if (Number.isNaN(qty)) return;
        await updateStock.mutateAsync({ id, stock_quantity: qty });
        setDrafts((d) => {
            const next = { ...d };
            delete next[id];
            return next;
        });
        toast({ title: "Stock updated", variant: "success" });
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Inventory</h1>
                    <p className="text-sm text-text-secondary">
                        {variants?.length ?? 0} variants · {lowStockCount} low stock
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Input
                        placeholder="Search by SKU or name…"
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
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Variant</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Update</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((v) => {
                                    const isLow = v.track_inventory && v.stock_quantity <= v.low_stock_threshold;
                                    return (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-mono font-medium">{v.sku}</TableCell>
                                            <TableCell className="text-text-secondary">{v.name ?? "—"}</TableCell>
                                            <TableCell>{formatCurrency(v.price)}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    defaultValue={v.stock_quantity}
                                                    className="h-9 w-24"
                                                    onChange={(e) =>
                                                        setDrafts((d) => ({ ...d, [v.id]: e.target.value }))
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {v.track_inventory ? (
                                                    <Badge variant={isLow ? "danger" : "success"}>
                                                        {isLow ? "Low stock" : "In stock"}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">Not tracked</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    disabled={drafts[v.id] === undefined}
                                                    onClick={() => saveStock(v.id)}
                                                >
                                                    <Save className="h-4 w-4" /> Save
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <EmptyState
                            icon={Boxes}
                            title="No inventory yet"
                            description="Product variants with stock levels will appear here."
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
