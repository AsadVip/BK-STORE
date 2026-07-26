import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
    children: ReactNode;
    /** Direction the element travels from while fading in. */
    direction?: "up" | "down" | "left" | "right" | "none";
    /** Animation delay in milliseconds. */
    delay?: number;
    /** Animation duration in milliseconds. */
    duration?: number;
    className?: string;
    /** Render as a different element if needed. Defaults to div. */
    as?: "div" | "section" | "li" | "article";
}

/**
 * Fades + slides its children into view the first time they enter the viewport.
 * Powered by IntersectionObserver so it stays performant and only animates once.
 */
export function Reveal({
    children,
    direction = "up",
    delay = 0,
    duration = 600,
    className = "",
    as = "div",
}: RevealProps) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        // Respect reduced-motion users: show immediately.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisible(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const hiddenOffset: Record<NonNullable<RevealProps["direction"]>, string> = {
        up: "translate-y-8",
        down: "-translate-y-8",
        left: "translate-x-8",
        right: "-translate-x-8",
        none: "",
    };

    const Tag = as as "div";

    return (
        <Tag
            ref={ref}
            style={{ transitionDelay: `${delay}ms`, transitionDuration: `${duration}ms` }}
            className={cn(
                "transition-all ease-out will-change-transform motion-reduce:transition-none",
                visible ? "translate-x-0 translate-y-0 opacity-100" : cn("opacity-0", hiddenOffset[direction]),
                className,
            )}
        >
            {children}
        </Tag>
    );
}
