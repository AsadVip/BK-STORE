import { useEffect } from "react";

export interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    canonicalPath?: string;
    image?: string;
    type?: "website" | "article" | "product";
    schema?: Record<string, unknown> | null;
}

const SITE_URL = "https://bktajir.com";
const DEFAULT_BRAND_TITLE = "BK Store — BK Tajir (bktajir.com)";
const DEFAULT_DESCRIPTION =
    "BK Store (Official BK Tajir at bktajir.com) — Pakistan's #1 online luxury store for original luxury watches, wireless earbuds & premium shoes. Cash on Delivery nationwide. Fast shipping across Pakistan.";
const DEFAULT_KEYWORDS =
    "bk store, bk tajir, bktajir, bktajir.com, BK Store, BK Tajir, bk store pakistan, bk tajir pakistan, bk store online, bk tajir store, bk tajir online, bk store watches, bk tajir watches, bk watches, luxury watches pakistan, earbuds pakistan, wireless earbuds, buy watches online pakistan, rolex pakistan, hublot pakistan, tissot pakistan, original watches, premium shoes pakistan, online shopping pakistan, cod watches pakistan, best watch store pakistan, authentic watches pakistan, bk shoes";
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

function setMetaTag(selector: string, attr: string, value: string, createTag: () => HTMLElement) {
    let el = document.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
    if (!el) {
        el = createTag() as HTMLMetaElement | HTMLLinkElement;
        document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
}

/**
 * useSEO: Dynamic client-side SEO hook for BK Store (bktajir.com)
 * Sets titles, meta descriptions, canonical URLs, OG tags, and rich schema markup.
 */
export function useSEO({
    title,
    description,
    keywords,
    canonicalPath,
    image,
    type = "website",
    schema,
}: SEOProps) {
    useEffect(() => {
        // 1. Document Title
        let formattedTitle = DEFAULT_BRAND_TITLE;
        if (title) {
            if (title.includes("BK Store") || title.includes("BK Tajir") || title.includes("bktajir.com")) {
                formattedTitle = title;
            } else {
                formattedTitle = `${title} | BK Store — BK Tajir (bktajir.com)`;
            }
        }
        document.title = formattedTitle;

        // 2. Canonical URL
        const canonicalUrl = canonicalPath
            ? `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`
            : `${SITE_URL}${window.location.pathname}`;

        let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!canonicalLink) {
            canonicalLink = document.createElement("link");
            canonicalLink.rel = "canonical";
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.href = canonicalUrl;

        // 3. Meta Description
        const descContent = description || DEFAULT_DESCRIPTION;
        setMetaTag('meta[name="description"]', "content", descContent, () => {
            const m = document.createElement("meta");
            m.name = "description";
            return m;
        });

        // 4. Meta Keywords
        const kwContent = keywords || DEFAULT_KEYWORDS;
        setMetaTag('meta[name="keywords"]', "content", kwContent, () => {
            const m = document.createElement("meta");
            m.name = "keywords";
            return m;
        });

        // 5. Open Graph Meta Tags
        setMetaTag('meta[property="og:title"]', "content", formattedTitle, () => {
            const m = document.createElement("meta");
            m.setAttribute("property", "og:title");
            return m;
        });
        setMetaTag('meta[property="og:description"]', "content", descContent, () => {
            const m = document.createElement("meta");
            m.setAttribute("property", "og:description");
            return m;
        });
        setMetaTag('meta[property="og:url"]', "content", canonicalUrl, () => {
            const m = document.createElement("meta");
            m.setAttribute("property", "og:url");
            return m;
        });
        setMetaTag('meta[property="og:type"]', "content", type, () => {
            const m = document.createElement("meta");
            m.setAttribute("property", "og:type");
            return m;
        });
        setMetaTag('meta[property="og:image"]', "content", image || DEFAULT_IMAGE, () => {
            const m = document.createElement("meta");
            m.setAttribute("property", "og:image");
            return m;
        });

        // 6. Twitter Meta Tags
        setMetaTag('meta[name="twitter:title"]', "content", formattedTitle, () => {
            const m = document.createElement("meta");
            m.name = "twitter:title";
            return m;
        });
        setMetaTag('meta[name="twitter:description"]', "content", descContent, () => {
            const m = document.createElement("meta");
            m.name = "twitter:description";
            return m;
        });
        setMetaTag('meta[name="twitter:url"]', "content", canonicalUrl, () => {
            const m = document.createElement("meta");
            m.name = "twitter:url";
            return m;
        });
        setMetaTag('meta[name="twitter:image"]', "content", image || DEFAULT_IMAGE, () => {
            const m = document.createElement("meta");
            m.name = "twitter:image";
            return m;
        });

        // 7. Dynamic JSON-LD Schema (e.g., Product / Article)
        const SCHEMA_ID = "dynamic-page-schema";
        const existingSchema = document.getElementById(SCHEMA_ID);
        if (existingSchema) {
            existingSchema.remove();
        }

        if (schema) {
            const script = document.createElement("script");
            script.id = SCHEMA_ID;
            script.type = "application/ld+json";
            script.textContent = JSON.stringify(schema);
            document.head.appendChild(script);
        }

        return () => {
            const s = document.getElementById(SCHEMA_ID);
            if (s) s.remove();
        };
    }, [title, description, keywords, canonicalPath, image, type, schema]);
}
