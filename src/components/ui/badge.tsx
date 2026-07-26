import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
    {
        variants: {
            variant: {
                default: "bg-btn-primary text-white",
                secondary: "bg-bg-secondary text-text-secondary border border-border",
                success: "bg-state-success/15 text-state-success",
                danger: "bg-state-danger text-white",
                warning: "bg-state-warning/15 text-state-warning",
                outline: "border border-border text-text-secondary",
            },
        },
        defaultVariants: { variant: "default" },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
