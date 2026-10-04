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
            className="relative z-50 w-full overflow-hidden bg-black text-white shadow-md border-b border-neutral-800 select-none"
        >
            <div className="container-bk flex h-11 items-center justify-between gap-1.5 sm:gap-2 text-xs font-semibold overflow-hidden min-w-0">
                {/* Left claim (Desktop) */}
                <div className="hidden lg:flex items-center gap-2 text-neutral-300">
                    <span className="uppercase tracking-wider font-extrabold text-[11px] text-white">
                        LIMITED TIME FLASH SALE
                    </span>
                </div>

                {/* Center Flash Sale & Timer (All Viewports) */}
                <div className="flex flex-1 lg:flex-none items-center justify-center gap-1.5 sm:gap-3 mx-auto lg:mx-0 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span className="font-extrabold uppercase tracking-widest text-white flex items-center gap-1 truncate text-[10px] sm:text-xs">
                            <Flame className="h-4 w-4 fill-white text-white animate-pulse" />
                            {flashSale.sale_title || "LIMITED TIME FLASH SALE"}
                        </span>

                        {/* Live Countdown Clock */}
                        {timeLeft && (
                            <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-bold text-white bg-neutral-900 px-2.5 py-0.5 rounded-md border border-neutral-700 shadow-inner">
                                <span className="w-4 sm:w-5 text-center">{pad(timeLeft.hours)}</span>
                                <span className="animate-pulse text-neutral-400">:</span>
                                <span className="w-4 sm:w-5 text-center">{pad(timeLeft.minutes)}</span>
                                <span className="animate-pulse text-neutral-400">:</span>
                                <span className="w-4 sm:w-5 text-center">{pad(timeLeft.seconds)}</span>
                            </div>
                        )}

                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase text-white tracking-wider shadow-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            LIVE
                        </span>
                    </div>

                    {/* Badge Pill */}
                    <div className="rounded-full bg-white px-2.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-extrabold text-black shadow-md uppercase tracking-wide transition-transform hover:scale-105 shrink-0 whitespace-nowrap">
                        {flashSale.badge_text || `SPECIAL OFFER`}
                    </div>
                </div>

                {/* Right claim (Desktop) */}
                <div className="hidden lg:flex items-center gap-3">
                    <div className="flex items-center gap-1 text-white">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-white text-white" />
                        ))}
                        <span className="text-[10px] text-neutral-300 font-medium ml-1">18M+ Happy Customers</span>
                    </div>
                    <span className="text-neutral-600">•</span>
                    <div className="flex items-center gap-1.5 text-neutral-300">
                        <Award className="h-3.5 w-3.5 text-white" />
                        <span className="uppercase tracking-wider font-medium text-[11px]">FREE EXPRESS DELIVERY</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
