import { Bell } from "lucide-react";
import { useNotifications, useMarkNotificationRead } from "@/features/dashboard/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

export default function NotificationsPage() {
    const { data: notifications, isLoading } = useNotifications();
    const markRead = useMarkNotificationRead();

    return (
        <div>
            <h1 className="mb-8 font-serif text-3xl font-semibold">Notifications</h1>
            {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
            ) : notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                    {notifications.map((n) => (
                        <Card key={n.id} className={cn(!n.is_read && "border-btn-primary/40")}>
                            <CardContent className="flex items-start gap-4 p-5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-btn-primary/10 text-btn-primary">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{n.title}</p>
                                    {n.body && <p className="mt-1 text-sm text-text-secondary">{n.body}</p>}
                                    <p className="mt-2 text-xs text-text-secondary">{formatDate(n.created_at)}</p>
                                </div>
                                {!n.is_read && (
                                    <Button variant="ghost" size="sm" onClick={() => markRead.mutate(n.id)}>Mark read</Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
            )}
        </div>
    );
}
