import { useState } from "react";
import { Mail, MapPin, Phone, ExternalLink, Facebook, Instagram, Clock, ShieldCheck, Truck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64c.29 0 .56.04.82.12V9.4a6.27 6.27 0 00-1-.08A6.34 6.34 0 003 15.66a6.34 6.34 0 0010.86 4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.52z" />
        </svg>
    );
}

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.758.459 3.474 1.33 4.982L2 22l5.166-1.338a9.953 9.953 0 004.842 1.258h.004c5.507 0 9.99-4.478 9.99-9.984A9.925 9.925 0 0019.08 4.92 9.924 9.924 0 0012.012 2zm5.82 14.364c-.244.686-1.42 1.309-1.956 1.385-.494.07-.138.293-.82.073-.414-.13-1.455-.493-2.775-1.67-.103-.918-2.28-3.92-2.28-5.32 0-1.4.733-2.09 1.025-2.378.293-.288.636-.36.85-.36.213 0 .426.002.61.01.196.008.463-.075.725.556.27.649.918 2.24.998 2.404.08.164.133.356.026.57-.106.214-.16.347-.32.535-.16.188-.337.42-.48.563-.16.16-.328.334-.14.656.188.322.836 1.378 1.792 2.23 1.228 1.094 2.264 1.433 2.584 1.593.32.16.507.133.693-.08.187-.213.801-.933 1.014-1.253.213-.32.427-.267.72-.16.293.107 1.868.88 2.188 1.04.32.16.533.24.613.373.08.134.08.774-.164 1.46z" />
        </svg>
    );
}

function ProfessionalContactForm() {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formattedText = `Hello BK Store team,\n\nName: ${name || "Customer"}\nPhone: ${phone || "N/A"}\nMessage: ${message}`;
        window.open(`https://wa.me/923286870670?text=${encodeURIComponent(formattedText)}`, "_blank");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-primary">Your Name</label>
                    <Input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ali Khan"
                        className="bg-bg-primary border-border focus-visible:ring-btn-primary"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-primary">Phone / WhatsApp</label>
                    <Input
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0328 6870670"
                        className="bg-bg-primary border-border focus-visible:ring-btn-primary"
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-primary">How can we help you?</label>
                <Textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your query regarding products, order tracking, or custom requirements…"
                    className="bg-bg-primary border-border focus-visible:ring-btn-primary resize-none text-sm"
                />
            </div>
            <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto bg-[#25D366] text-white hover:bg-[#20bd5a] font-bold gap-2 shadow-md hover:shadow-lg transition-all"
            >
                <WhatsAppIcon className="h-4.5 w-4.5 fill-current" />
                Send Inquiry on WhatsApp
            </Button>
        </form>
    );
}

interface StaticPageProps {
    slug: string;
}

