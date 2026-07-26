import { DatabaseBackup, Table, RefreshCw, Shield, FileText, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const TABLES = [
    "profiles", "addresses", "categories", "brands", "products", "product_variants",
    "product_images", "orders", "order_items", "payments", "coupons", "discount_campaigns",
    "banners", "reviews", "shipping_methods", "tax_rules", "notification_templates",
    "notifications", "media_assets", "store_settings", "seo_metadata", "audit_logs",
];

export default function AdminBackupPage() {
    const { data: counts, isLoading } = useQuery({
        queryKey: ["admin-table-counts"],
        queryFn: async () => {
            const results = await Promise.all(
                TABLES.map(async (table) => {
                    const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
                    return { table, count: count ?? 0 };
                }),
            );
            return results;
        },
        staleTime: 60 * 1000,
    });

    const totalRows = (counts ?? []).reduce((sum, t) => sum + t.count, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold">Backup & Restore</h1>
                <p className="text-sm text-text-secondary">Database backup and restore documentation.</p>
            </div>

            {/* Info cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardContent className="p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-btn-primary/10 text-btn-primary">
                            <DatabaseBackup className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-2xl font-semibold">{TABLES.length}</p>
                        <p className="text-sm text-text-secondary">Database Tables</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-btn-primary/10 text-btn-primary">
                            <Table className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-2xl font-semibold">{isLoading ? "…" : totalRows.toLocaleString()}</p>
                        <p className="text-sm text-text-secondary">Total Rows</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-btn-primary/10 text-btn-primary">
                            <Shield className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-2xl font-semibold">Supabase</p>
                        <p className="text-sm text-text-secondary">Managed PostgreSQL</p>
                    </CardContent>
                </Card>
            </div>

            {/* Backup documentation */}
            <Card>
                <CardContent className="p-6">
                    <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
                        <FileText className="h-5 w-5" />
                        Backup Instructions
                    </h2>
                    <div className="space-y-4 text-sm text-text-secondary">
                        <p>
                            Your database is hosted on Supabase managed PostgreSQL. Backups are handled automatically
                            by Supabase with daily snapshots and point-in-time recovery (PITR) available on the Pro plan.
                        </p>
                        <div className="rounded-lg border border-border bg-bg-secondary p-4">
                            <p className="mb-2 font-medium text-text-primary">Manual backup via Supabase Dashboard:</p>
                            <ol className="list-inside list-decimal space-y-1">
                                <li>Navigate to your Supabase project dashboard.</li>
                                <li>Go to <span className="font-medium text-text-primary">Database → Backups</span>.</li>
                                <li>Click <span className="font-medium text-text-primary">Create Backup</span> for an on-demand snapshot.</li>
                                <li>Download the backup file or restore from any available snapshot.</li>
                            </ol>
                        </div>
                        <div className="rounded-lg border border-border bg-bg-secondary p-4">
                            <p className="mb-2 font-medium text-text-primary">CLI backup (pg_dump):</p>
                            <code className="block rounded bg-bg-tertiary p-3 font-mono text-xs text-text-primary">
                                pg_dump "postgresql://[user]:[password]@[host]:5432/[db]" -F c -f backup.dump
                            </code>
                        </div>
                        <div className="rounded-lg border border-border bg-bg-secondary p-4">
                            <p className="mb-2 font-medium text-text-primary">Restore from dump:</p>
                            <code className="block rounded bg-bg-tertiary p-3 font-mono text-xs text-text-primary">
                                pg_restore -d "postgresql://[user]:[password]@[host]:5432/[db]" backup.dump --clean
                            </code>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <Button variant="outline" className="gap-2">
                            <Download className="h-4 w-4" />
                            Export Schema (SQL)
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Refresh Counts
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table row counts */}
            <Card>
                <CardContent className="p-6">
                    <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
                        <Table className="h-5 w-5" />
                        Table Row Counts
                    </h2>
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <UITable>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Table Name</TableHead>
                                    <TableHead className="text-right">Row Count</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(counts ?? []).map((t) => (
                                    <TableRow key={t.table}>
                                        <TableCell className="font-mono text-sm">{t.table}</TableCell>
                                        <TableCell className="text-right font-semibold">{t.count.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={t.count > 0 ? "success" : "secondary"}>
                                                {t.count > 0 ? "Active" : "Empty"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </UITable>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
