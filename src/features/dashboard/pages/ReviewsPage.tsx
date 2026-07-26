import { Star } from "lucide-react";
import { useMyReviews } from "@/features/dashboard/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDate } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "warning" | "danger"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
};

export default function ReviewsPage() {
    const { data: reviews, isLoading } = useMyReviews();

    return (
        <div>
            <h1 className="mb-8 font-serif text-3xl font-semibold">My Reviews</h1>
            {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>
            ) : reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                    {reviews.map((r) => (
                        <Card key={r.id}>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className={cn("h-4 w-4", i < r.rating ? "fill-state-warning text-state-warning" : "text-muted-foreground")} />
                                        ))}
                                    </div>
                                    <Badge variant={STATUS_VARIANTS[r.status] ?? "secondary"}>{r.status}</Badge>
                                </div>
                                {r.title && <h3 className="mt-3 font-medium">{r.title}</h3>}
                                {r.body && <p className="mt-1 text-sm text-text-secondary">{r.body}</p>}
                                <p className="mt-3 text-xs text-text-secondary">{formatDate(r.created_at)}</p>
                                {r.admin_reply && (
                                    <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
                                        <p className="font-medium">Store reply:</p>
                                        <p className="text-text-secondary">{r.admin_reply}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState icon={Star} title="No reviews yet" description="Share your experience with products you've purchased." />
            )}
        </div>
    );
}
