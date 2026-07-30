import { useState, useEffect } from "react";
import { Bell, Plus, Check, Trash2, Search, Smartphone, ShieldCheck, ShieldAlert, Sparkles, Filter, RefreshCw } from "lucide-react";
import {
    useAdminNotificationTemplates,
    useToggleNotificationTemplate,
    useCreateNotificationTemplate,
    useAdminNotificationsCenter,
    useMarkNotificationAsRead,
    useDeleteNotification
} from "@/features/admin/api";
import { requestAndSaveFCMToken, setupForegroundFCMListener } from "@/lib/firebase";
import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    const { user } = useAuth();
    const { toast } = useToast();

    // Data hooks
    const { data: notificationsList, isLoading: notifLoading, refetch: refetchNotifs } = useAdminNotificationsCenter();
    const { data: templates, isLoading: templatesLoading } = useAdminNotificationTemplates();
    const toggleTemplate = useToggleNotificationTemplate();
    const createTemplate = useCreateNotificationTemplate();
    const markAsReadMutation = useMarkNotificationAsRead();
    const deleteNotificationMutation = useDeleteNotification();

    // Local states
    const [activeTab, setActiveTab] = useState<"all" | "unread" | "read" | "templates">("all");
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [openDialog, setOpenDialog] = useState(false);
    const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);

    // FCM state
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [fcmRegistering, setFcmRegistering] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
    );

    useEffect(() => {
        const savedToken = localStorage.getItem("bk_fcm_token");
        if (savedToken) setFcmToken(savedToken);

        let cleanupFn: (() => void) | null = null;
        setupForegroundFCMListener((payload) => {
            refetchNotifs();
            toast({
                title: payload.notification?.title || "🔔 New Push Notification",
                description: payload.notification?.body || "A new order notification was received.",
                variant: "success",
            });
        }).then((unsub) => {
            cleanupFn = unsub;
        });

        return () => {
            if (cleanupFn) cleanupFn();
        };
    }, [refetchNotifs, toast]);

    const handleEnablePushNotifications = async () => {
        setFcmRegistering(true);
        try {
            const token = await requestAndSaveFCMToken(user?.id);
            if (typeof window !== "undefined" && "Notification" in window) {
                setNotificationPermission(Notification.permission);
            }
            if (token) {
                setFcmToken(token);
                toast({
                    title: "Push Notifications Enabled!",
                    description: "FCM Device Token registered successfully in Supabase.",
                    variant: "success",
                });
            } else {
                toast({
                    title: "Push Notification Setup Notice",
                    description: "Browser permission was denied or token generation was blocked.",
                    variant: "destructive",
                });
            }
        } catch (e: any) {
            toast({ title: "FCM Error", description: e?.message || "Failed to initialize FCM", variant: "destructive" });
        } finally {
            setFcmRegistering(false);
        }
    };

    // Filter Notifications
    const filteredNotifications = (notificationsList ?? []).filter((item: any) => {
        // Tab filter
        if (activeTab === "unread" && item.is_read) return false;
        if (activeTab === "read" && !item.is_read) return false;

        // Type filter
        if (typeFilter !== "all" && item.type !== typeFilter) return false;

        // Search query
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            (item.title || "").toLowerCase().includes(q) ||
            (item.body || "").toLowerCase().includes(q) ||
            (item.type || "").toLowerCase().includes(q)
        );
    });

    const filteredTemplates = (templates ?? []).filter(
        (t) =>
            t.event_type.toLowerCase().includes(search.toLowerCase()) ||
            t.channel.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmitTemplate = async (e: React.FormEvent) => {
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
            setOpenDialog(false);
            setForm(EMPTY_FORM);
        } catch (err) {
            toast({ title: "Failed to create template", description: (err as Error).message, variant: "destructive" });
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await markAsReadMutation.mutateAsync(id);
            toast({ title: "Marked as read", variant: "success" });
        } catch (e) {
            toast({ title: "Failed to update notification", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteNotificationMutation.mutateAsync(id);
            toast({ title: "Notification deleted", variant: "success" });
        } catch (e) {
            toast({ title: "Failed to delete notification", variant: "destructive" });
        }
    };

    const unreadCount = (notificationsList ?? []).filter((n: any) => !n.is_read).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-2xl font-semibold">Notification Center & Push Setup</h1>
                    <p className="text-sm text-text-secondary">
                        Real-time order alerts, FCM device token management, and communication templates.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetchNotifs()}>
                        <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
                    </Button>
                    <Button onClick={() => setOpenDialog(true)}>
                        <Plus className="h-4 w-4 mr-1.5" /> Add Template
                    </Button>
                </div>
            </div>

            {/* FCM Push Notification Device Registration Banner */}
            <Card className="border-btn-primary/30 bg-btn-primary/5">
                <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-btn-primary text-white flex items-center justify-center shrink-0">
                            <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                                Firebase Cloud Messaging (FCM) Push Notifications
                                {fcmToken ? (
                                    <Badge variant="success" className="text-[10px] uppercase font-black">
                                        Active Token
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="text-[10px] uppercase font-black">
                                        Not Registered
                                    </Badge>
                                )}
                            </h3>
                            <p className="text-xs text-text-secondary mt-0.5">
                                Receive instant order notifications when open, backgrounded, or when browser is running.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleEnablePushNotifications}
                        disabled={fcmRegistering}
                        className="rounded-xl font-bold text-xs"
                    >
                        <Sparkles className="h-4 w-4 mr-1.5" />
                        {fcmRegistering
                            ? "Connecting FCM…"
                            : fcmToken
                            ? "Re-sync Device Token"
                            : "Enable Push Notifications"}
                    </Button>
                </CardContent>
            </Card>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="all" className="text-xs font-bold">
                            All Notifications ({notificationsList?.length ?? 0})
                        </TabsTrigger>
                        <TabsTrigger value="unread" className="text-xs font-bold">
                            Unread ({unreadCount})
                        </TabsTrigger>
                        <TabsTrigger value="read" className="text-xs font-bold">
                            Read
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="text-xs font-bold">
                            Templates ({templates?.length ?? 0})
                        </TabsTrigger>
                    </TabsList>

                    {activeTab !== "templates" && (
                        <div className="flex items-center gap-2">
                            <div className="relative max-w-xs">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search notifications…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 text-xs h-9 w-60"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Notifications Center View */}
                <TabsContent value={activeTab} className="space-y-4">
                    {activeTab !== "templates" ? (
                        <Card>
                            <CardContent className="p-6">
                                {notifLoading ? (
                                    <div className="space-y-2">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Skeleton key={i} className="h-12 w-full" />
                                        ))}
                                    </div>
                                ) : filteredNotifications.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Notification</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredNotifications.map((n: any) => (
                                                <TableRow key={n.id} className={!n.is_read ? "bg-amber-500/5 font-semibold" : ""}>
                                                    <TableCell>
                                                        <Badge variant={n.type === "order" ? "default" : "secondary"} className="uppercase text-[10px] font-extrabold">
                                                            {n.type || "system"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="text-text-primary">{n.title}</p>
                                                            {n.body && <p className="text-xs text-text-secondary font-normal mt-0.5">{n.body}</p>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-text-secondary font-normal">
                                                        {formatDate(n.created_at)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {n.is_read ? (
                                                            <span className="text-xs text-text-secondary font-normal">Read</span>
                                                        ) : (
                                                            <Badge variant="warning" className="text-[10px]">New Unread</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end items-center gap-2">
                                                            {!n.is_read && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleMarkAsRead(n.id)}
                                                                    title="Mark as Read"
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <Check className="h-4 w-4 text-emerald-600" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDelete(n.id)}
                                                                title="Delete Notification"
                                                                className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <EmptyState
                                        icon={Bell}
                                        title="No notifications"
                                        description="Notifications for orders and push alerts will appear here."
                                    />
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        /* Templates View */
                        <Card>
                            <CardContent className="p-6">
                                <Input
                                    placeholder="Search by event type or channel…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="mb-4 max-w-sm"
                                />
                                {templatesLoading ? (
                                    <div className="space-y-2">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Skeleton key={i} className="h-12 w-full" />
                                        ))}
                                    </div>
                                ) : filteredTemplates.length > 0 ? (
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
                                            {filteredTemplates.map((t) => (
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
                                            <Button onClick={() => setOpenDialog(true)}>
                                                <Plus className="h-4 w-4 mr-1.5" /> Add Template
                                            </Button>
                                        }
                                    />
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Add Template Modal */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Notification Template</DialogTitle>
                        <DialogDescription>Create a template for an event and delivery channel.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitTemplate} className="space-y-4">
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
                            <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
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
