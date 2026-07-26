import { useState } from "react";
import { ShoppingCart, Eye, Package, User, MapPin, Phone, Mail, Calendar, DollarSign, Truck, CheckCircle2 } from "lucide-react";
import { useAdminOrders, useUpdateOrderStatus, useAdminOrderItems } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

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
    const { data: orders, isLoading } = useAdminOrders();
    const updateStatus = useUpdateOrderStatus();
    const { toast } = useToast();

    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const { data: orderItems, isLoading: itemsLoading } = useAdminOrderItems(selectedOrder?.id ?? null, selectedOrder);

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            await updateStatus.mutateAsync({ id: orderId, status: newStatus });
            if (selectedOrder?.id === orderId) {
                setSelectedOrder((prev: any) => (prev ? { ...prev, status: newStatus } : null));
            }
            toast({ title: "Order status updated successfully!", variant: "success" });
        } catch (err) {
            toast({ title: "Failed to update status", variant: "destructive" });
        }
    };

    const address = selectedOrder?.shipping_address ?? {};
    const customerName = [address.first_name, address.last_name].filter(Boolean).join(" ") || "Customer";

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Orders</h1>
                    <p className="text-sm text-text-secondary">{orders?.length ?? 0} total orders received</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : orders && orders.length > 0 ? (
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
                                {orders.map((o) => (
                                    <TableRow
                                        key={o.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => setSelectedOrder(o)}
                                    >
                                        <TableCell className="font-bold text-btn-primary font-mono">{o.order_number}</TableCell>
                                        <TableCell className="text-text-secondary">{formatDate(o.placed_at)}</TableCell>
                                        <TableCell className="text-text-secondary">{o.guest_email ?? (o as any).email ?? "—"}</TableCell>
                                        <TableCell>
                                            <Badge variant={STATUS_VARIANTS[o.status] ?? "secondary"} className="uppercase text-[10px] tracking-wider font-extrabold">
                                                {o.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-text-primary">{formatCurrency(o.grand_total)}</TableCell>
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
                                                    onValueChange={(v) => handleStatusUpdate(o.id, v)}
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
                            title="No orders yet"
                            description="Orders will appear here once customers start purchasing."
                        />
                    )}
                </CardContent>
            </Card>

            {/* Luxury Order Details Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-4">
                            <div>
                                <DialogTitle className="font-serif text-2xl font-extrabold text-text-primary">
                                    Order #{selectedOrder?.order_number}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-text-secondary mt-1">
                                    Placed on {selectedOrder && formatDate(selectedOrder.placed_at)}
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
                        <div className="space-y-6 pt-4">
                            {/* Customer & Delivery Card */}
                            <div className="rounded-2xl border border-border/80 bg-bg-secondary/40 p-5 grid gap-4 sm:grid-cols-2 text-xs">
                                <div className="space-y-2">
                                    <h4 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                                        <User className="h-4 w-4 text-btn-primary" /> Customer Info
                                    </h4>
                                    <p className="font-semibold text-text-primary">{customerName}</p>
                                    <p className="text-text-secondary flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                                        {selectedOrder.guest_email || (selectedOrder as any).email || "N/A"}
                                    </p>
                                    {address.phone && (
                                        <p className="text-text-secondary flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                                            {address.phone}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-btn-primary" /> Delivery Address
                                    </h4>
                                    <p className="text-text-primary font-medium">{address.line1 || "Street address not provided"}</p>
                                    <p className="text-text-secondary">
                                        {[address.city, address.postal_code].filter(Boolean).join(", ")}
                                    </p>
                                    <p className="text-emerald-500 font-bold flex items-center gap-1 pt-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Cash on Delivery (COD)
                                    </p>
                                </div>
                            </div>

                            {/* Ordered Items Section */}
                            <div className="space-y-3">
                                <h4 className="font-serif font-bold text-base text-text-primary flex items-center gap-1.5">
                                    <Package className="h-4 w-4 text-btn-primary" /> Ordered Products ({orderItems?.length ?? 0})
                                </h4>

                                {itemsLoading ? (
                                    <Skeleton className="h-20 w-full rounded-xl" />
                                ) : orderItems && orderItems.length > 0 ? (
                                    <div className="rounded-2xl border border-border/80 overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-bg-secondary/60 text-xs">
                                                    <TableHead>Product</TableHead>
                                                    <TableHead className="text-center">Price</TableHead>
                                                    <TableHead className="text-center">Qty</TableHead>
                                                    <TableHead className="text-right">Subtotal</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {orderItems.map((item: any, idx: number) => (
                                                    <TableRow key={item.id || idx}>
                                                         <TableCell className="font-bold text-xs text-text-primary">
                                                             <div>
                                                                 <div>{item.product_name || item.name || item.title || "Product Item"}</div>
                                                                 {item.variant_name && (
                                                                     <div className="text-[11px] font-normal text-text-secondary">{item.variant_name}</div>
                                                                 )}
                                                             </div>
                                                         </TableCell>
                                                        <TableCell className="text-center text-xs">{formatCurrency(item.unit_price)}</TableCell>
                                                        <TableCell className="text-center text-xs font-bold">× {item.quantity}</TableCell>
                                                        <TableCell className="text-right font-extrabold text-xs text-text-primary">
                                                            {formatCurrency(item.total_price || item.unit_price * item.quantity)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-border/60 p-4 text-center text-xs text-text-secondary bg-bg-secondary/20">
                                        <p className="font-semibold text-text-primary">Legacy Test Order (Placed before product tracking update)</p>
                                        <p className="mt-1 text-[11px]">Total Amount Payable: <span className="font-bold text-btn-primary">{formatCurrency(selectedOrder.grand_total)}</span></p>
                                    </div>
                                )}
                            </div>

                            {/* Financial Summary & Status Control */}
                            <div className="rounded-2xl border border-border/80 bg-bg-secondary/60 p-5 space-y-3">
                                <div className="flex justify-between text-xs text-text-secondary">
                                    <span>Payment Mode:</span>
                                    <span className="font-bold text-text-primary">Cash on Delivery</span>
                                </div>
                                <div className="flex justify-between items-center text-base font-extrabold text-text-primary border-t border-border/60 pt-3">
                                    <span>Total Amount Payable:</span>
                                    <span className="font-serif text-xl text-btn-primary">{formatCurrency(selectedOrder.grand_total)}</span>
                                </div>

                                <div className="pt-2 flex items-center justify-between border-t border-border/60">
                                    <span className="text-xs font-bold text-text-secondary">Update Order Status:</span>
                                    <Select
                                        value={selectedOrder.status}
                                        onValueChange={(v) => handleStatusUpdate(selectedOrder.id, v)}
                                    >
                                        <SelectTrigger className="h-9 w-40 font-bold text-xs">
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
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
