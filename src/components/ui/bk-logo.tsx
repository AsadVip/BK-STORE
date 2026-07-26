import { cn } from "@/lib/utils";

interface BkLogoProps {
    variant?: "full" | "icon" | "compact";
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

/**
 * BK Store Luxury Brand Logo Component.
 * Displays the store's official brand logo image (/logo.png) with premium styling.
 */
export function BkLogo({ variant = "full", size = "md", className }: BkLogoProps) {
    const sizeClasses = {
        sm: "h-8 w-auto",
        md: "h-10 w-auto",
        lg: "h-14 w-auto",
        xl: "h-20 w-auto",
    }[size];

    return (
        <div className={cn("inline-flex items-center gap-2 select-none group", className)}>
            <img
                src="/logo.png"
                alt="BK Store Logo"
                className={cn("object-contain transition-transform duration-500 group-hover:scale-105", sizeClasses)}
                onError={(e) => {
                    // Fallback to text logo if image fails to load
                    e.currentTarget.style.display = 'none';
                }}
            />
            {variant === "full" && (
                <div className="flex flex-col">
                    <span className="font-serif font-extrabold tracking-tight text-text-primary text-base lg:text-lg leading-none">
                        BK STORE
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 mt-0.5">
                        Luxury Collection
                    </span>
                </div>
            )}
        </div>
    );
}
