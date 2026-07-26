import { Star, Check, X } from "lucide-react";
import { useAdminReviews, useModerateReview } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatDate } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "warning" | "danger"> = {
    pending: "warning", approved: "success", rejected: "danger",
};

export default function AdminReviewsPage() {
    const { data: reviews, isLoading } = useAdminReviews();
    const moderate = useModerateReview();
    const { toast } = useToast();

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-semibold">Reviews</h1>
                <p className="text-sm text-text-secondary">Moderate customer reviews</p>
            </div>

            {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>
            ) : reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                    {reviews.map((r) => (
                        <Card key={r.id}>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={cn("h-4 w-4", i < r.rating ? "fill-state-warning text-state-warning" : "text-muted-foreground")} />
                                                ))}
                                            </div>
                                            <Badge variant={STATUS_VARIANTS[r.status] ?? "secondary"}>{r.status}</Badge>
                                        </div>
                                        {r.title && <h3 className="mt-2 font-medium">{r.title}</h3>}
                                        {r.body && <p className="mt-1 text-sm text-text-secondary">{r.body}</p>}
                                        <p className="mt-2 text-xs text-text-secondary">{formatDate(r.created_at)}</p>
                                    </div>
                                    {r.status === "pending" && (
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="secondary" onClick={async () => { await moderate.mutateAsync({ id: r.id, status: "approved" }); toast({ title: "Review approved" }); }}>
                                                <Check className="h-4 w-4" /> Approve
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={async () => { await moderate.mutateAsync({ id: r.id, status: "rejected" }); toast({ title: "Review rejected" }); }}>
                                                <X className="h-4 w-4" /> Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState icon={Star} title="No reviews" description="Customer reviews will appear here for moderation." />
            )}
        </div>
    );
}
