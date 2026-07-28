import { DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown, Activity, Target } from "lucide-react";
import { useAdminKpis, useAdminOrders, useAdminAllOrderItems, useAdminCustomers } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    AreaChart, Area,
} from "recharts";

export default function AdminAnalyticsPage() {
    const { data: kpis, isLoading: kpisLoading } = useAdminKpis();
    const { data: orders, isLoading: ordersLoading } = useAdminOrders();
    const { data: orderItems, isLoading: itemsLoading } = useAdminAllOrderItems();
    const { data: customers, isLoading: customersLoading } = useAdminCustomers();

    const isLoading = kpisLoading || ordersLoading || itemsLoading || customersLoading;

    // Revenue over last 7 days.
    const revenueData = (() => {
        const days: { date: string; revenue: number; orders: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const dayOrders = (orders ?? []).filter((o) => o.placed_at.slice(0, 10) === key);
            const rev = dayOrders.reduce((s, o) => s + Number(o.grand_total), 0);
            days.push({ date: d.toLocaleDateString("en-US", { weekday: "short" }), revenue: Math.round(rev), orders: dayOrders.length });
        }
        return days;
    })();

    // Top products by units sold.
    const topProducts = (() => {
        const map = new Map<string, { name: string; qty: number; revenue: number }>();
        (orderItems ?? []).forEach((item) => {
            const key = item.product_id ?? item.id;
            const existing = map.get(key) ?? { name: item.product_name ?? item.variant_name ?? "Unknown", qty: 0, revenue: 0 };
            existing.qty += Number(item.quantity ?? 0);
            existing.revenue += Number(item.line_total ?? 0);
            map.set(key, existing);
        });
        return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);
    })();

    // Order status distribution.
    const statusCounts = (() => {
        const counts = new Map<string, number>();
        (orders ?? []).forEach((o) => counts.set(o.status, (counts.get(o.status) ?? 0) + 1));
        return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    })();

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

    const totalCustomers = customers?.length ?? 0;
    const conversionRate = totalCustomers > 0 ? ((kpis.totalOrders / totalCustomers) * 100).toFixed(1) : "0";
    const avgOrderValue = kpis.totalOrders > 0 ? (kpis.totalRevenue / kpis.totalOrders) : 0;

    const analyticsCards = [
        { label: "Total Revenue", value: formatCurrency(kpis.totalRevenue), icon: DollarSign, trend: 12.5, up: true },
        { label: "Avg. Order Value", value: formatCurrency(avgOrderValue), icon: ShoppingCart, trend: 5.3, up: true },
        { label: "Conversion Rate", value: `${conversionRate}%`, icon: Target, trend: -2.1, up: false },
        { label: "Total Customers", value: String(totalCustomers), icon: Users, trend: 3.8, up: true },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold">Analytics</h1>
                <p className="text-sm text-text-secondary">Traffic-to-conversion funnel and top products.</p>
            </div>

            {/* KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {analyticsCards.map((k) => (
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

            {/* Revenue area chart */}
            <Card>
                <CardContent className="p-6">
                    <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
                        <Activity className="h-5 w-5" />
                        Revenue & Orders (Last 7 Days)
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0D0D0D" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0D0D0D" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                            <XAxis dataKey="date" stroke="#888" fontSize={12} />
                            <YAxis stroke="#888" fontSize={12} />
                            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12 }} />
                            <Area type="monotone" dataKey="revenue" stroke="#0D0D0D" strokeWidth={2} fill="url(#revGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Orders bar chart */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
                            <ShoppingCart className="h-5 w-5" />
                            Orders per Day
                        </h2>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                                <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12 }} />
                                <Bar dataKey="orders" fill="#0D0D0D" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Order status distribution */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
                            <Target className="h-5 w-5" />
                            Order Status Distribution
                        </h2>
                        {statusCounts.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                        <TableHead className="text-right">Share</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {statusCounts.map((s) => (
                                        <TableRow key={s.name}>
                                            <TableCell><Badge variant="secondary">{s.name}</Badge></TableCell>
                                            <TableCell className="text-right">{s.value}</TableCell>
                                            <TableCell className="text-right text-text-secondary">
                                                {((s.value / (kpis.totalOrders || 1)) * 100).toFixed(1)}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="py-8 text-center text-sm text-text-secondary">No orders yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top products by units */}
            <Card>
                <CardContent className="p-6">
                    <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
                        <Package className="h-5 w-5" />
                        Top Products by Units Sold
                    </h2>
                    {topProducts.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Units</TableHead>
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
        </div>
    );
}
