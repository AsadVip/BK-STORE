import { motion } from "framer-motion";
import { Check, Watch } from "lucide-react";

const COMPARISON_FEATURES = [
    {
        feature: "Premium stainless steel & leather straps",
        bkStore: true,
        others: false,
    },
    {
        feature: "Scratch-resistant glass",
        bkStore: true,
        others: false,
    },
    {
        feature: "Water-resistant design",
        bkStore: true,
        others: false,
    },
    {
        feature: "Luxury look at affordable price",
        bkStore: true,
        others: false,
    },
    {
        feature: "Fast delivery & Cash on Delivery",
        bkStore: true,
        others: false,
    },
    {
        feature: "100% Authentic quality guarantee",
        bkStore: true,
        others: false,
    },
];

export function WhyChooseUsComparison() {
    return (
        <section className="py-10 sm:py-16">
            <div className="container-bk max-w-4xl px-3 sm:px-6">
                {/* Heading Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-6 sm:mb-10 space-y-2"
                >
                    <h2 className="font-serif text-xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                        Why People Choose BK Store Pakistan
                    </h2>
                    <div className="inline-flex items-center gap-2 text-[10px] sm:text-sm font-bold uppercase tracking-widest text-text-secondary pt-0.5">
                        <span>BK STORE</span>
                        <Watch className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-btn-primary" />
                        <span>VS Others</span>
                    </div>
                </motion.div>

                {/* Black & White Comparison Table Grid (Responsive for Mobile & PC) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="overflow-hidden rounded-2xl sm:rounded-3xl border border-neutral-200 shadow-xl bg-white"
                >
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="border-b border-neutral-200">
                                <th className="py-3 sm:py-4 px-3 sm:px-6 font-serif font-bold text-xs sm:text-base text-black w-[50%] sm:w-[50%]">
                                    Features
                                </th>
                                <th className="py-3 sm:py-4 px-1.5 sm:px-6 bg-black text-white text-center font-extrabold text-[10px] sm:text-base tracking-wider uppercase w-[25%] sm:w-[25%]">
                                    BK STORE
                                </th>
                                <th className="py-3 sm:py-4 px-1.5 sm:px-6 bg-neutral-100 text-neutral-500 text-center font-bold text-[10px] sm:text-base tracking-wider uppercase w-[25%] sm:w-[25%] border-b border-neutral-200">
                                    Others
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {COMPARISON_FEATURES.map((row) => (
                                <tr
                                    key={row.feature}
                                    className="hover:bg-neutral-50/80 transition-colors"
                                >
                                    {/* Feature Name */}
                                    <td className="py-3 sm:py-4 px-3 sm:px-6 font-semibold text-[11px] sm:text-sm text-black leading-tight">
                                        {row.feature}
                                    </td>

                                    {/* BK Store Column */}
                                    <td className="py-3 sm:py-4 px-1.5 sm:px-6 text-center border-x border-neutral-200 bg-neutral-50/50">
                                        <div className="mx-auto flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black text-white shadow-sm">
                                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
                                        </div>
                                    </td>

                                    {/* Others Column */}
                                    <td className="py-3 sm:py-4 px-1.5 sm:px-6 text-center">
                                        <span className="font-serif italic text-sm sm:text-lg font-bold text-neutral-400">
                                            ✕
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </div>
        </section>
    );
}


