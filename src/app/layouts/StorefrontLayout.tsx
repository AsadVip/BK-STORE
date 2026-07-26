import { Outlet, ScrollRestoration } from "react-router-dom";
import { FlashSaleBar } from "@/components/storefront/flash-sale-bar";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { PromoBanner } from "@/components/storefront/promo-banner";
import { useBanners } from "@/features/catalog/api";

export function StorefrontLayout() {
    const { data: siteWideBanners } = useBanners("site_wide");

    return (
        <div className="flex min-h-screen flex-col bg-bg-primary">
            <FlashSaleBar />
            <Header />
            {siteWideBanners && siteWideBanners.length > 0 && (
                <div className="container-bk pt-6">
                    <PromoBanner banner={siteWideBanners[0]} variant="compact" />
                </div>
            )}
            <main id="main-content" className="flex-1">
                <Outlet />
            </main>
            <Footer />
            
            {/* WhatsApp Floating Button */}
            <a
                href="https://wa.me/923286870670"
                target="_blank"
                rel="noopener noreferrer"
                title="Chat on WhatsApp (0328 6870670)"
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:shadow-2xl animate-bounce"
                style={{ animationDuration: '3s' }}
                aria-label="Chat on WhatsApp"
            >
                <svg
                    className="h-7 w-7 fill-current"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.758.459 3.474 1.33 4.982L2 22l5.166-1.338a9.953 9.953 0 004.842 1.258h.004c5.507 0 9.99-4.478 9.99-9.984A9.925 9.925 0 0019.08 4.92 9.924 9.924 0 0012.012 2zm5.82 14.364c-.244.686-1.42 1.309-1.956 1.385-.494.07-.138.293-.82.073-.414-.13-1.455-.493-2.775-1.67-.103-.918-2.28-3.92-2.28-5.32 0-1.4.733-2.09 1.025-2.378.293-.288.636-.36.85-.36.213 0 .426.002.61.01.196.008.463-.075.725.556.27.649.918 2.24.998 2.404.08.164.133.356.026.57-.106.214-.16.347-.32.535-.16.188-.337.42-.48.563-.16.16-.328.334-.14.656.188.322.836 1.378 1.792 2.23 1.228 1.094 2.264 1.433 2.584 1.593.32.16.507.133.693-.08.187-.213.801-.933 1.014-1.253.213-.32.427-.267.72-.16.293.107 1.868.88 2.188 1.04.32.16.533.24.613.373.08.134.08.774-.164 1.46z" />
                </svg>
            </a>
            
            <ScrollRestoration />
        </div>
    );
}
