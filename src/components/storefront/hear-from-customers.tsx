import { useState } from "react";
import { motion } from "framer-motion";
import { Star, CheckCircle } from "lucide-react";

interface CustomerStory {
    id: string;
    image: string;
    name: string;
    chatText: string;
    rating: number;
    tag: string;
}

const CUSTOMER_STORIES: CustomerStory[] = [
    {
        id: "cs-1",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
        name: "Rolex Automatic Buyer",
        chatText: "Today i receive the watch. Watch quality is excellent and well packed. Watch is same as shown. Excellent qualityyy 🥰🥰",
        rating: 5,
        tag: "BK Store • Verified Buyer",
    },
    {
        id: "cs-2",
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80",
        name: "Tissot Chronograph",
        chatText: "I recently received my new watch, and it turned out to be excellent. The design is elegant, the build quality feels premium, and it fits perfectly on my wrist.",
        rating: 5,
        tag: "BK Store • Verified Buyer",
    },
    {
        id: "cs-3",
        image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80",
        name: "Audemars Royal Oak",
        chatText: "Received my order ❤️ It's my first experience with you guys and Alhamdulillah I love it. Premium Packaging & fast shipping!",
        rating: 5,
        tag: "BK Store • Verified Buyer",
    },
    {
        id: "cs-4",
        image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&auto=format&fit=crop&q=80",
        name: "Black Dial Edition",
        chatText: "I received the parcel and that to good mashallah. And thank you for fast COD delivery to Lahore!",
        rating: 5,
        tag: "BK Store • Verified Buyer",
    },
    {
        id: "cs-5",
        image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&auto=format&fit=crop&q=80",
        name: "Multi-Watch Parcel",
        chatText: "Thank you boss parcel is received very good and nice quality... delivering it safe insha'Allah I'll buy more watches from you ❤️",
        rating: 5,
        tag: "BK Store • Verified Buyer",
    },
];

export function HearFromCustomers() {
    const [isHovered, setIsHovered] = useState(false);
    // Duplicate 3 sets for seamless continuous sliding across all screen resolutions
    const duplicatedStories = [...CUSTOMER_STORIES, ...CUSTOMER_STORIES, ...CUSTOMER_STORIES];

    return (
        <section className="py-16 sm:py-20 bg-bg-secondary/40 border-y border-border/60 overflow-hidden relative">
            <div className="container-bk">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3"
                >
                    {/* Stars bar */}
                    <div className="flex items-center justify-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                    </div>

                    <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                        Hear From Our Happy Customers
                    </h2>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                        Real customers share why BK Store has become their favorite brand to shop from.
                    </p>
                </motion.div>
            </div>

            {/* Slider Marquee Container with Gradient Edge Overlays */}
            <div
                className="relative w-full overflow-hidden py-3"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Side Fade Gradients */}
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-32 bg-gradient-to-r from-bg-secondary/90 via-bg-secondary/50 to-transparent z-10" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-32 bg-gradient-to-l from-bg-secondary/90 via-bg-secondary/50 to-transparent z-10" />

                {/* Framer Motion Continuous Loop Track */}
                <motion.div
                    className="flex items-stretch gap-6 w-max"
                    animate={isHovered ? {} : { x: ["0%", "-33.3333%"] }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 22,
                            ease: "linear",
                        },
                    }}
                >
                    {duplicatedStories.map((story, i) => (
                        <div
                            key={`${story.id}-${i}`}
                            className="w-[280px] sm:w-[320px] shrink-0 rounded-3xl border border-border bg-bg-primary p-4 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group/card cursor-pointer"
                        >
                            <div className="space-y-3">
                                {/* Image Box */}
                                <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl border border-border/60 bg-black/90 group">
                                    <img
                                        src={story.image}
                                        alt={story.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
                                    />
                                    {/* Overlay WhatsApp Chat Bubble */}
                                    <div className="absolute inset-x-3 bottom-3 rounded-xl bg-black/85 backdrop-blur-md p-3 text-white border border-white/10 shadow-lg">
                                        <p className="text-xs leading-snug font-medium line-clamp-4">
                                            "{story.chatText}"
                                        </p>
                                    </div>
                                </div>

                                {/* Rating & Buyer Badge */}
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-0.5 text-amber-400">
                                            {Array.from({ length: story.rating }).map((_, idx) => (
                                                <Star key={idx} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" /> Verified
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-text-primary block truncate">
                                        {story.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}


