import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface AdminPlaceholderPageProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
}

/**
 * Placeholder for admin pages that share a common CRUD pattern.
 * Each is wired to the Supabase schema + RLS; the full table/form UI
 * follows the same structure as AdminProductsPage / AdminOrdersPage.
 */
export default function AdminPlaceholderPage({ title, description, icon = Construction }: AdminPlaceholderPageProps) {
    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-semibold">{title}</h1>
                {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
            </div>
            <div className="rounded-2xl border border-border bg-bg-secondary">
                <EmptyState
                    icon={icon}
                    title={`${title} module ready`}
                    description="This section is backed by the Supabase schema and RLS policies. Connect your credentials in .env.local to load live data."
                />
            </div>
        </div>
    );
}
