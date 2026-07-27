import { useState } from "react";
import { Star, CheckCircle, Quote, ThumbsUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface ReviewItem {
    id: string;
    author: string;
    location: string;
    avatar: string;
    rating: number;
    title: string;
    content: string;
    productName: string;
    productCategory: "watch" | "sneaker";
    date: string;
    verified: boolean;
    likes: number;
}

const REVIEWS_DATA: ReviewItem[] = [
    {
        id: "r1",
        author: "Harrison Vance",
        location: "New York, NY",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        rating: 5,
        title: "Absolute Perfection & 100% Authentic",
        content: "Ordered the Rolex Submariner Date. Packaging was boutique-grade, shipping took only 2 days, and the watch condition exceeded expectations. BK Store is now my go-to luxury dealer!",
        productName: "Rolex Submariner Date 41mm",
        productCategory: "watch",
        date: "July 18, 2026",
        verified: true,
        likes: 34,
    },
    {
        id: "r2",
        author: "Marcus Chen",
        location: "Los Angeles, CA",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        rating: 5,
        title: "Cleanest Kicks in My Collection",
        content: "Copped the Jordan 1 Retro High OG Lost & Found. Deadstock condition, verified authentic tags, and fast insured delivery. 10/10 service!",
        productName: "Air Jordan 1 High OG 'Lost & Found'",
        productCategory: "sneaker",
        date: "July 12, 2026",
        verified: true,
        likes: 29,
    },
    {
        id: "r3",
        author: "Sophia Sterling",
        location: "Miami, FL",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        rating: 5,
        title: "Timeless Elegance & Smooth Checkout",
        content: "Bought the Omega Speedmaster Professional for my husband's anniversary. Cash on delivery process was seamless and white-glove smooth.",
        productName: "Omega Speedmaster Master Chronometer",
        productCategory: "watch",
        date: "June 29, 2026",
        verified: true,
        likes: 42,
    },
    {
        id: "r4",
        author: "Liam O'Connor",
        location: "Chicago, IL",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        rating: 5,
        title: "Unbeatable Price for Premium Sneakers",
        content: "Yeezy Boost 350 V2 Onyx arrived in immaculate condition with original retail box. Customer support answered my questions in minutes.",
        productName: "Yeezy Boost 350 V2 'Onyx'",
        productCategory: "sneaker",
        date: "June 15, 2026",
        verified: true,
        likes: 18,
    },
];

export function CustomerReviews() {
    const [filter, setFilter] = useState<"all" | "watch" | "sneaker">("all");
    const [likesMap, setLikesMap] = useState<Record<string, number>>({});
    const { toast } = useToast();

    const filtered = REVIEWS_DATA.filter(
        (r) => filter === "all" || r.productCategory === filter,
    );

    const handleLike = (id: string, initialLikes: number) => {
        const current = likesMap[id] ?? initialLikes;
        setLikesMap((prev) => ({ ...prev, [id]: current + 1 }));
        toast({ title: "Helpful vote recorded!", description: "Thank you for feedback." });
    };

    return (
        <section className="py-20 bg-bg-secondary/60 border-y border-border/60">
            <div className="container-bk">
                {/* Header */}
                <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-btn-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-btn-primary mb-3">
                        <Sparkles className="h-3.5 w-3.5" /> Verified Customer Feedback
                    </span>
                    <h2 className="font-serif text-3xl font-extrabold sm:text-4xl text-text-primary tracking-tight">
                        Loved by Watch Enthusiasts & Sneakerheads
                    </h2>
                    <p className="mt-3 text-text-secondary text-sm sm:text-base">
                        Over 4,800+ 5-star reviews from verified buyers across the globe.
                    </p>

                    {/* Filters */}
                    <div className="mt-6 flex items-center gap-2 p-1.5 rounded-full bg-bg-primary border border-border shadow-sm flex-wrap justify-center sm:flex-nowrap">
                        <button
                            onClick={() => setFilter("all")}
                            className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                                filter === "all"
                                    ? "bg-btn-primary text-white shadow-md"
                                    : "text-text-secondary hover:text-text-primary"
                            }`}
                        >
                            All Reviews ({REVIEWS_DATA.length})
                        </button>
                        <button
                            onClick={() => setFilter("watch")}
                            className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                                filter === "watch"
                                    ? "bg-btn-primary text-white shadow-md"
                                    : "text-text-secondary hover:text-text-primary"
                            }`}
                        >
                            Luxury Watches ⌚
                        </button>
                        <button
                            onClick={() => setFilter("sneaker")}
                            className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                                filter === "sneaker"
                                    ? "bg-btn-primary text-white shadow-md"
                                    : "text-text-secondary hover:text-text-primary"
                            }`}
                        >
                            Premium Shoes 👟
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((rev) => (
                            <motion.div
                                key={rev.id}
                                layout
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col justify-between rounded-3xl border border-border/80 bg-bg-primary p-6 shadow-sm hover:shadow-md transition-all"
                            >
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={rev.avatar}
                                                alt={rev.author}
                                                className="h-12 w-12 rounded-full object-cover ring-2 ring-btn-primary/20"
                                            />
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-sans font-bold text-text-primary text-base">
                                                        {rev.author}
                                                    </h4>
                                                    {rev.verified && (
                                                        <span className="flex items-center text-[10px] font-bold text-state-success gap-0.5">
                                                            <CheckCircle className="h-3 w-3 fill-state-success text-white" /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-text-secondary">{rev.location} • {rev.date}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-0.5 text-amber-500">
                                            {Array.from({ length: rev.rating }).map((_, i) => (
                                                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                            ))}
                                        </div>
                                    </div>

                                    <Badge className="mb-3 bg-bg-secondary text-btn-primary hover:bg-bg-secondary border-0 font-medium">
                                        {rev.productName}
                                    </Badge>

                                    <h5 className="font-serif font-bold text-lg text-text-primary mb-2">
                                        "{rev.title}"
                                    </h5>
                                    <p className="text-sm leading-relaxed text-text-secondary font-normal">
                                        {rev.content}
                                    </p>
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Quote className="h-3.5 w-3.5 text-btn-primary" /> Verified Purchase
                                    </span>
                                    <button
                                        onClick={() => handleLike(rev.id, rev.likes)}
                                        className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-btn-primary transition-colors"
                                    >
                                        <ThumbsUp className="h-3.5 w-3.5" />
                                        <span>Helpful ({likesMap[rev.id] ?? rev.likes})</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
