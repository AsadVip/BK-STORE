import { motion } from "framer-motion";
import { Star, CheckCircle, MessageCircle } from "lucide-react";

interface WhatsAppReview {
    id: string;
    image: string;
    title: string;
}

const WHATSAPP_REVIEWS: WhatsAppReview[] = [
    { id: "wa-1", image: "/reviews/Capture.PNG", title: "Real WhatsApp Customer Feedback 1" },
    { id: "wa-2", image: "/reviews/Capture1.PNG", title: "Real WhatsApp Customer Feedback 2" },
    { id: "wa-3", image: "/reviews/Capture2.PNG", title: "Real WhatsApp Customer Feedback 3" },
    { id: "wa-4", image: "/reviews/Capture3.PNG", title: "Real WhatsApp Customer Feedback 4" },
    { id: "wa-5", image: "/reviews/Capture.4PNG.PNG", title: "Real WhatsApp Customer Feedback 5" },
    { id: "wa-6", image: "/reviews/Capture5.PNG", title: "Real WhatsApp Customer Feedback 6" },
];

export function HearFromCustomers() {
    // Duplicate 3 times to ensure infinite smooth seamless looping across screen sizes
    const duplicatedStories = [...WHATSAPP_REVIEWS, ...WHATSAPP_REVIEWS, ...WHATSAPP_REVIEWS];

    return (
        <section className="py-16 sm:py-24 bg-neutral-50/60 border-y border-neutral-200/80 overflow-hidden relative w-full max-w-[100vw]">
            <div className="container-bk mb-8 sm:mb-14 text-center max-w-2xl mx-auto space-y-3">
                {/* Stars rating bar */}
                <div className="flex items-center justify-center gap-1 text-black">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-black text-black animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 border border-neutral-200 px-4 py-1 text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Verified Customer Voice
                </div>

                <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight flex items-center justify-center gap-2.5">
                    <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-black" />
                    Real WhatsApp Customer Reviews
                </h2>
                <p className="text-xs sm:text-base text-text-secondary leading-relaxed max-w-xl mx-auto font-medium">
                    Authentic customer feedback and parcel delivery confirmations directly from our official WhatsApp support channel.
                </p>
            </div>

            {/* Continuous Marquee Slider (GPU Hardware-Accelerated) */}
            <div className="relative w-full overflow-hidden py-3">
                <div className="flex items-center gap-4 sm:gap-6 w-max animate-marquee-reviews">
                    {duplicatedStories.map((story, i) => (
                        <div
                            key={`${story.id}-${i}`}
                            className="w-[200px] sm:w-[300px] md:w-[330px] shrink-0 rounded-2xl sm:rounded-3xl border border-neutral-200 bg-white p-2.5 sm:p-4 shadow-sm hover:shadow-xl hover:border-black transition-[border-color,box-shadow] duration-300 flex flex-col justify-between group"
                        >
                            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl sm:rounded-2xl border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                                <img
                                    src={story.image}
                                    alt={story.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute top-2.5 right-2.5 rounded-full bg-black text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 shadow-md flex items-center gap-1 border border-black">
                                    <CheckCircle className="h-3 w-3 text-emerald-400" /> WhatsApp Verified
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
