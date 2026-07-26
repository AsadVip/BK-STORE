import { useState } from "react";
import { Bell, Plus } from "lucide-react";
import { useAdminNotificationTemplates, useToggleNotificationTemplate, useCreateNotificationTemplate } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

const CHANNELS = [
    { value: "email", label: "Email" },
    { value: "sms", label: "SMS" },
    { value: "in_app", label: "In-App" },
];

const EVENT_TYPES = [
    "order_placed",
    "order_shipped",
    "order_delivered",
    "order_cancelled",
    "payment_received",
    "account_created",
    "password_reset",
    "review_approved",
    "low_stock",
    "custom",
];

interface TemplateForm {
    event_type: string;
    channel: string;
    subject: string;
    body_template: string;
    is_active: boolean;
}

const EMPTY_FORM: TemplateForm = {
    event_type: "order_placed",
    channel: "email",
    subject: "",
    body_template: "",
    is_active: true,
};

export default function AdminNotificationsPage() {
    const { data: templates, isLoading } = useAdminNotificationTemplates();
    const toggleTemplate = useToggleNotificationTemplate();
    const createTemplate = useCreateNotificationTemplate();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);

    const filtered = (templates ?? []).filter(
        (t) =>
            t.event_type.toLowerCase().includes(search.toLowerCase()) ||
            t.channel.toLowerCase().includes(search.toLowerCase()),
    );

    const resetForm = () => setForm(EMPTY_FORM);

    const openDialog = () => {
        resetForm();
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.event_type.trim() || !form.body_template.trim()) {
            toast({ title: "Event type and body template are required", variant: "destructive" });
            return;
        }
        try {
            await createTemplate.mutateAsync({
                event_type: form.event_type.trim(),
                channel: form.channel as "email" | "sms" | "in_app",
                subject: form.subject.trim() || null,
                body_template: form.body_template,
                is_active: form.is_active,
            });
            toast({ title: "Notification template created", variant: "success" });
            setOpen(false);
            resetForm();
        } catch (err) {
            toast({ title: "Failed to create template", description: (err as Error).message, variant: "destructive" });
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Notifications</h1>
                    <p className="text-sm text-text-secondary">
                        {templates?.length ?? 0} templates · manage email, SMS, and in-app triggers
                    </p>
                </div>
                <Button onClick={openDialog}>
                    <Plus className="h-4 w-4" /> Add Template
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Input
                        placeholder="Search by event type or channel…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mb-4 max-w-sm"
                    />
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
                                    <TableHead>Event Type</TableHead>
                                    <TableHead>Channel</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Updated</TableHead>
                                    <TableHead>Active</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-mono font-medium">{t.event_type}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{t.channel}</Badge>
                                        </TableCell>
                                        <TableCell className="text-text-secondary">
                                            {t.subject ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-text-secondary">
                                            {formatDate(t.updated_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={t.is_active}
                                                onCheckedChange={async (checked) => {
                                                    await toggleTemplate.mutateAsync({
                                                        id: t.id,
                                                        is_active: checked,
                                                    });
                                                    toast({
                                                        title: checked ? "Template enabled" : "Template disabled",
                                                        variant: "success",
                                                    });
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <EmptyState
                            icon={Bell}
                            title="No notification templates yet"
                            description="Templates for order, shipping, and account events will appear here."
                            action={
                                <Button onClick={openDialog}>
                                    <Plus className="h-4 w-4" /> Add Template
                                </Button>
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Notification Template</DialogTitle>
                        <DialogDescription>Create a template for an event and delivery channel.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="notif-event">Event Type</Label>
                            <select
                                id="notif-event"
                                className="flex h-10 w-full rounded-md border border-input bg-bg-primary px-3 py-2 text-sm"
                                value={form.event_type}
                                onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
                                required
                            >
                                {EVENT_TYPES.map((ev) => (
                                    <option key={ev} value={ev}>
                                        {ev}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notif-channel">Channel</Label>
                            <select
                                id="notif-channel"
                                className="flex h-10 w-full rounded-md border border-input bg-bg-primary px-3 py-2 text-sm"
                                value={form.channel}
                                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                                required
                            >
                                {CHANNELS.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notif-subject">Subject (optional for in-app)</Label>
                            <Input
                                id="notif-subject"
                                placeholder="e.g. Your order has been shipped"
                                value={form.subject}
                                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notif-body">Body Template</Label>
                            <Textarea
                                id="notif-body"
                                placeholder="Use {{variables}} for dynamic content"
                                className="min-h-[120px]"
                                value={form.body_template}
                                onChange={(e) => setForm((f) => ({ ...f, body_template: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="notif-active"
                                checked={form.is_active}
                                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
                            />
                            <Label htmlFor="notif-active">Active</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createTemplate.isPending}>
                                {createTemplate.isPending ? "Creating…" : "Create Template"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
