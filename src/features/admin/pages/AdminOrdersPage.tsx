import { useState, useEffect, useMemo } from "react";
import { ShoppingCart, Eye, Package, User, MapPin, Phone, Mail, Calendar, DollarSign, Truck, CheckCircle2, Download, Printer, RotateCcw, AlertTriangle, Search, FileSpreadsheet, FileText } from "lucide-react";
import { useAdminOrders, useUpdateOrderStatus, useAdminOrderItems, useResetOrders } from "@/features/admin/api";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf-generator";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "warning" | "danger"> = {
    pending: "warning",
    confirmed: "default",
    processing: "default",
    shipped: "default",
    delivered: "success",
    cancelled: "danger",
    refunded: "secondary",
};

export default function AdminOrdersPage() {
    const { data: orders, isLoading, refetch } = useAdminOrders();
    const updateStatus = useUpdateOrderStatus();
    const resetOrdersMutation = useResetOrders();
    const { toast } = useToast();

    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const { data: orderItems, isLoading: itemsLoading } = useAdminOrderItems(selectedOrder?.id ?? null, selectedOrder);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateRangeFilter, setDateRangeFilter] = useState<"all" | "today" | "yesterday" | "this_week" | "last_30_days" | "custom">("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Order Reset Modal
    const [resetModalOpen, setResetModalOpen] = useState(false);

    // Real-Time Orders Listener
    useEffect(() => {
        const channel = supabase
            .channel("admin-orders-live")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                (payload) => {
                    refetch();
                    if (payload.eventType === "INSERT") {
                        const newOrder = payload.new as any;
                        toast({
                            title: "🔔 New Order Received!",
                            description: `Order #${newOrder.order_number || "New"} has been received on Admin Panel.`,
                            variant: "success",
                        });
                    }
                }
            )
            .subscribe();

        let bc: BroadcastChannel | null = null;
        try {
            bc = new BroadcastChannel("bk_orders_channel");
            bc.onmessage = (event) => {
                if (event.data?.type === "ORDER_PLACED") {
                    refetch();
                    const newOrd = event.data.order;
                    toast({
                        title: "🔔 New Order Received!",
                        description: `Order #${newOrd?.order_number || ""} confirmed.`,
                        variant: "success",
                    });
                }
            };
        } catch (e) {}

        const handleCustomEvent = (e: any) => {
            if (e.detail?.action === "placed") {
                refetch();
                toast({
                    title: "🔔 New Order Received!",
                    description: `Order #${e.detail.order?.order_number || ""} received.`,
                    variant: "success",
                });
            }
        };

        const handleStorageEvent = (e: StorageEvent) => {
            if (e.key === "bk_local_orders") {
                refetch();
                toast({
                    title: "🔔 New Order Received!",
                    description: "A new order was placed and received on Admin Panel.",
                    variant: "success",
                });
            }
        };

        window.addEventListener("bk_order_event", handleCustomEvent);
        window.addEventListener("storage", handleStorageEvent);

        return () => {
            supabase.removeChannel(channel);
            if (bc) bc.close();
            window.removeEventListener("bk_order_event", handleCustomEvent);
            window.removeEventListener("storage", handleStorageEvent);
        };
    }, [refetch]);

    const handleStatusUpdate = async (orderId: string, orderNumber: string, newStatus: string) => {
        try {
            await updateStatus.mutateAsync({ id: orderId, orderNumber, status: newStatus });
            if (selectedOrder?.id === orderId || selectedOrder?.order_number === orderNumber) {
                setSelectedOrder((prev: any) => (prev ? { ...prev, status: newStatus } : null));
            }
            toast({ title: `Order #${orderNumber} updated to ${newStatus.toUpperCase()}!`, variant: "success" });
        } catch (err) {
            toast({ title: "Failed to update status", variant: "destructive" });
        }
    };

    // Filter Logic
    const filteredOrders = useMemo(() => {
        if (!orders) return [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

        return orders.filter((o: any) => {
            // Status filter
            if (statusFilter !== "all" && o.status !== statusFilter) return false;

            // Date Range filter
            const placedAt = new Date(o.placed_at || o.created_at);
            if (dateRangeFilter === "today" && placedAt < startOfToday) return false;
            if (dateRangeFilter === "yesterday" && (placedAt < startOfYesterday || placedAt >= startOfToday)) return false;
            if (dateRangeFilter === "this_week" && placedAt < startOfWeek) return false;
            if (dateRangeFilter === "last_30_days" && placedAt < thirtyDaysAgo) return false;
            if (dateRangeFilter === "custom") {
                if (fromDate && placedAt < new Date(fromDate)) return false;
                if (toDate && placedAt > new Date(toDate + "T23:59:59")) return false;
            }

            // Search filter (Order ID, Name, Email, Phone, Product Name)
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();

            const orderNumMatch = (o.order_number || "").toLowerCase().includes(q);
            const emailMatch = (o.guest_email || o.email || "").toLowerCase().includes(q);

            const addr = o.shipping_address || {};
            const nameMatch = `${addr.first_name || ""} ${addr.last_name || ""}`.toLowerCase().includes(q);
            const phoneMatch = (addr.phone || "").toLowerCase().includes(q);

            // Product name match
            const items = o.items || o.order_items || [];
            const productMatch = items.some((item: any) =>
                (item.product_name || item.name || "").toLowerCase().includes(q)
            );

            return orderNumMatch || emailMatch || nameMatch || phoneMatch || productMatch;
        });
    }, [orders, statusFilter, dateRangeFilter, fromDate, toDate, searchQuery]);

    // Export Handlers
    const exportCSV = () => {
        if (filteredOrders.length === 0) return;
        const headers = ["Order Number", "Date", "Customer Email", "Customer Name", "Phone", "Status", "Total (PKR)"];
        const rows = filteredOrders.map((o: any) => {
            const addr = o.shipping_address || {};
            const name = `${addr.first_name || ""} ${addr.last_name || ""}`.trim();
            return [
                o.order_number,
                new Date(o.placed_at || o.created_at).toLocaleString(),
                o.guest_email || o.email || "",
                `"${name}"`,
                `"${addr.phone || ""}"`,
                o.status,
                o.grand_total || o.total_amount || 0,
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `BK_Store_Orders_Backup_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Orders Exported", description: "CSV file downloaded successfully.", variant: "success" });
    };

    const exportExcel = () => {
        if (filteredOrders.length === 0) return;
        let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"/></head><body><table border="1">
        <thead><tr style="background:#111;color:#fff;"><th>Order #</th><th>Date</th><th>Email</th><th>Customer Name</th><th>Phone</th><th>Status</th><th>Total Amount</th></tr></thead><tbody>`;

        filteredOrders.forEach((o: any) => {
            const addr = o.shipping_address || {};
            html += `<tr>
                <td>${o.order_number}</td>
                <td>${new Date(o.placed_at || o.created_at).toLocaleString()}</td>
                <td>${o.guest_email || o.email || ""}</td>
                <td>${addr.first_name || ""} ${addr.last_name || ""}</td>
                <td>${addr.phone || ""}</td>
                <td>${o.status}</td>
                <td>${o.grand_total || 0}</td>
            </tr>`;
        });
        html += `</tbody></table></body></html>`;

        const blob = new Blob([html], { type: "application/vnd.ms-excel" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BK_Store_Orders_${Date.now()}.xls`;
        a.click();
        URL.revokeObjectURL(url);

        toast({ title: "Excel Exported", description: "Excel spreadsheet downloaded.", variant: "success" });
    };

    const exportPDFReport = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Order Report - BK Store</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 30px; color: #111; }
                    h1 { margin-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f4f4f4; }
                </style>
            </head>
            <body>
                <h1>BK Store — Order Summary Report</h1>
                <p>Generated on ${new Date().toLocaleString()} · ${filteredOrders.length} orders listed</p>
                <table>
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Grand Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredOrders.map((o: any) => `
                            <tr>
                                <td>${o.order_number}</td>
                                <td>${new Date(o.placed_at || o.created_at).toLocaleDateString()}</td>
                                <td>${(o.shipping_address?.first_name || "") + " " + (o.shipping_address?.last_name || "")}</td>
                                <td>${o.guest_email || o.email || ""}</td>
                                <td>${o.status.toUpperCase()}</td>
                                <td>PKR ${Number(o.grand_total || 0).toLocaleString()}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    // Printable Document Generators
    const printDocument = (docType: "invoice" | "packing_slip" | "receipt", orderObj: any) => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const addr = orderObj.shipping_address || {};
        const items = orderObj.items || orderObj.order_items || [];
        const customerName = `${addr.first_name || ""} ${addr.last_name || ""}`.trim() || orderObj.guest_email || "Customer";

        const docTitle = docType === "invoice" ? "INVOICE" : docType === "packing_slip" ? "PACKING SLIP" : "RECEIPT";

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${docTitle} - ${orderObj.order_number}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 30px; }
                    .brand { font-size: 28px; font-weight: bold; }
                    .doc-type { text-align: right; }
                    .doc-type h1 { margin: 0; font-size: 24px; color: #444; }
                    .grid { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; line-height: 1.6; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
                    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; }
                    th { background-color: #f8f9fa; border-top: 1px solid #ddd; }
                    .text-right { text-align: right; }
                    .totals { margin-left: auto; width: 280px; font-size: 14px; line-height: 2; }
                    .totals-row { display: flex; justify-content: space-between; }
                    .grand { font-size: 18px; font-weight: bold; border-top: 2px solid #111; padding-top: 5px; }
                    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="brand">BK STORE</div>
                    <div class="doc-type">
                        <h1>${docTitle}</h1>
                        <p>#${orderObj.order_number}</p>
                    </div>
                </div>
                <div class="grid">
                    <div>
                        <strong>Customer Details:</strong><br>
                        ${customerName}<br>
                        ${addr.line1 || ""}<br>
                        ${addr.city || ""}, ${addr.postal_code || ""}<br>
                        Phone: ${addr.phone || "N/A"}<br>
                        Email: ${orderObj.guest_email || orderObj.email || "N/A"}
                    </div>
                    <div style="text-align: right;">
                        <strong>Order Metadata:</strong><br>
                        Date: ${formatDate(orderObj.placed_at || orderObj.created_at)}<br>
                        Carrier: ${orderObj.carrier || "Leopard Courier / TCS"}<br>
                        Tracking: ${orderObj.tracking_number || "N/A"}<br>
                        Payment: Cash on Delivery
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Qty</th>
                            ${docType !== "packing_slip" ? `<th class="text-right">Unit Price</th><th class="text-right">Total</th>` : ""}
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item: any) => `
                            <tr>
                                <td>${item.product_name || item.name} ${item.variant_name ? `(${item.variant_name})` : ""}</td>
                                <td>${item.quantity}</td>
                                ${docType !== "packing_slip" ? `
                                    <td class="text-right">PKR ${Number(item.unit_price || 0).toLocaleString()}</td>
                                    <td class="text-right">PKR ${Number(item.total_price || item.line_total || (item.unit_price * item.quantity)).toLocaleString()}</td>
                                ` : ""}
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
                ${docType !== "packing_slip" ? `
                    <div class="totals">
                        <div class="totals-row"><span>Subtotal:</span> <span>PKR ${Number(orderObj.subtotal || orderObj.grand_total).toLocaleString()}</span></div>
                        <div class="totals-row"><span>Shipping:</span> <span>PKR ${Number(orderObj.shipping_total || 0).toLocaleString()}</span></div>
                        <div class="totals-row grand"><span>Total:</span> <span>PKR ${Number(orderObj.grand_total).toLocaleString()}</span></div>
                    </div>
                ` : ""}
                <div class="footer">
                    Thank you for choosing BK Store. For assistance, reach out at support@bkstore.com
                </div>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    // Reset Orders Handler
    const handleResetOrders = async () => {
        try {
            await resetOrdersMutation.mutateAsync();
            toast({
                title: "All Orders Reset Successfully",
                description: "Every order record has been permanently deleted from Supabase.",
                variant: "destructive",
            });
            setResetModalOpen(false);
            refetch();
        } catch (err: any) {
            toast({
                title: "Order Reset Failed",
                description: err?.message || "Could not complete order reset.",
                variant: "destructive",
            });
        }
    };

    const address = selectedOrder?.shipping_address ?? {};
    const customerName = [address.first_name, address.last_name].filter(Boolean).join(" ") || "Customer";

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Order Management</h1>
                    <p className="text-sm text-text-secondary">
                        {filteredOrders.length} orders shown ({orders?.length ?? 0} total)
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportCSV} className="text-xs">
                        <Download className="h-3.5 w-3.5 mr-1" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportExcel} className="text-xs">
                        <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportPDFReport} className="text-xs">
                        <FileText className="h-3.5 w-3.5 mr-1" /> PDF Report
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setResetModalOpen(true)}
                        className="text-xs font-bold"
                    >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Orders
                    </Button>
                </div>
            </div>

            {/* Filter Controls Card */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by Order ID, Name, Email, Phone, Product…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 text-xs"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="text-xs">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                                {STATUSES.map((s) => (
                                    <SelectItem key={s} value={s} className="text-xs uppercase font-bold">
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Calendar Date Filter */}
                        <Select value={dateRangeFilter} onValueChange={(v: any) => setDateRangeFilter(v)}>
                            <SelectTrigger className="text-xs">
                                <SelectValue placeholder="Calendar Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs">All Time</SelectItem>
                                <SelectItem value="today" className="text-xs">Today</SelectItem>
                                <SelectItem value="yesterday" className="text-xs">Yesterday</SelectItem>
                                <SelectItem value="this_week" className="text-xs">This Week</SelectItem>
                                <SelectItem value="last_30_days" className="text-xs">Last 30 Days</SelectItem>
                                <SelectItem value="custom" className="text-xs">Custom Date & Time Range</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Custom Date Range Controls */}
                    {dateRangeFilter === "custom" && (
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t text-xs">
                            <div className="flex items-center gap-2">
                                <Label className="text-xs font-bold">From:</Label>
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="h-8 text-xs w-36"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-xs font-bold">To:</Label>
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="h-8 text-xs w-36"
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setFromDate(""); setToDate(""); }}
                                className="h-8 text-xs text-text-secondary"
                            >
                                Clear Dates
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
                <CardContent className="p-6">
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : filteredOrders.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((o: any) => (
                                    <TableRow
                                        key={o.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => setSelectedOrder(o)}
                                    >
                                        <TableCell className="font-bold text-btn-primary font-mono">{o.order_number}</TableCell>
                                        <TableCell className="text-text-secondary text-xs">{formatDate(o.placed_at || o.created_at)}</TableCell>
                                        <TableCell className="text-text-secondary text-xs">
                                            <div>
                                                <p className="font-semibold text-text-primary">
                                                    {(o.shipping_address?.first_name || "") + " " + (o.shipping_address?.last_name || "") || "Guest"}
                                                </p>
                                                <p className="font-mono text-[11px]">{o.guest_email ?? o.email ?? "—"}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={STATUS_VARIANTS[o.status] ?? "secondary"} className="uppercase text-[10px] tracking-wider font-extrabold">
                                                {o.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-text-primary">{formatCurrency(o.grand_total || o.total_amount)}</TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedOrder(o)}
                                                    className="h-8 rounded-lg text-xs font-bold"
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-1 text-btn-primary" /> Details
                                                </Button>

                                                <Select
                                                    value={o.status}
                                                    onValueChange={(v) => handleStatusUpdate(o.id, o.order_number, v)}
                                                >
                                                    <SelectTrigger className="h-8 w-32 text-xs font-semibold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {STATUSES.map((s) => (
                                                            <SelectItem key={s} value={s} className="text-xs uppercase font-bold">
                                                                {s}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <EmptyState
                            icon={ShoppingCart}
                            title="No matching orders"
                            description="No orders match your filter and search criteria."
                        />
                    )}
                </CardContent>
            </Card>

            {/* Order Details & Printable Document Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-4">
                            <div>
                                <DialogTitle className="font-serif text-2xl font-extrabold text-text-primary">
                                    Order #{selectedOrder?.order_number}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-text-secondary mt-1">
                                    Placed on {selectedOrder && formatDate(selectedOrder.placed_at || selectedOrder.created_at)}
                                </DialogDescription>
                            </div>
                            {selectedOrder && (
                                <Badge variant={STATUS_VARIANTS[selectedOrder.status] ?? "secondary"} className="uppercase text-xs font-black px-3 py-1">
                                    {selectedOrder.status}
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6 pt-2">
                            {/* Document Printing Bar */}
                            <div className="p-3 bg-muted/50 rounded-xl flex flex-wrap items-center justify-between gap-2 border">
                                <span className="text-xs font-bold flex items-center gap-1.5">
                                    <Printer className="h-4 w-4 text-btn-primary" /> Print Documents:
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="h-7 text-xs font-semibold" onClick={() => generateInvoicePDF(selectedOrder)}>
                                        <Download className="h-3 w-3 mr-1" /> Download PDF
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs font-semibold" onClick={() => printDocument("invoice", selectedOrder)}>
                                        Invoice
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs font-semibold" onClick={() => printDocument("packing_slip", selectedOrder)}>
                                        Packing Slip
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs font-semibold" onClick={() => printDocument("receipt", selectedOrder)}>
                                        Receipt
                                    </Button>
                                </div>
                            </div>

                            {/* Customer & Address */}
                            <div className="rounded-2xl border border-border/80 bg-bg-secondary/40 p-5 grid gap-4 sm:grid-cols-2 text-xs">
                                <div className="space-y-2">
                                    <h4 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                                        <User className="h-4 w-4 text-btn-primary" /> Customer Info
                                    </h4>
                                    <p className="font-semibold text-text-primary">{customerName}</p>
                                    <p className="text-text-secondary flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 shrink-0" />
                                        {selectedOrder.guest_email || selectedOrder.email || "N/A"}
                                    </p>
                                    {address.phone && (
                                        <p className="text-text-secondary flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 shrink-0" />
                                            {address.phone}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-btn-primary" /> Delivery Address
                                    </h4>
                                    <p className="text-text-secondary">
                                        {address.line1 || "—"}<br />
                                        {address.city && `${address.city}, `}{address.postal_code || ""}<br />
                                        {address.country || "Pakistan"}
                                    </p>
                                </div>
                            </div>

                            {/* Items List */}
                            <div>
                                <h4 className="font-bold text-text-primary text-sm mb-3">Order Items</h4>
                                <div className="space-y-2">
                                    {itemsLoading ? (
                                        <div className="p-4 text-center text-xs text-text-secondary">Loading items...</div>
                                    ) : (() => {
                                        const displayItems = (orderItems && orderItems.length > 0)
                                            ? orderItems
                                            : (selectedOrder.items || selectedOrder.order_items || (typeof selectedOrder.shipping_address === "object" ? selectedOrder.shipping_address?.items : []) || []);

                                        if (!displayItems || displayItems.length === 0) {
                                            return (
                                                <div className="p-4 text-center text-xs text-text-secondary border rounded-xl bg-muted/20">
                                                    No item details available for this order.
                                                </div>
                                            );
                                        }

                                        return displayItems.map((item: any, idx: number) => (
                                            <div key={item.id || idx} className="flex items-center justify-between p-3 rounded-xl border bg-card text-xs">
                                                <div>
                                                    <p className="font-bold text-text-primary">{item.product_name || item.name}</p>
                                                    {item.variant_name && <p className="text-text-secondary">{item.variant_name}</p>}
                                                    <p className="text-text-secondary">Qty: {item.quantity}</p>
                                                </div>
                                                <span className="font-bold">{formatCurrency(item.total_price || item.line_total || (item.unit_price * item.quantity))}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Order Reset Warning Dialog */}
            <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
                <DialogContent className="sm:max-w-md border-rose-500/40">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold">
                            <AlertTriangle className="h-5 w-5" /> Warning! Order Reset
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed mt-2 text-text-primary font-medium">
                            This action will permanently delete all order records. Please download a backup before continuing.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={exportCSV} className="w-full sm:w-auto">
                            <Download className="h-3.5 w-3.5 mr-1" /> Download Backup
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setResetModalOpen(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleResetOrders}
                            disabled={resetOrdersMutation.isPending}
                            className="w-full sm:w-auto font-bold"
                        >
                            {resetOrdersMutation.isPending ? "Deleting Permanently…" : "Delete Permanently"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
