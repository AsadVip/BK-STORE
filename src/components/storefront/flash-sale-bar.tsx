import { useEffect, useState } from "react";
import { Star, Flame, ShieldCheck, RefreshCw, Award } from "lucide-react";
import { useFlashSaleSetting } from "@/features/admin/api";

export function FlashSaleBar() {
    const { data: flashSale } = useFlashSaleSetting();

    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        if (!flashSale?.is_active || !flashSale?.ends_at) return;

        const calculateTime = () => {
            const end = new Date(flashSale.ends_at).getTime();
            const now = Date.now();
            const diff = Math.max(0, Math.floor((end - now) / 1000));

            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            setTimeLeft({ hours, minutes, seconds });
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [flashSale]);

    if (!flashSale?.is_active) return null;

    const pad = (n: number) => String(n).padStart(2, "0");

    return (
        <aside
            role="region"
            aria-label="Flash Sale Announcement"
            className="relative z-50 w-full overflow-hidden bg-gradient-to-r from-[#002610] via-[#01411C] to-[#002610] text-white shadow-md border-b border-[#D4AF37]/35 select-none"
        >
            <div className="container-bk flex h-11 items-center justify-between gap-1.5 sm:gap-2 text-xs font-semibold overflow-hidden min-w-0">
                {/* Left claim (Desktop) */}
                <div className="hidden lg:flex items-center gap-2 text-white/90">
                    <span className="text-sm shrink-0" role="img" aria-label="Pakistan Flag">🇵🇰</span>
                    <span className="uppercase tracking-wider font-extrabold text-[11px] text-[#D4AF37]">
                        14TH AUGUST AZADI SALE
                    </span>
                    <span className="text-[#D4AF37]/50">•</span>
                    <span className="text-white/90 font-bold bg-[#D4AF37]/20 px-2 py-0.5 rounded border border-[#D4AF37]/40 text-[10px]">
                        CODE: AZADI14
                    </span>
                </div>

                {/* Center Flash Sale & Timer (All Viewports) */}
                <div className="flex flex-1 lg:flex-none items-center justify-center gap-1.5 sm:gap-3 mx-auto lg:mx-0 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span className="text-sm sm:text-base shrink-0" role="img" aria-label="Pakistan Flag">🇵🇰</span>
                        <span className="font-extrabold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1 truncate text-[10px] sm:text-xs">
                            <Flame className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37] animate-pulse" />
                            {flashSale.sale_title || "14TH AUGUST AZADI SALE"}
                        </span>

                        {/* Live Countdown Clock */}
                        {timeLeft && (
                            <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-bold text-white bg-black/40 px-2 py-0.5 rounded-md border border-[#D4AF37]/30 shadow-inner">
                                <span className="w-4 sm:w-5 text-center">{pad(timeLeft.hours)}</span>
                                <span className="animate-pulse text-[#D4AF37]">:</span>
                                <span className="w-4 sm:w-5 text-center">{pad(timeLeft.minutes)}</span>
                                <span className="animate-pulse text-[#D4AF37]">:</span>
                                <span className="w-4 sm:w-5 text-center">{pad(timeLeft.seconds)}</span>
                            </div>
                        )}

                        <span className="hidden sm:inline-block rounded-full bg-[#D4AF37] px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase text-[#01411C] tracking-wider shadow-xs">
                            LIVE
                        </span>
                    </div>

                    {/* Badge Pill */}
                    <div className="rounded-full bg-[#D4AF37] px-2.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-extrabold text-[#01411C] shadow-md uppercase tracking-wide transition-transform hover:scale-105 shrink-0 whitespace-nowrap border border-white/20">
                        {flashSale.badge_text || `EXTRA 14% OFF — CODE: AZADI14`}
                    </div>
                </div>

                {/* Right claim (Desktop) */}
                <div className="hidden lg:flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[#D4AF37]">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-[#D4AF37] text-[#D4AF37]" />
                        ))}
                        <span className="text-[10px] text-white/90 font-medium ml-1">18M+ Happy Customers</span>
                    </div>
                    <span className="text-[#D4AF37]/50">•</span>
                    <div className="flex items-center gap-1.5 text-white/90">
                        <Award className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span className="uppercase tracking-wider font-medium text-[11px]">FREE EXPRESS DELIVERY</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