const CONTENT: Record<string, { title: string; body: React.ReactNode }> = {
    about: {
        title: "About BK Store",
        body: (
            <>
                <p>BK Store was founded on a simple belief: everyday objects should be beautiful, durable, and thoughtfully made. We curate a premium selection across categories — from apparel to home goods — with an uncompromising standard for quality.</p>
                <p>Every product in our collection is chosen for its craftsmanship, design integrity, and the story behind it. We partner with makers and brands who share our commitment to excellence.</p>
                <p>Our mission is to deliver a boutique-grade shopping experience that feels personal, trustworthy, and effortless — wherever you are.</p>
            </>
        ),
    },
    contact: {
        title: "Contact Us",
        body: (
            <div className="space-y-12">
                {/* Intro message & badges */}
                <div className="space-y-4">
                    <p className="text-base leading-relaxed text-text-secondary">
                        Welcome to BK Store Customer Care. Have a question about an order, product specifications, or need assistance? Connect with our Multan headquarters or reach out via direct phone or WhatsApp.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-text-secondary pt-2">
                        <span className="flex items-center gap-1.5 rounded-full bg-bg-secondary border border-border px-3.5 py-1.5">
                            <Clock className="h-3.5 w-3.5 text-btn-primary" /> Mon - Sat: 9:00 AM - 9:00 PM
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full bg-bg-secondary border border-border px-3.5 py-1.5">
                            <Truck className="h-3.5 w-3.5 text-btn-primary" /> All Pakistan Express Shipping
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full bg-bg-secondary border border-border px-3.5 py-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-state-success" /> 100% Authentic Guarantee
                        </span>
                    </div>
                </div>

                {/* Primary Contact Cards Grid */}
                <div className="grid gap-6 sm:grid-cols-3">
                    {/* Call Card */}
                    <div className="group relative flex flex-col justify-between rounded-2xl border border-border bg-bg-secondary p-6 transition-all duration-300 hover:border-btn-primary hover:shadow-xl">
                        <div>
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-btn-primary/10 text-btn-primary transition-transform group-hover:scale-110">
                                <Phone className="h-6 w-6" />
                            </div>
                            <h3 className="font-serif font-bold text-text-primary text-xl">Direct Call</h3>
                            <p className="mt-1.5 text-sm font-semibold text-text-primary">0328 6870670</p>
                            <p className="mt-1 text-xs text-text-secondary leading-snug">Speak directly with our support team in Multan</p>
                        </div>
                        <a
                            href="tel:03286870670"
                            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-btn-primary px-4 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-btn-primary-hover hover:shadow-lg"
                        >
                            <Phone className="h-3.5 w-3.5" /> Call Now (0328 6870670)
                        </a>
                    </div>

                    {/* WhatsApp Card */}
                    <div className="group relative flex flex-col justify-between rounded-2xl border border-border bg-bg-secondary p-6 transition-all duration-300 hover:border-[#25D366] hover:shadow-xl">
                        <div>
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366] transition-transform group-hover:scale-110">
                                <WhatsAppIcon className="h-6 w-6" />
                            </div>
                            <h3 className="font-serif font-bold text-text-primary text-xl">WhatsApp Direct</h3>
                            <p className="mt-1.5 text-sm font-semibold text-[#25D366]">0328 6870670</p>
                            <p className="mt-1 text-xs text-text-secondary leading-snug">Instant response for order inquiries & catalog updates</p>
                        </div>
                        <a
                            href="https://wa.me/923286870670"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[#20bd5a] hover:shadow-lg"
                        >
                            <WhatsAppIcon className="h-3.5 w-3.5" /> Chat on WhatsApp
                        </a>
                    </div>

                    {/* Location Card */}
                    <div className="group relative flex flex-col justify-between rounded-2xl border border-border bg-bg-secondary p-6 transition-all duration-300 hover:border-amber-600 hover:shadow-xl">
                        <div>
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-transform group-hover:scale-110">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <h3 className="font-serif font-bold text-text-primary text-xl">Store Location</h3>
                            <p className="mt-1.5 text-sm font-medium text-text-primary leading-snug">
                                Al Quresh Phase 2, Sher Shah Road, Multan
                            </p>
                            <p className="mt-1 text-xs text-text-secondary">Main Retail & Display Store</p>
                        </div>
                        <a
                            href="https://www.google.com/maps/search/?api=1&query=Al+quresh+phase+2+sher+shah+road+Multan"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-primary px-4 py-3 text-xs font-bold text-text-primary shadow-sm transition-all hover:bg-bg-secondary"
                        >
                            <MapPin className="h-3.5 w-3.5 text-amber-600" /> Open in Google Maps
                        </a>
                    </div>
                </div>

                {/* Form + Social Split Section */}
                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Interactive Quick WhatsApp Form */}
                    <div className="lg:col-span-7 rounded-3xl border border-border bg-bg-secondary/70 p-6 sm:p-8 shadow-sm">
                        <div className="mb-6">
                            <h2 className="font-serif text-2xl font-bold text-text-primary">Send Us a Quick Message</h2>
                            <p className="text-xs text-text-secondary mt-1">Fill out the details below to open a direct WhatsApp chat with pre-formatted inquiry details.</p>
                        </div>
                        <ProfessionalContactForm />
                    </div>

                    {/* Social Media Hub */}
                    <div className="lg:col-span-5 rounded-3xl border border-border bg-bg-secondary/70 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                        <div>
                            <h2 className="font-serif text-2xl font-bold text-text-primary">Social Media Hub</h2>
                            <p className="text-xs text-text-secondary mt-1 mb-6">Stay connected with BK Store across official social channels for drops & updates.</p>

                            <div className="space-y-3">
                                {/* Facebook */}
                                <a
                                    href="https://www.facebook.com/share/1DNBpccQJ1/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3.5 rounded-2xl border border-border bg-bg-primary p-3.5 transition-all hover:border-[#1877F2] hover:bg-[#1877F2]/5 hover:shadow-md"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1877F2] text-white shadow-sm transition-transform group-hover:scale-105">
                                        <Facebook className="h-5 w-5" />
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <span className="block font-bold text-sm text-text-primary group-hover:text-[#1877F2]">Facebook Page</span>
                                        <span className="block text-xs text-text-secondary truncate">BK Store Official</span>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-text-secondary opacity-40 transition-opacity group-hover:opacity-100" />
                                </a>

                                {/* Instagram */}
                                <a
                                    href="https://www.instagram.com/bkstore.hub?igsh=am9tZGNzOHlicHdu"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3.5 rounded-2xl border border-border bg-bg-primary p-3.5 transition-all hover:border-rose-500 hover:bg-rose-500/5 hover:shadow-md"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm transition-transform group-hover:scale-105">
                                        <Instagram className="h-5 w-5" />
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <span className="block font-bold text-sm text-text-primary group-hover:text-rose-500">Instagram</span>
                                        <span className="block text-xs text-text-secondary truncate">@bkstore.hub</span>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-text-secondary opacity-40 transition-opacity group-hover:opacity-100" />
                                </a>

                                {/* TikTok */}
                                <a
                                    href="https://tiktok.com/@bkstore.hub"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3.5 rounded-2xl border border-border bg-bg-primary p-3.5 transition-all hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 hover:shadow-md"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black shadow-sm transition-transform group-hover:scale-105">
                                        <TikTokIcon className="h-5 w-5" />
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <span className="block font-bold text-sm text-text-primary">TikTok</span>
                                        <span className="block text-xs text-text-secondary truncate">bkstore.hub</span>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-text-secondary opacity-40 transition-opacity group-hover:opacity-100" />
                                </a>

                                {/* WhatsApp */}
                                <a
                                    href="https://wa.me/923286870670"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3.5 rounded-2xl border border-border bg-bg-primary p-3.5 transition-all hover:border-[#25D366] hover:bg-[#25D366]/5 hover:shadow-md"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-sm transition-transform group-hover:scale-105">
                                        <WhatsAppIcon className="h-5 w-5" />
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <span className="block font-bold text-sm text-text-primary group-hover:text-[#25D366]">WhatsApp Business</span>
                                        <span className="block text-xs text-text-secondary truncate">0328 6870670</span>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-text-secondary opacity-40 transition-opacity group-hover:opacity-100" />
                                </a>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl bg-btn-primary/10 border border-btn-primary/20 p-4 text-xs text-text-secondary">
                            <p className="font-semibold text-text-primary mb-1">📍 Multan Showroom</p>
                            Visit our physical store on Sher Shah Road, Al Quresh Phase 2 for in-person shopping & order pick-ups.
                        </div>
                    </div>
                </div>
            </div>
        ),
    },
    faq: {
        title: "Frequently Asked Questions",
        body: (
            <div className="space-y-6">
                {[
                    { q: "How long does shipping take in Pakistan?", a: "Standard delivery takes 3–5 business days across Pakistan. Urgent delivery is available for Multan & major cities." },
                    { q: "What is your return policy?", a: "We accept returns within 7 days of delivery, provided items are in original condition." },
                    { q: "Do you offer Cash on Delivery (COD)?", a: "Yes! Cash on Delivery is available for all orders across Pakistan." },
                    { q: "How can I track my order?", a: "Once your order ships, you will receive a tracking number via SMS/WhatsApp or you can check on our Track Order page." },
                ].map((f) => (
                    <div key={f.q}>
                        <h3 className="font-medium text-text-primary">{f.q}</h3>
                        <p className="mt-1 text-text-secondary">{f.a}</p>
                    </div>
                ))}
            </div>
        ),
    },
    "privacy-policy": { title: "Privacy Policy", body: <p>Your privacy matters to us. This policy explains how we collect, use, and protect your personal information when you use BK Store. We only collect data necessary to fulfill orders and improve your experience. We never sell your data.</p> },
    terms: { title: "Terms & Conditions", body: <p>By using BK Store, you agree to these terms. All sales are subject to our store policies. Prices and availability are subject to change.</p> },
    "shipping-policy": { title: "Shipping Policy", body: <p>We offer reliable shipping across Pakistan. Orders are processed within 1–2 business days. Express shipping and Cash on Delivery are available at checkout.</p> },
    "return-policy": { title: "Return Policy", body: <p>Items can be returned within 7 days of delivery in original, unused condition. Contact our WhatsApp support at 0328 6870670 for assistance with returns or exchanges.</p> },
};

export default function StaticPage({ slug }: StaticPageProps) {
    const content = CONTENT[slug];
    if (!content) {
        return (
            <div className="container-bk py-20 text-center">
                <h1 className="font-serif text-3xl font-semibold">Page not found</h1>
            </div>
        );
    }
    return (
        <div className="container-bk py-16">
            <div className="mx-auto max-w-5xl">
                <p className="eyebrow mb-2">BK Store</p>
                <h1 className="mb-8 font-serif text-4xl font-semibold">{content.title}</h1>
                <div className="prose prose-invert max-w-none space-y-4 text-text-secondary leading-relaxed">
                    {content.body}
                </div>
            </div>
        </div>
    );
}


