import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { useOrders } from "@/features/dashboard/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "warning" | "danger"> = {
    pending: "warning",
    confirmed: "default",
    processing: "default",
    shipped: "default",
    delivered: "success",
    cancelled: "danger",
    refunded: "secondary",
};

export default function OrdersPage() {
    const { data: orders, isLoading } = useOrders();

    return (
        <div>
            <h1 className="mb-8 font-serif text-3xl font-semibold">My Orders</h1>
            {isLoading ? (
                <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
            ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map((o) => (
                        <Card key={o.id}>
                            <CardContent className="p-5">
                                <Link to={`/account/orders/${o.order_number}`} className="block">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <p className="font-medium">{o.order_number}</p>
                                                <Badge variant={STATUS_VARIANTS[o.status] ?? "secondary"}>{o.status}</Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-text-secondary">
                                                Placed on {formatDate(o.placed_at)} · {o.shipping_method}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(o.grand_total)}</p>
                                            <p className="text-sm text-text-secondary">View details →</p>
                                        </div>
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={Package}
                    title="No orders yet"
                    description="Your order history will appear here once you make a purchase."
                    action={<Button asChild><Link to="/shop">Start Shopping</Link></Button>}
                />
            )}
        </div>
    );
}
