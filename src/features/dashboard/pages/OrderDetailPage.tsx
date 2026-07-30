import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Package, Truck, Printer, XCircle, Clock, AlertCircle } from "lucide-react";
import { useOrder } from "@/features/dashboard/api";
import { useCancelOrder } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

import { generateInvoicePDF } from "@/lib/pdf-generator";

const STATUS_STEPS = ["confirmed", "processing", "shipped", "delivered"];

export default function OrderDetailPage() {
    const { orderNumber } = useParams();
    const { data, isLoading } = useOrder(orderNumber);
    const cancelOrderMutation = useCancelOrder();
    const { toast } = useToast();

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    if (isLoading) {
        return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}</div>;
    }
    if (!data) {
        return <p className="text-text-secondary">Order not found.</p>;
    }

    const { order, items } = data;
    const currentStep = STATUS_STEPS.indexOf(order.status);
    const addr = (order.shipping_address as { first_name?: string; last_name?: string; line1?: string; city?: string; state?: string; postal_code?: string; phone?: string }) ?? {};

    // 4-Hour cancellation window check
    const placedTime = new Date(order.placed_at || (order as any).created_at).getTime();
    const nowTime = Date.now();
    const hoursElapsed = (nowTime - placedTime) / (1000 * 60 * 60);
    const isWithin4Hours = hoursElapsed <= 4.0;
    const isCancellableStatus = !["shipped", "delivered", "cancelled", "refunded"].includes(order.status);
    const canCancel = isWithin4Hours && isCancellableStatus;

    const remainingMinutes = Math.max(0, Math.floor((4.0 - hoursElapsed) * 60));

    const handleConfirmCancel = async () => {
        try {
            await cancelOrderMutation.mutateAsync({
                orderId: order.id,
                reason: cancelReason || "Customer cancelled order within 4 hours",
            });
            toast({
                title: `Order #${order.order_number} Cancelled`,
                description: "Your order has been cancelled successfully.",
                variant: "success",
            });
            setCancelModalOpen(false);
        } catch (err: any) {
            toast({
                title: "Cancellation Failed",
                description: err?.message || "Order could not be cancelled.",
                variant: "destructive",
            });
        }
    };

    const handlePrintInvoice = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const customerName = `${addr.first_name || ""} ${addr.last_name || ""}`.trim() || order.guest_email || "Valued Customer";

        const invoiceHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - ${order.order_number}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 30px; }
                    .brand { font-size: 28px; font-weight: bold; letter-spacing: 1px; }
                    .invoice-title { text-align: right; }
                    .invoice-title h1 { margin: 0; font-size: 24px; color: #555; }
                    .details-grid { display: flex; justify-content: space-between; margin-bottom: 30px; line-height: 1.6; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
                    th { background-color: #f8f9fa; font-weight: bold; border-top: 1px solid #ddd; }
                    .text-right { text-align: right; }
                    .totals { margin-left: auto; width: 300px; line-height: 2; font-size: 14px; }
                    .totals-row { display: flex; justify-content: space-between; }
                    .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #111; padding-top: 8px; margin-top: 8px; }
                    .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="brand">BK STORE</div>
                    <div class="invoice-title">
                        <h1>INVOICE</h1>
                        <p>#${order.order_number}</p>
                    </div>
                </div>
                <div class="details-grid">
                    <div>
                        <strong>Billed / Shipped To:</strong><br>
                        ${customerName}<br>
                        ${addr.line1 || ""}<br>
                        ${addr.city || ""}, ${addr.postal_code || ""}<br>
                        Phone: ${addr.phone || "N/A"}<br>
                        Email: ${order.guest_email || (order as any).email || "N/A"}
                    </div>
                    <div style="text-align: right;">
                        <strong>Order Details:</strong><br>
                        Date: ${formatDate(order.placed_at)}<br>
                        Payment Method: Cash on Delivery (COD)<br>
                        Status: ${order.status.toUpperCase()}
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Item Description</th>
                            <th>Qty</th>
                            <th class="text-right">Unit Price</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item: any) => `
                            <tr>
                                <td>${item.product_name} ${item.variant_name ? `(${item.variant_name})` : ""}</td>
                                <td>${item.quantity}</td>
                                <td class="text-right">PKR ${Number(item.unit_price).toLocaleString()}</td>
                                <td class="text-right">PKR ${Number(item.line_total).toLocaleString()}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
                <div class="totals">
                    <div class="totals-row"><span>Subtotal:</span> <span>PKR ${Number(order.subtotal || order.grand_total).toLocaleString()}</span></div>
                    <div class="totals-row"><span>Shipping:</span> <span>PKR ${Number(order.shipping_total || 0).toLocaleString()}</span></div>
                    <div class="totals-row grand-total"><span>Grand Total:</span> <span>PKR ${Number(order.grand_total).toLocaleString()}</span></div>
                </div>
                <div class="footer">
                    Thank you for shopping with BK Store! For customer support, contact support@bkstore.com.
                </div>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;

        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <Button asChild variant="ghost" size="sm">
                    <Link to="/account/orders"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders</Link>
                </Button>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => generateInvoicePDF(order)}>
                        <Printer className="h-4 w-4 mr-1.5" /> Download PDF Invoice
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
                        Printable Invoice
                    </Button>

                    {order.status === "cancelled" ? (
                        <Badge variant="danger" className="uppercase px-3 py-1 font-bold">
                            Cancelled
                        </Badge>
                    ) : canCancel ? (
                        <Button variant="destructive" size="sm" onClick={() => setCancelModalOpen(true)}>
                            <XCircle className="h-4 w-4 mr-1.5" /> Cancel Order
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-muted/60 px-3 py-1.5 rounded-lg">
                            <Clock className="h-3.5 w-3.5" />
                            <span>The cancellation window has expired.</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-semibold">{order.order_number}</h1>
                    <p className="mt-1 text-text-secondary">Placed on {formatDate(order.placed_at)}</p>
                </div>
                <Badge className="uppercase tracking-wider font-extrabold px-3 py-1">{order.status}</Badge>
            </div>

            {/* 4-Hour Cancellation Reminder Banner */}
            {canCancel && (
                <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-4 text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>
                            You can cancel this order within the 4-hour grace window. <strong>{remainingMinutes} minutes remaining</strong>.
                        </span>
                    </div>
                    <Button variant="destructive" size="sm" className="h-7 text-xs shrink-0" onClick={() => setCancelModalOpen(true)}>
                        Cancel Now
                    </Button>
                </div>
            )}

            {/* Status timeline */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        {STATUS_STEPS.map((s, i) => (
                            <div key={s} className="flex flex-1 items-center">
                                <div className="flex flex-col items-center">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${i <= currentStep ? "bg-btn-primary text-white" : "bg-muted text-muted-foreground"}`}>
                                        {i < currentStep ? <CheckCircle2 className="h-5 w-5" /> : i === 0 ? <Package className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                                    </div>
                                    <p className="mt-2 text-xs capitalize font-medium">{s}</p>
                                </div>
                                {i < STATUS_STEPS.length - 1 && (
                                    <div className={`mx-2 h-px flex-1 ${i < currentStep ? "bg-btn-primary" : "bg-border"}`} />
                                )}
                            </div>
                        ))}
                    </div>
                    {order.tracking_number && (
                        <p className="mt-4 text-sm text-text-secondary">Tracking Number: <span className="font-mono font-medium text-text-primary">{order.tracking_number}</span></p>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                {/* Items */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 font-serif text-xl font-semibold">Ordered Items</h2>
                        <div className="space-y-4">
                            {((items && items.length > 0) ? items : ((order as any).items || (order as any).order_items || [])).map((item: any, idx: number) => (
                                <div key={item.id || idx} className="flex gap-4">
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center border">
                                        {item.image_url || item.image ? (
                                            <img src={item.image_url || item.image} alt={item.product_name || item.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <Package className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-text-primary">{item.product_name || item.name}</p>
                                        {item.variant_name && <p className="text-sm text-text-secondary">{item.variant_name}</p>}
                                        <p className="text-sm text-text-secondary">Qty: {item.quantity}</p>
                                    </div>
                                    <span className="font-semibold text-text-primary">{formatCurrency(item.line_total || item.total_price || (item.unit_price * item.quantity))}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Summary + address */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="mb-4 font-serif text-lg font-semibold">Summary</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span>{formatCurrency(order.subtotal || order.grand_total)}</span></div>
                                {order.discount_total > 0 && <div className="flex justify-between text-state-success"><span>Discount</span><span>−{formatCurrency(order.discount_total)}</span></div>}
                                <div className="flex justify-between"><span className="text-text-secondary">Shipping</span><span>{formatCurrency(order.shipping_total || 0)}</span></div>
                                <div className="flex justify-between"><span className="text-text-secondary">Tax</span><span>{formatCurrency(order.tax_total || 0)}</span></div>
                                <Separator className="my-2" />
                                <div className="flex justify-between text-base font-semibold"><span>Total Amount</span><span>{formatCurrency(order.grand_total)}</span></div>
                                <p className="text-xs text-text-secondary pt-1">Payment Method: Cash on Delivery (COD)</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <h2 className="mb-3 font-serif text-lg font-semibold">Shipping Address</h2>
                            <p className="text-sm text-text-secondary">
                                {addr.first_name} {addr.last_name}<br />
                                {addr.line1}<br />
                                {addr.city}, {addr.postal_code}<br />
                                Phone: {addr.phone || "N/A"}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Cancel Order Confirmation Modal */}
            <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold">
                            <AlertCircle className="h-5 w-5" /> Cancel Order #{order.order_number}?
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Are you sure you want to cancel this order? Cancellations are immediate and free of charge within 4 hours.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <label className="text-xs font-bold block mb-1">Reason for Cancellation (optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Changed my mind, ordered wrong size..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-bg-primary px-3 text-xs"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
                            Keep Order
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmCancel} disabled={cancelOrderMutation.isPending}>
                            {cancelOrderMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
