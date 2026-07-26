import { useState } from "react";
import { Users, Search } from "lucide-react";
import { useAdminCustomers } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default function AdminCustomersPage() {
    const { data: customers, isLoading } = useAdminCustomers();
    const [search, setSearch] = useState("");

    const filtered = (customers ?? []).filter((c) => {
        const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim().toLowerCase();
        return (
            c.email.toLowerCase().includes(search.toLowerCase()) ||
            name.includes(search.toLowerCase())
        );
    });

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-semibold">Customers</h1>
                <p className="text-sm text-text-secondary">{customers?.length ?? 0} customers</p>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="relative mb-4 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : filtered.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">
                                            {c.first_name || c.last_name
                                                ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()
                                                : "—"}
                                        </TableCell>
                                        <TableCell>{c.email}</TableCell>
                                        <TableCell className="text-text-secondary">
                                            {c.phone ?? "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={c.is_guest ? "secondary" : "success"}>
                                                {c.is_guest ? "Guest" : "Registered"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-text-secondary">
                                            {formatDate(c.created_at)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <EmptyState
                            icon={Users}
                            title="No customers yet"
                            description="Registered and guest customers will appear here."
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
