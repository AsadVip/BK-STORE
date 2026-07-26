import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Banner } from "@/features/catalog/api";

interface PromoBannerProps {
    banner: Banner;
    /** Visual size variant for the banner. */
    variant?: "default" | "compact";
    className?: string;
}

/**
 * Renders a single promotional banner with image background, optional text overlay,
 * and optional CTA button linking to `link_url`.
 */
export function PromoBanner({ banner, variant = "default", className = "" }: PromoBannerProps) {
    const heightClass = variant === "compact" ? "min-h-[200px]" : "min-h-[320px]";
    const link = banner.link_url ?? "#";
    const isInternal = link.startsWith("/") || link === "#";

    const content = (
        <div className={`relative overflow-hidden rounded-2xl bg-bg-secondary ${heightClass} ${className}`}>
            {banner.image_url ? (
                <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-btn-primary/20 via-bg-secondary to-bg-primary" />
            )}
            <div className="absolute inset-0 bg-black/30" />
            <div className="container-bk relative flex h-full flex-col items-center justify-center text-center">
                {banner.text_overlay && (
                    <h3 className="max-w-2xl font-serif text-2xl font-semibold text-white sm:text-3xl">
                        {banner.text_overlay}
                    </h3>
                )}
                {banner.cta_label && (
                    <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-text-primary shadow-lg transition-transform hover:scale-105">
                        {banner.cta_label} <ArrowRight className="h-4 w-4" />
                    </span>
                )}
            </div>
        </div>
    );

    if (!banner.link_url) {
        return content;
    }

    return isInternal ? (
        <Link to={link}>{content}</Link>
    ) : (
        <a href={link} target="_blank" rel="noreferrer">
            {content}
        </a>
    );
}
