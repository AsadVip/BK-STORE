import { DollarSign, ShoppingCart, Users, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { useAdminKpis, useAdminOrders } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
    pending: "#FF9800",
    confirmed: "#8B5E4B",
    processing: "#6B4A3D",
    shipped: "#2196F3",
    delivered: "#2E7D32",
    cancelled: "#C62828",
    refunded: "#9E9E9E",
};

export default function AdminDashboard() {
    const { data: kpis, isLoading } = useAdminKpis();
    const { data: orders } = useAdminOrders();

    // Build revenue-over-time (last 7 days).
    const revenueData = (() => {
        const days: { date: string; revenue: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const rev = (orders ?? []).filter((o) => o.placed_at.slice(0, 10) === key).reduce((s, o) => s + Number(o.grand_total), 0);
            days.push({ date: d.toLocaleDateString("en-US", { weekday: "short" }), revenue: Math.round(rev) });
        }
        return days;
    })();

    // Order status breakdown.
    const statusData = (() => {
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

    const kpiCards = [
        { label: "Total Revenue", value: formatCurrency(kpis.totalRevenue), icon: DollarSign, trend: 12.5, up: true },
        { label: "Orders Today", value: String(kpis.ordersToday), icon: ShoppingCart, trend: 8.2, up: true },
        { label: "New Customers", value: String(kpis.newCustomers), icon: Users, trend: -3.1, up: false },
        { label: "Low Stock Alerts", value: String(kpis.lowStockCount), icon: AlertTriangle, trend: 0, up: false },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-text-secondary">Overview of your store performance.</p>
            </div>

            {/* KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((k) => (
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

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardContent className="p-6">
                        <h2 className="mb-4 font-serif text-lg font-semibold">Revenue (Last 7 Days)</h2>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="date" stroke="#B6B6B6" fontSize={12} />
                                <YAxis stroke="#B6B6B6" fontSize={12} />
                                <Tooltip contentStyle={{ background: "#1B1B1D", border: "1px solid #333", borderRadius: 12 }} />
                                <Line type="monotone" dataKey="revenue" stroke="#8B5E4B" strokeWidth={2} dot={{ fill: "#8B5E4B" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 font-serif text-lg font-semibold">Order Status</h2>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {statusData.map((entry) => (
                                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#8B5E4B"} />
                                    ))}
                                </Pie>
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Tooltip contentStyle={{ background: "#1B1B1D", border: "1px solid #333", borderRadius: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent orders */}
            <Card>
                <CardContent className="p-6">
                    <h2 className="mb-4 font-serif text-lg font-semibold">Recent Orders</h2>
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
