import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useSEO } from "@/lib/seo";

export default function NotFoundPage() {
    useSEO({
        title: "Page Not Found | BK Store — BK Tajir",
        description: "The page you're looking for does not exist on BK Store (bktajir.com).",
    });
    return (
        <div className="container-bk flex min-h-[70vh] items-center justify-center py-16">
            <EmptyState
                icon={Compass}
                title="Page not found"
                description="The page you're looking for doesn't exist or has moved."
                action={<Button asChild><Link to="/">Back to Home</Link></Button>}
            />
        </div>
    );
}
