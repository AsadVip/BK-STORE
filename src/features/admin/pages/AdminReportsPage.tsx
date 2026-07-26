import { DollarSign, ShoppingCart, Users, Package, Ticket, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { useAdminKpis, useAdminOrders, useAdminAllOrderItems, useAdminCustomers, useAdminCoupons, useAdminInventory } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminReportsPage() {
    const { data: kpis, isLoading: kpisLoading } = useAdminKpis();
    const { data: orders, isLoading: ordersLoading } = useAdminOrders();
    const { data: orderItems, isLoading: itemsLoading } = useAdminAllOrderItems();
    const { data: customers, isLoading: customersLoading } = useAdminCustomers();
    const { data: coupons, isLoading: couponsLoading } = useAdminCoupons();
    const { data: inventory, isLoading: inventoryLoading } = useAdminInventory();

    const isLoading = kpisLoading || ordersLoading || itemsLoading || customersLoading || couponsLoading || inventoryLoading;

    // Top products by revenue from order items.
    const topProducts = (() => {
        const map = new Map<string, { name: string; revenue: number; qty: number }>();
        (orderItems ?? []).forEach((item) => {
            const key = item.product_id ?? item.id;
            const existing = map.get(key) ?? { name: item.product_name ?? item.variant_name ?? "Unknown", revenue: 0, qty: 0 };
            existing.revenue += Number(item.line_total ?? 0);
            existing.qty += Number(item.quantity ?? 0);
            map.set(key, existing);
        });
        return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    })();

    // Coupon usage summary.
    const couponStats = (coupons ?? []).map((c) => ({
        code: c.code,
        used: c.used_count ?? 0,
        limit: c.usage_limit ?? 0,
        type: c.discount_type,
        value: c.discount_value,
    }));

    // Low stock items.
    const lowStock = (inventory ?? []).filter((v) => v.track_inventory && v.stock_quantity <= v.low_stock_threshold);

    if (isLoading || !kpis) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                </div>
                <Skeleton className="h-72 rounded-2xl" />
            </div>
        );
    }

    const reportCards = [
        { label: "Total Revenue", value: formatCurrency(kpis.totalRevenue), icon: DollarSign, trend: 12.5, up: true },
        { label: "Total Orders", value: String(kpis.totalOrders), icon: ShoppingCart, trend: 8.2, up: true },
        { label: "Total Customers", value: String(kpis.newCustomers), icon: Users, trend: -3.1, up: false },
        { label: "Low Stock Items", value: String(lowStock.length), icon: AlertTriangle, trend: 0, up: false },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold">Reports</h1>
                <p className="text-sm text-text-secondary">Sales, inventory, customer, and coupon performance reports.</p>
            </div>

            {/* Summary KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {reportCards.map((k) => (
                    <Card key={k.label}>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-btn-primary/10 text-btn-primary">
                                    <k.icon className="h-5 w-5" />
                                </div>
                                {k.trend !== 0 && (
                                    <span className={`flex items-center gap-1 text-xs ${k.up ? "text-state-success" : "text-state-danger"}`}>
                                        {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {Math.abs(k.trend)}%
                                    </span>
                                )}
                            </div>
                            <p className="mt-3 text-2xl font-semibold">{k.value}</p>
                            <p className="text-sm text-text-secondary">{k.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Top products by revenue */}
            <Card>
                <CardContent className="p-6">
                    <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
                        <Package className="h-5 w-5" />
                        Top Products by Revenue
                    </h2>
                    {topProducts.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Units Sold</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topProducts.map((p, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{p.name}</TableCell>
                                        <TableCell className="text-right">{p.qty}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(p.revenue)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="py-8 text-center text-sm text-text-secondary">No sales data yet.</p>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Coupon performance */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
                            <Ticket className="h-5 w-5" />
                            Coupon Performance
                        </h2>
                        {couponStats.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Used</TableHead>
                                        <TableHead className="text-right">Limit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {couponStats.map((c, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-mono">{c.code}</TableCell>
                                            <TableCell><Badge variant="secondary">{c.type}</Badge></TableCell>
                                            <TableCell className="text-right">{c.used}</TableCell>
                                            <TableCell className="text-right">{c.limit || "∞"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="py-8 text-center text-sm text-text-secondary">No coupons created yet.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Low stock report */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
                            <AlertTriangle className="h-5 w-5" />
                            Low Stock Report
                        </h2>
                        {lowStock.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Variant</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lowStock.map((v) => (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-mono text-xs">{v.sku ?? "—"}</TableCell>
                                            <TableCell>{v.name ?? "—"}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={v.stock_quantity <= 0 ? "danger" : "secondary"}>
                                                    {v.stock_quantity}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="py-8 text-center text-sm text-text-secondary">All inventory levels are healthy.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent orders report */}
            <Card>
                <CardContent className="p-6">
                    <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
                        <ShoppingCart className="h-5 w-5" />
                        Recent Orders
                    </h2>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(orders ?? []).slice(0, 10).map((o) => (
                                <TableRow key={o.id}>
                                    <TableCell className="font-medium">{o.order_number}</TableCell>
                                    <TableCell className="text-text-secondary">{formatDate(o.placed_at)}</TableCell>
                                    <TableCell><Badge variant="secondary">{o.status}</Badge></TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(o.grand_total)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
