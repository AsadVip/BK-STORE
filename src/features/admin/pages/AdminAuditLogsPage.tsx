import { ScrollText } from "lucide-react";
import { useAuditLogs } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default function AdminAuditLogsPage() {
    const { data: logs, isLoading } = useAuditLogs();

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-semibold">Audit Logs</h1>
                <p className="text-sm text-text-secondary">Track all admin actions</p>
            </div>

            <Card>
                <CardContent className="p-6">
                    {isLoading ? (
                        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                    ) : logs && logs.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Entity</TableHead>
                                    <TableHead>Entity ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((l) => (
                                    <TableRow key={l.id}>
                                        <TableCell className="text-text-secondary">{formatDate(l.created_at, { dateStyle: "short", timeStyle: "short" })}</TableCell>
                                        <TableCell>{l.actor_email ?? l.actor_id?.slice(0, 8) ?? "system"}</TableCell>
                                        <TableCell><Badge variant="secondary">{l.action}</Badge></TableCell>
                                        <TableCell className="text-text-secondary">{l.entity_type}</TableCell>
                                        <TableCell className="font-mono text-xs text-text-secondary">{l.entity_id?.slice(0, 8) ?? "—"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <EmptyState icon={ScrollText} title="No audit logs" description="Admin actions will be recorded here." />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
