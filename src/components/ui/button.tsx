import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-btn-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
    {
        variants: {
            variant: {
                primary: "bg-btn-primary text-white hover:bg-btn-primary-hover shadow-soft",
                secondary:
                    "border border-text-secondary/40 bg-transparent text-text-primary hover:bg-text-secondary/10",
                ghost: "bg-transparent text-text-primary hover:bg-text-secondary/10",
                destructive: "bg-state-danger text-white hover:bg-state-danger/90",
                outline:
                    "border border-btn-primary bg-transparent text-btn-primary hover:bg-btn-primary hover:text-white",
                link: "text-btn-primary underline-offset-4 hover:underline",
            },
            size: {
                sm: "h-9 px-4 text-sm",
                md: "h-11 px-6 text-sm",
                lg: "h-13 px-8 text-base",
                icon: "h-11 w-11",
            },
        },
        defaultVariants: { variant: "primary", size: "md" },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };
