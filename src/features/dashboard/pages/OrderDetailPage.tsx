import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Package, Truck } from "lucide-react";
import { useOrder } from "@/features/dashboard/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_STEPS = ["confirmed", "processing", "shipped", "delivered"];

export default function OrderDetailPage() {
    const { orderNumber } = useParams();
    const { data, isLoading } = useOrder(orderNumber);

    if (isLoading) {
        return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}</div>;
    }
    if (!data) {
        return <p className="text-text-secondary">Order not found.</p>;
    }

    const { order, items } = data;
    const currentStep = STATUS_STEPS.indexOf(order.status);
    const addr = (order.shipping_address as { first_name?: string; last_name?: string; line1?: string; city?: string; state?: string; postal_code?: string }) ?? {};

    return (
        <div>
            <Button asChild variant="ghost" size="sm" className="mb-6">
                <Link to="/account/orders"><ArrowLeft className="h-4 w-4" /> Back to Orders</Link>
            </Button>

            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-semibold">{order.order_number}</h1>
                    <p className="mt-1 text-text-secondary">Placed on {formatDate(order.placed_at)}</p>
                </div>
                <Badge>{order.status}</Badge>
            </div>

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
                                    <p className="mt-2 text-xs capitalize">{s}</p>
                                </div>
                                {i < STATUS_STEPS.length - 1 && (
                                    <div className={`mx-2 h-px flex-1 ${i < currentStep ? "bg-btn-primary" : "bg-border"}`} />
                                )}
                            </div>
                        ))}
                    </div>
                    {order.tracking_number && (
                        <p className="mt-4 text-sm text-text-secondary">Tracking: <span className="font-medium text-text-primary">{order.tracking_number}</span></p>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                {/* Items */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 font-serif text-xl font-semibold">Items</h2>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                                        {item.image_url ? <img src={item.image_url} alt={item.product_name} className="h-full w-full object-cover" /> : null}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{item.product_name}</p>
                                        {item.variant_name && <p className="text-sm text-text-secondary">{item.variant_name}</p>}
                                        <p className="text-sm text-text-secondary">Qty: {item.quantity}</p>
                                    </div>
                                    <span className="font-semibold">{formatCurrency(item.line_total)}</span>
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
                                <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                                {order.discount_total > 0 && <div className="flex justify-between text-state-success"><span>Discount</span><span>−{formatCurrency(order.discount_total)}</span></div>}
                                <div className="flex justify-between"><span className="text-text-secondary">Shipping</span><span>{formatCurrency(order.shipping_total)}</span></div>
                                <div className="flex justify-between"><span className="text-text-secondary">Tax</span><span>{formatCurrency(order.tax_total)}</span></div>
                                <Separator className="my-2" />
                                <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatCurrency(order.grand_total)}</span></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <h2 className="mb-3 font-serif text-lg font-semibold">Shipping Address</h2>
                            <p className="text-sm text-text-secondary">
                                {addr.first_name} {addr.last_name}<br />
                                {addr.line1}<br />
                                {addr.city}, {addr.state} {addr.postal_code}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
