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
        <section className="py-12 sm:py-20 bg-bg-secondary/40 border-y border-border/60 overflow-hidden relative w-full max-w-[100vw]">
            <div className="container-bk mb-6 sm:mb-12 text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
                {/* Stars rating bar */}
                <div className="flex items-center justify-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-400 text-amber-400 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                </div>

                <h2 className="font-serif text-xl sm:text-4xl font-extrabold text-text-primary tracking-tight flex items-center justify-center gap-2">
                    <MessageCircle className="h-5 w-5 sm:h-7 sm:w-7 text-emerald-500" />
                    Real WhatsApp Customer Reviews
                </h2>
                <p className="text-[11px] sm:text-sm text-text-secondary leading-relaxed">
                    Authentic customer feedback and parcel delivery confirmations directly from our official WhatsApp support.
                </p>
            </div>

            {/* Continuous Marquee Slider (Clean edges, no blurry overlay, no hover pause) */}
            <div className="relative w-full overflow-hidden py-2">
                <motion.div
                    className="flex items-center gap-3.5 sm:gap-6 w-max"
                    animate={{ x: ["0%", "-33.3333%"] }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 28,
                            ease: "linear",
                        },
                    }}
                >
                    {duplicatedStories.map((story, i) => (
                        <div
                            key={`${story.id}-${i}`}
                            className="w-[190px] sm:w-[290px] md:w-[320px] shrink-0 rounded-2xl sm:rounded-3xl border border-border/80 bg-bg-primary p-2 sm:p-4 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                        >
                            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl sm:rounded-2xl border border-border/60 bg-black/95 flex items-center justify-center">
                                <img
                                    src={story.image}
                                    alt={story.title}
                                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute top-2 right-2 rounded-full bg-emerald-600/90 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 shadow-md flex items-center gap-1 backdrop-blur-xs">
                                    <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> WhatsApp Verified
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
