import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

/**
 * Centered empty-state component (icon + message + optional CTA).
 * Per the UI/UX spec: "Centered icon, one-line message, optional secondary line,
 * and a primary CTA where a next action exists."
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xl font-semibold">{title}</h3>
            {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
