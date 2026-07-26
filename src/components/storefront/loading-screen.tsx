import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Full-screen branded luxury splash screen shown on first app load.
 * Fades out smoothly after initial load and unmounts itself.
 */
export function LoadingScreen() {
    const [hidden, setHidden] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const fadeTimer = setTimeout(() => setHidden(true), 1400);
        const removeTimer = setTimeout(() => setDone(true), 2100);
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    if (done) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF8F5] transition-all duration-700 ease-out",
                hidden ? "pointer-events-none opacity-0 scale-105" : "opacity-100 scale-100",
            )}
            role="status"
            aria-label="Loading BK Store"
        >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-[#8B5E4B]/15 via-[#6B4A3D]/5 to-transparent blur-3xl" />
            </div>

            <div className="relative flex flex-col items-center z-10 px-4">
                {/* Luxury Logo Mark */}
                <div className="relative flex h-24 w-24 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8B5E4B]/20 duration-1000" />
                    <img
                        src="/logo.png"
                        alt="BK Store Logo"
                        className="relative h-20 w-auto object-contain drop-shadow-2xl animate-pulse"
                    />
                    <Sparkles className="absolute top-2 right-2 h-4 w-4 text-[#8B5E4B] animate-bounce" />
                </div>

                {/* Brand Name & Tagline */}
                <div className="mt-6 text-center">
                    <h1 className="font-serif text-3xl font-extrabold tracking-tight text-[#1A1A1A]">
                        BK STORE<span className="text-[#8B5E4B]">.</span>
                    </h1>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#5C5C5C]">
                        Watches, Earbuds & Shoes Collection
                    </p>
                </div>

                {/* Shimmering Progress Bar */}
                <div className="mt-8 h-1 w-56 overflow-hidden rounded-full bg-[#EAE5DF] shadow-inner">
                    <div className="h-full w-2/5 animate-[loadingbar_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#8B5E4B] via-[#A46C56] to-[#8B5E4B] shadow-sm" />
                </div>
            </div>
        </div>
    );
}
