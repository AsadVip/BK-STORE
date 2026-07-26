import { Link } from "react-router-dom";
import { Heart, Package, Bell, TrendingUp, ArrowRight } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useOrders } from "@/features/dashboard/api";
import { useGuestWishlist } from "@/lib/cart/guest-wishlist";
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

export default function AccountDashboard() {
    const { profile } = useAuth();
    const { data: orders, isLoading } = useOrders();
    const wishlistCount = useGuestWishlist((s) => s.productIds.length);

    const activeOrders = orders?.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status)) ?? [];
    const recentOrders = orders?.slice(0, 5) ?? [];

    return (
        <div>
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-semibold">
                    Welcome back, {profile?.first_name || "Customer"}
                </h1>
                <p className="mt-1 text-text-secondary">Here's an overview of your account.</p>
            </div>

            {/* Stat cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-btn-primary/10 text-btn-primary">
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold">{activeOrders.length}</p>
                            <p className="text-sm text-text-secondary">Active Orders</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-btn-primary/10 text-btn-primary">
                            <Heart className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold">{wishlistCount}</p>
                            <p className="text-sm text-text-secondary">Wishlist Items</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-btn-primary/10 text-btn-primary">
                            <Bell className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold">{recentOrders.length}</p>
                            <p className="text-sm text-text-secondary">Total Orders</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent orders */}
            <Card>
                <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-serif text-xl font-semibold">Recent Orders</h2>
                        <Button asChild variant="ghost" size="sm">
                            <Link to="/account/orders">View all <ArrowRight className="h-4 w-4" /></Link>
                        </Button>
                    </div>
                    {isLoading ? (
                        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                    ) : recentOrders.length > 0 ? (
                        <div className="space-y-3">
                            {recentOrders.map((o) => (
                                <Link
                                    key={o.id}
                                    to={`/account/orders/${o.order_number}`}
                                    className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
                                >
                                    <div>
                                        <p className="font-medium">{o.order_number}</p>
                                        <p className="text-sm text-text-secondary">{formatDate(o.placed_at)}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={STATUS_VARIANTS[o.status] ?? "secondary"}>{o.status}</Badge>
                                        <span className="font-semibold">{formatCurrency(o.grand_total)}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={TrendingUp}
                            title="No orders yet"
                            description="When you place your first order, it'll appear here."
                            action={<Button asChild><Link to="/shop">Start Shopping</Link></Button>}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
