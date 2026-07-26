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
            className="relative z-50 w-full overflow-hidden bg-gradient-to-r from-[#7A0000] via-[#A81818] to-[#7A0000] text-white shadow-md border-b border-red-950/40 select-none"
        >
            <div className="container-bk flex h-11 items-center justify-between gap-2 text-xs font-semibold">
                {/* Left claim (Desktop) */}
                <div className="hidden lg:flex items-center gap-2 text-white/90">
                    <RefreshCw className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                    <span className="uppercase tracking-wider font-medium text-[11px]">
                        30 DAYS HASSLE-FREE RETURNS
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/80 font-normal">Easy Refund & Exchange</span>
                </div>

                {/* Center Flash Sale & Timer (All Viewports) */}
                <div className="flex flex-1 lg:flex-none items-center justify-center gap-3 mx-auto lg:mx-0">
                    {/* Trust stars sub-line on mobile */}
                    <div className="flex items-center gap-2">
                        <span className="font-extrabold uppercase tracking-widest text-amber-200 flex items-center gap-1">
                            <Flame className="h-4 w-4 fill-amber-300 text-amber-300 animate-pulse" />
                            {flashSale.sale_title || "SALE"}
                        </span>

                        {/* Live Countdown Clock */}
                        {timeLeft && (
                            <div className="flex items-center gap-1 font-mono text-sm font-bold text-white bg-black/30 px-2 py-0.5 rounded-md border border-white/10">
                                <span className="w-5 text-center">{pad(timeLeft.hours)}</span>
                                <span className="animate-pulse text-amber-300">:</span>
                                <span className="w-5 text-center">{pad(timeLeft.minutes)}</span>
                                <span className="animate-pulse text-amber-300">:</span>
                                <span className="w-5 text-center">{pad(timeLeft.seconds)}</span>
                            </div>
                        )}

                        <span className="hidden sm:inline-block rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-black uppercase text-red-950 tracking-wider">
                            LIVE
                        </span>
                    </div>

                    {/* Badge Pill */}
                    <div className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#A81818] shadow-sm uppercase tracking-wide transition-transform hover:scale-105">
                        {flashSale.badge_text || `Upto ${flashSale.discount_percentage}% OFF`}
                    </div>
                </div>

                {/* Right claim (Desktop) */}
                <div className="hidden lg:flex items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-300">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-300 text-amber-300" />
                        ))}
                        <span className="text-[10px] text-white/90 font-medium ml-1">18M+ Customers</span>
                    </div>
                    <span className="text-white/40">•</span>
                    <div className="flex items-center gap-1.5 text-white/90">
                        <Award className="h-3.5 w-3.5 text-amber-300" />
                        <span className="uppercase tracking-wider font-medium text-[11px]">1 YEAR WARRANTY</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
