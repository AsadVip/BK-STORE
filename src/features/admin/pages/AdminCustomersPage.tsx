import { useState } from "react";
import { Users, Search, UserCheck, UserX, ShoppingBag, Clock, CheckCircle2, XCircle, AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAdminCustomers, useAdminOrders, useBanUser, useUnbanUser } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminCustomersPage() {
    const { data: customers, isLoading: customersLoading } = useAdminCustomers();
    const { data: orders, isLoading: ordersLoading } = useAdminOrders();
    const banUserMutation = useBanUser();
    const unbanUserMutation = useUnbanUser();
    const { toast } = useToast();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">("all");
    const [banModalCustomer, setBanModalCustomer] = useState<any | null>(null);
    const [banReason, setBanReason] = useState("");
    const [banType, setBanType] = useState<"permanent" | "temporary">("permanent");
    const [bannedUntilDate, setBannedUntilDate] = useState("");

    // Calculate aggregated Metrics
    const totalUsers = customers?.length ?? 0;
    const activeUsers = (customers ?? []).filter((c: any) => c.status !== "banned").length;
    const bannedUsers = (customers ?? []).filter((c: any) => c.status === "banned").length;

    const totalOrders = orders?.length ?? 0;
    const pendingOrders = (orders ?? []).filter((o) => o.status === "pending" || o.status === "processing").length;
    const completedOrders = (orders ?? []).filter((o) => o.status === "delivered").length;
    const cancelledOrders = (orders ?? []).filter((o) => o.status === "cancelled").length;

    // Filter customers
    const filtered = (customers ?? []).filter((c: any) => {
        const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim().toLowerCase();
        const matchesSearch =
            c.email.toLowerCase().includes(search.toLowerCase()) ||
            name.includes(search.toLowerCase()) ||
            (c.phone && c.phone.includes(search));

        const isBanned = c.status === "banned";
        const matchesStatus =
            statusFilter === "all" ? true : statusFilter === "banned" ? isBanned : !isBanned;

        return matchesSearch && matchesStatus;
    });

    const handleOpenBanModal = (customer: any) => {
        setBanModalCustomer(customer);
        setBanReason("");
        setBanType("permanent");
        setBannedUntilDate("");
    };

    const handleConfirmBan = async () => {
        if (!banModalCustomer) return;
        if (!banReason.trim()) {
            toast({ title: "Please provide a reason for restricting this user.", variant: "destructive" });
            return;
        }

        try {
            await banUserMutation.mutateAsync({
                profileId: banModalCustomer.id,
                reason: banReason.trim(),
                banType,
                bannedUntil: banType === "temporary" && bannedUntilDate ? new Date(bannedUntilDate).toISOString() : null,
            });
            toast({
                title: `User ${banModalCustomer.email} has been restricted`,
                description: "This customer will not be able to place new orders.",
                variant: "destructive",
            });
            setBanModalCustomer(null);
        } catch (err) {
            toast({ title: "Failed to restrict user", description: (err as Error).message, variant: "destructive" });
        }
    };

    const handleUnban = async (customer: any) => {
        try {
            await unbanUserMutation.mutateAsync(customer.id);
            toast({
                title: `User ${customer.email} restored to Active`,
                description: "Customer restriction lifted successfully.",
                variant: "success",
            });
        } catch (err) {
            toast({ title: "Failed to unban user", description: (err as Error).message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-2xl font-bold tracking-tight">User Management & Customers</h1>
                    <p className="text-sm text-text-secondary">
                        Monitor active customers, order volume, total spend, and account restrictions.
                    </p>
                </div>
            </div>

            {/* Metrics Header Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
                <Card className="bg-card">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Users className="h-5 w-5 text-btn-primary mb-1" />
                        <span className="text-xl font-extrabold">{totalUsers}</span>
                        <span className="text-xs text-text-secondary">Total Users</span>
                    </CardContent>
                </Card>
                <Card className="bg-card">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <UserCheck className="h-5 w-5 text-state-success mb-1" />
                        <span className="text-xl font-extrabold text-state-success">{activeUsers}</span>
                        <span className="text-xs text-text-secondary">Active Users</span>
                    </CardContent>
                </Card>
                <Card className="bg-card">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <UserX className="h-5 w-5 text-state-danger mb-1" />
                        <span className="text-xl font-extrabold text-state-danger">{bannedUsers}</span>
                        <span className="text-xs text-text-secondary">Banned Users</span>
                    </CardContent>
                </Card>
                <Card className="bg-card">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <ShoppingBag className="h-5 w-5 text-blue-600 mb-1" />
                        <span className="text-xl font-extrabold">{totalOrders}</span>
                        <span className="text-xs text-text-secondary">Total Orders</span>
                    </CardContent>
                </Card>
                <Card className="bg-card">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Clock className="h-5 w-5 text-amber-500 mb-1" />
                        <span className="text-xl font-extrabold text-amber-600">{pendingOrders}</span>
                        <span className="text-xs text-text-secondary">Pending</span>
                    </CardContent>
                </Card>
                <Card className="bg-card">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mb-1" />
                        <span className="text-xl font-extrabold text-emerald-600">{completedOrders}</span>
                        <span className="text-xs text-text-secondary">Completed</span>
                    </CardContent>
                </Card>
                <Card className="bg-card">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <XCircle className="h-5 w-5 text-rose-600 mb-1" />
                        <span className="text-xl font-extrabold text-rose-600">{cancelledOrders}</span>
                        <span className="text-xs text-text-secondary">Cancelled</span>
                    </CardContent>
                </Card>
            </div>

            {/* Customers Table Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or phone…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={statusFilter === "all" ? "primary" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter("all")}
                                className="text-xs"
                            >
                                All ({customers?.length ?? 0})
                            </Button>
                            <Button
                                variant={statusFilter === "active" ? "primary" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter("active")}
                                className="text-xs"
                            >
                                Active ({activeUsers})
                            </Button>
                            <Button
                                variant={statusFilter === "banned" ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter("banned")}
                                className="text-xs"
                            >
                                Banned ({bannedUsers})
                            </Button>
                        </div>
                    </div>

                    {customersLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : filtered.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Email & Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Orders</TableHead>
                                    <TableHead>Total Spend</TableHead>
                                    <TableHead>First / Last Order</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((c: any) => {
                                    const fullName = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Guest Customer";
                                    const isBanned = c.status === "banned";
                                    const orderCount = c.order_count ?? 0;
                                    const totalSpend = Number(c.total_spend ?? 0);

                                    return (
                                        <TableRow key={c.id} className={isBanned ? "bg-rose-500/5" : ""}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <p className="font-bold text-text-primary">{fullName}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Badge variant={c.is_guest ? "secondary" : "default"} className="text-[10px]">
                                                            {c.is_guest ? "Guest" : "Registered"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs">
                                                    <p className="font-mono text-text-primary">{c.email}</p>
                                                    <p className="text-text-secondary mt-0.5">{c.phone ?? "No phone"}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {isBanned ? (
                                                    <div className="space-y-1">
                                                        <Badge variant="danger" className="flex items-center w-fit gap-1 text-[10px] font-bold uppercase">
                                                            <ShieldAlert className="h-3 w-3" /> Banned
                                                        </Badge>
                                                        {c.ban_reason && (
                                                            <p className="text-[11px] text-rose-600 line-clamp-1 italic">
                                                                "{c.ban_reason}"
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Badge variant="success" className="flex items-center w-fit gap-1 text-[10px] font-bold uppercase">
                                                        <ShieldCheck className="h-3 w-3" /> Active
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center font-bold font-mono">
                                                {orderCount}
                                            </TableCell>
                                            <TableCell className="font-bold text-emerald-600">
                                                {formatCurrency(totalSpend)}
                                            </TableCell>
                                            <TableCell className="text-xs text-text-secondary">
                                                <p>1st: {c.first_order_date ? formatDate(c.first_order_date) : "—"}</p>
                                                <p>Last: {c.last_order_date ? formatDate(c.last_order_date) : formatDate(c.created_at)}</p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isBanned ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleUnban(c)}
                                                        disabled={unbanUserMutation.isPending}
                                                        className="h-8 text-xs text-emerald-600 hover:text-emerald-700 border-emerald-500/30"
                                                    >
                                                        <UserCheck className="h-3.5 w-3.5 mr-1" /> Unban
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleOpenBanModal(c)}
                                                        className="h-8 text-xs"
                                                    >
                                                        <UserX className="h-3.5 w-3.5 mr-1" /> Ban User
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <EmptyState
                            icon={Users}
                            title="No matching customers"
                            description="No customer records match your filter criteria."
                        />
                    )}
                </CardContent>
            </Card>

            {/* Ban User Modal */}
            <Dialog open={!!banModalCustomer} onOpenChange={(open) => !open && setBanModalCustomer(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold">
                            <AlertTriangle className="h-5 w-5" /> Ban / Restrict Customer Account
                        </DialogTitle>
                        <DialogDescription className="text-xs mt-1">
                            Restricting <strong>{banModalCustomer?.email}</strong> will block them from placing new orders across the platform.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold">Restriction Type</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={banType === "permanent" ? "destructive" : "outline"}
                                    size="sm"
                                    onClick={() => setBanType("permanent")}
                                >
                                    Permanent Ban
                                </Button>
                                <Button
                                    type="button"
                                    variant={banType === "temporary" ? "destructive" : "outline"}
                                    size="sm"
                                    onClick={() => setBanType("temporary")}
                                >
                                    Temporary Ban
                                </Button>
                            </div>
                        </div>

                        {banType === "temporary" && (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">Ban Until Date</Label>
                                <Input
                                    type="date"
                                    value={bannedUntilDate}
                                    onChange={(e) => setBannedUntilDate(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold">Reason for Ban <span className="text-rose-500">*</span></Label>
                            <Input
                                placeholder="e.g. Fraudulent order attempts, repeated fake COD requests…"
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBanModalCustomer(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmBan} disabled={banUserMutation.isPending}>
                            {banUserMutation.isPending ? "Restricting…" : "Confirm Restriction"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
