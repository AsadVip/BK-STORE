import { Link } from "react-router-dom";
import { Instagram, Facebook, ShieldCheck, Banknote, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useBanners } from "@/features/catalog/api";
import { PromoBanner } from "@/components/storefront/promo-banner";
import { BkLogo } from "@/components/ui/bk-logo";

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64c.29 0 .56.04.82.12V9.4a6.27 6.27 0 00-1-.08A6.34 6.34 0 003 15.66a6.34 6.34 0 0010.86 4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.52z" />
        </svg>
    );
}

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.758.459 3.474 1.33 4.982L2 22l5.166-1.338a9.953 9.953 0 004.842 1.258h.004c5.507 0 9.99-4.478 9.99-9.984A9.925 9.925 0 0019.08 4.92 9.924 9.924 0 0012.012 2zm5.82 14.364c-.244.686-1.42 1.309-1.956 1.385-.494.07-.138.293-.82.073-.414-.13-1.455-.493-2.775-1.67-.103-.918-2.28-3.92-2.28-5.32 0-1.4.733-2.09 1.025-2.378.293-.288.636-.36.85-.36.213 0 .426.002.61.01.196.008.463-.075.725.556.27.649.918 2.24.998 2.404.08.164.133.356.026.57-.106.214-.16.347-.32.535-.16.188-.337.42-.48.563-.16.16-.328.334-.14.656.188.322.836 1.378 1.792 2.23 1.228 1.094 2.264 1.433 2.584 1.593.32.16.507.133.693-.08.187-.213.801-.933 1.014-1.253.213-.32.427-.267.72-.16.293.107 1.868.88 2.188 1.04.32.16.533.24.613.373.08.134.08.774-.164 1.46z" />
        </svg>
    );
}

const SHOP_LINKS = [
    { label: "All Products", to: "/shop" },
    { label: "Categories", to: "/categories" },
    { label: "Wishlist", to: "/wishlist" },
    { label: "Cart", to: "/cart" },
];

const SERVICE_LINKS = [
    { label: "FAQ", to: "/faq" },
    { label: "Contact Us", to: "/contact" },
    { label: "Shipping Policy", to: "/shipping-policy" },
    { label: "Return Policy", to: "/return-policy" },
];

const LEGAL_LINKS = [
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms & Conditions", to: "/terms" },
];

export function Footer() {
    const { toast } = useToast();
    const { data: footerBanners } = useBanners("footer");

    const onSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: "Subscribed!", description: "You're on the list. Welcome to BK Store." });
        (e.target as HTMLFormElement).reset();
    };

    return (
        <footer className="mt-24 border-t border-border/60 bg-bg-secondary text-text-secondary">
            {footerBanners && footerBanners.length > 0 && (
                <div className="container-bk pt-8">
                    <PromoBanner banner={footerBanners[0]} variant="compact" />
                </div>
            )}
            <div className="container-bk py-16">
                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand + social + Contact */}
                    <div className="space-y-4">
                        <Link to="/">
                            <BkLogo size="md" variant="full" />
                        </Link>
                        <p className="text-sm leading-relaxed text-text-secondary">
                            A boutique-grade shopping experience — curated for quality and crafted for living.
                        </p>

                        {/* Social Media Links */}
                        <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                            <a
                                href="https://www.facebook.com/share/1DNBpccQJ1/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Facebook"
                                title="Facebook Page"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-primary text-text-secondary transition-all hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] hover:scale-105"
                            >
                                <Facebook className="h-4 w-4" />
                            </a>
                            <a
                                href="https://www.instagram.com/bkstore.hub?igsh=am9tZGNzOHlicHdu"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                title="Instagram @bkstore.hub"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-primary text-text-secondary transition-all hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white hover:border-transparent hover:scale-105"
                            >
                                <Instagram className="h-4 w-4" />
                            </a>
                            <a
                                href="https://tiktok.com/@bkstore.hub"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="TikTok"
                                title="TikTok @bkstore.hub"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-primary text-text-secondary transition-all hover:bg-black hover:text-white hover:border-black dark:hover:bg-white dark:hover:text-black hover:scale-105"
                            >
                                <TikTokIcon className="h-4 w-4" />
                            </a>
                            <a
                                href="https://wa.me/923286870670"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="WhatsApp"
                                title="WhatsApp 03286870670"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-primary text-text-secondary transition-all hover:bg-[#25D366] hover:text-white hover:border-[#25D366] hover:scale-105"
                            >
                                <WhatsAppIcon className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    {/* Shop links */}
                    <div>
                        <h4 className="mb-4 font-sans text-xs font-bold uppercase tracking-wider text-text-primary">Quick Navigation</h4>
                        <ul className="space-y-2.5">
                            {SHOP_LINKS.map((l) => (
                                <li key={l.to}>
                                    <Link to={l.to} className="text-sm transition-colors hover:text-text-primary">{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact & Support */}
                    <div>
                        <h4 className="mb-4 font-sans text-xs font-bold uppercase tracking-wider text-text-primary">Contact & Support</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2.5">
                                <Phone className="h-4 w-4 text-btn-primary shrink-0 mt-0.5" />
                                <div>
                                    <span className="block text-xs font-semibold text-text-primary">Call / WhatsApp</span>
                                    <a href="tel:03286870670" className="hover:underline hover:text-btn-primary transition-colors font-medium">
                                        0328 6870670
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <WhatsAppIcon className="h-4 w-4 text-[#25D366] shrink-0 mt-0.5" />
                                <div>
                                    <span className="block text-xs font-semibold text-text-primary">WhatsApp Direct</span>
                                    <a href="https://wa.me/923286870670" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#25D366] font-medium">
                                        +92 328 6870670
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <MapPin className="h-4 w-4 text-btn-primary shrink-0 mt-0.5" />
                                <div>
                                    <span className="block text-xs font-semibold text-text-primary">Store Location</span>
                                    <span className="text-xs leading-snug text-text-secondary block">
                                        Al Quresh Phase 2, Sher Shah Road, Multan
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="mb-4 font-sans text-xs font-bold uppercase tracking-wider text-text-primary">Stay Connected</h4>
                        <p className="mb-4 text-sm text-text-secondary">Join our community for curated drops and exclusive offers.</p>
                        <form onSubmit={onSubscribe} className="flex flex-col gap-2.5">
                            <Input type="email" required placeholder="Enter your email" aria-label="Email address" className="bg-bg-primary border-border" />
                            <Button type="submit" size="sm" className="bg-btn-primary text-white hover:bg-btn-primary-hover shadow-sm">
                                Subscribe
                            </Button>
                        </form>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-border/60 pt-8 sm:flex-row sm:justify-between flex-wrap">
                    <div className="flex items-center gap-3 text-xs text-text-secondary text-center">
                        <span>© {new Date().getFullYear()} BK Store. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 text-text-secondary text-xs flex-wrap justify-center">
                        <span className="flex items-center gap-1.5"><Banknote className="h-4 w-4 text-btn-primary shrink-0" /> Cash on Delivery</span>
                        <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-state-success shrink-0" /> Secure Checkout</span>
                    </div>
                    <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
                        {LEGAL_LINKS.map((l) => (
                            <Link key={l.to} to={l.to} className="text-xs transition-colors hover:text-text-primary">{l.label}</Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

