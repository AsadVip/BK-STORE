import { ShieldCheck } from "lucide-react";
import { useAdminRoles, useAdminPermissions } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminRolesPage() {
    const { data: roles, isLoading: rolesLoading } = useAdminRoles();
    const { data: permissions, isLoading: permsLoading } = useAdminPermissions();

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-semibold">Roles & Permissions</h1>
                <p className="text-sm text-text-secondary">Manage admin access control</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 font-serif text-lg font-semibold">Roles</h2>
                        {rolesLoading ? (
                            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                        ) : roles && roles.length > 0 ? (
                            <div className="space-y-3">
                                {roles.map((r) => (
                                    <div key={r.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                                        <div>
                                            <p className="font-medium">{r.name}</p>
                                            <p className="text-sm text-text-secondary">{r.description}</p>
                                        </div>
                                        {r.is_system && <Badge>System</Badge>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState icon={ShieldCheck} title="No roles" />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 font-serif text-lg font-semibold">Permissions</h2>
                        {permsLoading ? (
                            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                        ) : permissions && permissions.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Key</TableHead>
                                        <TableHead>Module</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {permissions.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-mono text-sm">{p.key}</TableCell>
                                            <TableCell><Badge variant="secondary">{p.module}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <EmptyState icon={ShieldCheck} title="No permissions" />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
