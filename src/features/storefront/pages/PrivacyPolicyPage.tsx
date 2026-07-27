import React from "react";
import {
    ShieldCheck,
    Database,
    FolderKanban,
    Share2,
    ExternalLink,
    Baby,
    Lock,
    UserCheck,
    AlertCircle,
    Globe,
    Mail,
    MapPin,
    ArrowRight,
    CheckCircle2
} from "lucide-react";

export default function PrivacyPolicyPage() {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-bg-secondary via-bg-secondary/90 to-btn-primary/5 p-8 sm:p-12 shadow-sm mb-10">
                    <div className="relative z-10 max-w-3xl">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-btn-primary mb-3">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Official Legal Document</span>
                        </div>
                        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-text-primary">
                            Privacy Policy
                        </h1>
                        <p className="mt-4 text-sm sm:text-base text-text-secondary leading-relaxed">
                            This Privacy Policy describes how BK Store collects, uses, processes, and discloses your personal information when you use our website, products, and services.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium text-text-secondary">
                            <span className="flex items-center gap-1.5 rounded-full bg-bg-primary/80 border border-border px-3 py-1.5 shadow-xs">
                                <CheckCircle2 className="h-3.5 w-3.5 text-state-success" /> Effective: July 27, 2026
                            </span>
                            <span className="flex items-center gap-1.5 rounded-full bg-bg-primary/80 border border-border px-3 py-1.5 shadow-xs">
                                <Lock className="h-3.5 w-3.5 text-btn-primary" /> End-to-End Protection
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table of Contents & Content Layout */}
                <div className="grid gap-10 lg:grid-cols-12">
                    {/* Quick Navigation Sidebar (Desktop) */}
                    <aside className="hidden lg:block lg:col-span-4 space-y-2 sticky top-24 h-fit">
                        <div className="rounded-2xl border border-border bg-bg-secondary p-5 shadow-xs">
                            <h3 className="font-serif font-bold text-sm text-text-primary mb-3 uppercase tracking-wider">
                                Table of Contents
                            </h3>
                            <nav className="space-y-1.5 text-xs font-medium">
                                {[
                                    { id: "collect", label: "1. Information We Collect" },
                                    { id: "sources", label: "2. Information Sources" },
                                    { id: "use", label: "3. How We Use Information" },
                                    { id: "disclose", label: "4. Disclosure to Third Parties" },
                                    { id: "third-party", label: "5. Third Party Links" },
                                    { id: "children", label: "6. Children's Data" },
                                    { id: "security", label: "7. Security & Retention" },
                                    { id: "rights", label: "8. Your Rights & Choices" },
                                    { id: "complaints", label: "9. Complaints" },
                                    { id: "transfers", label: "10. International Transfers" },
                                    { id: "contact", label: "11. Contact Us" },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => scrollToSection(item.id)}
                                        className="w-full text-left px-3 py-2 rounded-xl text-text-secondary hover:text-btn-primary hover:bg-bg-primary transition-all flex items-center justify-between group"
                                    >
                                        <span className="truncate">{item.label}</span>
                                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Document Content */}
                    <main className="lg:col-span-8 space-y-10">
                        {/* 1. Personal Information We Collect or Process */}
                        <section id="collect" className="scroll-mt-24 rounded-2xl border border-border bg-bg-secondary p-6 sm:p-8 shadow-xs">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-btn-primary/10 text-btn-primary">
                                    <Database className="h-5 w-5" />
                                </div>
                                <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                                    1. Personal Information We Collect or Process
                                </h2>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed mb-4">
                                When we use the term &quot;personal information,&quot; we are referring to information that identifies or can reasonably be linked to you or another person. Personal information does not include information that is collected anonymously or that has been de-identified, so that it cannot identify or be reasonably linked to you.
                            </p>
                            <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                We may collect or process the following categories of personal information, including inferences drawn from this personal information, depending on how you interact with the Services, where you live, and as permitted or required by applicable law:
                            </p>

                            <div className="space-y-3">
                                {[
                                    {
                                        title: "Contact details",
                                        desc: "including your name, address, billing address, shipping address, phone number, and email address."
                                    },
                                    {
                                        title: "Financial information",
                                        desc: "including credit card, debit card, and financial account numbers, payment card information, financial account information, transaction details, form of payment, payment confirmation and other payment details."
                                    },
                                    {
                                        title: "Account information",
                                        desc: "including your username, password, security questions, preferences and settings."
                                    },
                                    {
                                        title: "Transaction information",
                                        desc: "including the items you view, put in your cart, add to your wishlist, or purchase, return, exchange or cancel and your past transactions."
                                    },
                                    {
                                        title: "Communications with us",
                                        desc: "including the information you include in communications with us, for example, when sending a customer support inquiry."
                                    },
                                    {
                                        title: "Device information",
                                        desc: "including information about your device, browser, or network connection, your IP address, and other unique identifiers."
                                    },
                                    {
                                        title: "Usage information",
                                        desc: "including information regarding your interaction with the Services, including how and when you interact with or navigate the Services."
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-bg-primary border border-border/60">
                                        <div className="h-2 w-2 rounded-full bg-btn-primary mt-2 shrink-0" />
                                        <div className="text-xs sm:text-sm">
                                            <strong className="font-semibold text-text-primary">{item.title}: </strong>
                                            <span className="text-text-secondary">{item.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 2. Personal Information Sources */}
                        <section id="sources" className="scroll-mt-24 rounded-2xl border border-border bg-bg-secondary p-6 sm:p-8 shadow-xs">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-btn-primary/10 text-btn-primary">
                                    <FolderKanban className="h-5 w-5" />
                                </div>
                                <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                                    2. Personal Information Sources
                                </h2>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                We may collect personal information from the following sources:
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    {
                                        title: "Directly from you",
                                        desc: "including when you create an account, visit or use the Services, communicate with us, or otherwise provide us with your personal information;"
                                    },
                                    {
                                        title: "Automatically through Services",
                                        desc: "including from your device when you use our products or services or visit our websites, and through the use of cookies and similar technologies;"
                                    },
                                    {
                                        title: "From our service providers",
                                        desc: "including when we engage them to enable certain technology and when they collect or process your personal information on our behalf;"
                                    },
                                    {
                                        title: "From our partners",
                                        desc: "or other third parties."
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-bg-primary border border-border/60 flex flex-col justify-between">
                                        <h4 className="font-semibold text-sm text-text-primary mb-1.5">{item.title}</h4>
                                        <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. How We Use Your Personal Information */}
                        <section id="use" className="scroll-mt-24 rounded-2xl border border-border bg-bg-secondary p-6 sm:p-8 shadow-xs">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-btn-primary/10 text-btn-primary">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                                <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                                    3. How We Use Your Personal Information
                                </h2>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                Depending on how you interact with us or which of the Services you use, we may use personal information for the following purposes:
                            </p>
                            <div className="space-y-4 text-xs sm:text-sm text-text-secondary leading-relaxed">
                                <div className="p-4 rounded-xl bg-bg-primary border border-border/60">
                                    <strong className="font-semibold text-text-primary block text-base mb-1">
                                        Provide, Tailor, and Improve the Services.
                                    </strong>
                                    We use your personal information to provide you with the Services, including to perform our contract with you, to process your payments, to fulfill your orders, to remember your preferences and items you are interested in, to send notifications to you related to your account, to process purchases, returns, exchanges or other transactions, to create, maintain and otherwise manage your account, to arrange for shipping, to facilitate any returns and exchanges, to enable you to post reviews, and to create a customized shopping experience for you, such as recommending products related to your purchases. This may include using your personal information to better tailor and improve the Services.
                                </div>

                                <div className="p-4 rounded-xl bg-bg-primary border border-border/60">
                                    <strong className="font-semibold text-text-primary block text-base mb-1">
                                        Marketing and Advertising.
                                    </strong>
                                    We use your personal information for marketing and promotional purposes, such as to send marketing, advertising and promotional communications by email, text message or postal mail, and to show you online advertisements for products or services on the Services or other websites, including based on items you previously have purchased or added to your cart and other activity on the Services.
                                </div>

                                <div className="p-4 rounded-xl bg-bg-primary border border-border/60">
                                    <strong className="font-semibold text-text-primary block text-base mb-1">
                                        Security and Fraud Prevention.
                                    </strong>
                                    We use your personal information to authenticate your account, to provide a secure payment and shopping experience, detect, investigate or take action regarding possible fraudulent, illegal, unsafe, or malicious activity, protect public safety, and to secure our services. If you choose to use the Services and register an account, you are responsible for keeping your account credentials safe. We highly recommend that you do not share your username, password or other access details with anyone else.
                                </div>

                                <div className="p-4 rounded-xl bg-bg-primary border border-border/60">
                                    <strong className="font-semibold text-text-primary block text-base mb-1">
                                        Communicating with You.
                                    </strong>
                                    We use your personal information to provide you with customer support, to be responsive to you, to provide effective services to you and to maintain our business relationship with you.
                                </div>

                                <div className="p-4 rounded-xl bg-bg-primary border border-border/60">
                                    <strong className="font-semibold text-text-primary block text-base mb-1">
                                        Legal Reasons.
                                    </strong>
                                    We use your personal information to comply with applicable law or respond to valid legal process, including requests from law enforcement or government agencies, to investigate or participate in civil discovery, potential or actual litigation, or other adversarial legal proceedings, and to enforce or investigate potential violations of our terms or policies.
                                </div>
                            </div>
                        </section>

                        {/* 4. How We Disclose Personal Information */}
                        <section id="disclose" className="scroll-mt-24 rounded-2xl border border-border bg-bg-secondary p-6 sm:p-8 shadow-xs">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-btn-primary/10 text-btn-primary">
                                    <Share2 className="h-5 w-5" />
                                </div>
                                <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                                    4. How We Disclose Personal Information
                                </h2>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                In certain circumstances, we may disclose your personal information to third parties for legitimate purposes subject to this Privacy Policy. Such circumstances may include:
                            </p>
                            <div className="space-y-3">
                                {[
                                    "With Shopify, vendors and other third parties who perform services on our behalf (e.g. IT management, payment processing, data analytics, customer support, cloud storage, fulfillment and shipping).",
                                    "With business and marketing partners to provide marketing services and advertise to you. For example, we use Shopify to support personalized advertising with third-party services based on your online activity with different merchants and websites. Our business and marketing partners will use your information in accordance with their own privacy notices. Depending on where you reside, you may have a right to direct us not to share information about you to show you targeted advertisements and marketing based on your online activity with different merchants and websites.",
                                    "When you direct, request us or otherwise consent to our disclosure of certain information to third parties, such as to ship you products or through your use of social media widgets or login integrations.",
                                    "With our affiliates or otherwise within our corporate group.",
                                    "In connection with a business transaction such as a merger or bankruptcy, to comply with any applicable legal obligations (including to respond to subpoenas, search warrants and similar requests), to enforce any applicable terms of service or policies, and to protect or defend the Services, our rights, and the rights of our users or others."
                                ].map((text, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-bg-primary border border-border/60">
                                        <div className="h-2 w-2 rounded-full bg-btn-primary mt-2 shrink-0" />
                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 5. Third Party Websites and Links */}
                        <section id="third-party" className="scroll-mt-24 rounded-2xl border border-border bg-bg-secondary p-6 sm:p-8 shadow-xs">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-btn-primary/10 text-btn-primary">
                                    <ExternalLink className="h-5 w-5" />
                                </div>
                                <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                                    5. Third Party Websites and Links
                                </h2>
                            </div>
                            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                The Services may provide links to websites or other online platforms operated by third parties. If you follow links to sites not affiliated or controlled by us, you should review their privacy and security policies and other terms and conditions. We do not guarantee and are not responsible for the privacy or security of such sites, including the accuracy, completeness, or reliability of information found on these sites. Information you provide on public or semi-public venues, including information you share on third-party social networking platforms may also be viewable by other users of the Services and/or users of those third-party platforms without limitation as to its use by us or by a third party. Our inclusion of such links does not, by itself, imply any endorsement of the content on such platforms or of their owners or operators, except as disclosed on the Services.
                            </p>
                        </section>

                        {/* 6. Children's Data */}
                        <section id="children" className="scroll-mt-24 rounded-2xl border border-border bg-bg-secondary p-6 sm:p-8 shadow-xs">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-btn-primary/10 text-btn-primary">
                                    <Baby className="h-5 w-5" />
                                </div>
                                <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                                    6. Children&apos;s Data
                                </h2>
                            </div>
                            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                The Services are not intended to be used by children, and we do not knowingly collect any personal information about children under the age of majority in your jurisdiction. If you are the parent or guardian of a child who has provided us with their personal information, you may contact us using the contact details set out below to request that it be deleted. As of the Effective Date of this Privacy Policy, we do not have actual knowledge that we &quot;share&quot; or &quot;sell&quot; (as those terms are defined in applicable law) personal information of individuals under 16 years of age.
                            </p>
                        </section>

                        {/* 7. Security and Retention of Your Information */}
                        <section id="security" className="scroll-mt-24 rounded-2xl border border-border bg-bg-secondary p-6 sm:p-8 shadow-xs">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-btn-primary/10 text-btn-primary">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                                    7. Security and Retention of Your Information
                                </h2>
                            </div>
                            <div className="space-y-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
                                <p>
                                    Please be aware that no security measures are perfect or impenetrable, and we cannot guarantee &quot;perfect security.&quot; In addition, any information you send to us may not be secure while in transit. We recommend that you do not use unsecure channels to communicate sensitive or confidential information to us.
                                </p>
                                <p>
                                    How long we retain your personal information depends on different factors, such as whether we need the information to maintain your account, to provide you with Services, comply with legal obligations, resolve disputes or enforce other applicable contracts and policies.
                                </p>
                            </div>
                        </section>

                        {/* 8. Your Rights and Choices */}
                        <section id="rights" className="scroll-mt-24 rounded-2xl border border-border bg-bg-secondary p-6 sm:p-8 shadow-xs">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-btn-primary/10 text-btn-primary">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                                <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                                    8. Your Rights and Choices
                                </h2>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                Depending on where you live, you may have some or all of the rights listed below in relation to your personal information. However, these rights are not absolute, may apply only in certain circumstances and, in certain cases, we may decline your request as permitted by law.
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2 mb-6">
                                {[
                                    { title: "Right to Access / Know", desc: "You may have a right to request access to personal information that we hold about you." },
                                    { title: "Right to Delete", desc: "You may have a right to request that we delete personal information we maintain about you." },
                                    { title: "Right to Correct", desc: "You may have a right to request that we correct inaccurate personal information we maintain about you." },
                                    { title: "Right of Portability", desc: "You may have a right to receive a copy of your personal information and request that we transfer it to a third party, with certain exceptions." }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-bg-primary border border-border/60">
                                        <h4 className="font-semibold text-sm text-text-primary mb-1">{item.title}</h4>
                                        <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 rounded-xl bg-bg-primary border border-border/60 text-xs sm:text-sm text-text-secondary leading-relaxed space-y-2">
                                <p>
                                    <strong className="font-semibold text-text-primary">Managing Communication Preferences: </strong>
                                    We may send you promotional emails, and you may opt out of receiving these at any time by using the unsubscribe option displayed in our emails to you. If you opt out, we may still send you non-promotional emails, such as those about your account or orders that you have made.
                                </p>
                                <p>
                                    You may exercise any of these rights where indicated on the Services or by contacting us using the contact details provided below.
                                </p>
                            </div>
                        </section>

                        {/* 9. Complaints */}
                        <section id="complaints" className="scroll-mt-24 rounded-2xl border border-border bg-bg-secondary p-6 sm:p-8 shadow-xs">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-btn-primary/10 text-btn-primary">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                                    9. Complaints
                                </h2>
                            </div>
                            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                If you have complaints about how we process your personal information, please contact us using the contact details provided below. Depending on where you live, you may have the right to appeal our decision by contacting us using the contact details set out below, or lodge your complaint with your local data protection authority.
                            </p>
                        </section>

                        {/* 10. International Transfers */}
                        <section id="transfers" className="scroll-mt-24 rounded-2xl border border-border bg-bg-secondary p-6 sm:p-8 shadow-xs">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-btn-primary/10 text-btn-primary">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                                    10. International Transfers
                                </h2>
                            </div>
                            <div className="space-y-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
                                <p>
                                    Please note that we may transfer, store and process your personal information outside the country you live in.
                                </p>
                                <p>
                                    If we transfer your personal information out of the European Economic Area or the United Kingdom, we will rely on recognized transfer mechanisms like the European Commission&apos;s Standard Contractual Clauses, or any equivalent contracts issued by the relevant competent authority of the UK, as relevant, unless the data transfer is to a country that has been determined to provide an adequate level of protection.
                                </p>
                            </div>
                        </section>

                        {/* 11. Contact Us */}
                        <section id="contact" className="scroll-mt-24 rounded-2xl border border-btn-primary/30 bg-gradient-to-br from-bg-secondary to-btn-primary/5 p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-btn-primary text-white shadow-xs">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                                    11. Contact Us
                                </h2>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                Should you have any questions about our privacy practices or this Privacy Policy, or if you would like to exercise any of the rights available to you, please contact us:
                            </p>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <a
                                    href="mailto:bkstore.watches@gmail.com"
                                    className="flex items-center gap-3 p-4 rounded-xl bg-bg-primary border border-border hover:border-btn-primary transition-all group"
                                >
                                    <div className="h-10 w-10 rounded-xl bg-btn-primary/10 text-btn-primary flex items-center justify-center shrink-0">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <span className="block text-xs font-semibold text-text-secondary">Official Email Support</span>
                                        <span className="text-sm font-bold text-text-primary group-hover:text-btn-primary transition-colors truncate block">
                                            bkstore.watches@gmail.com
                                        </span>
                                        <span className="text-[11px] text-text-secondary block">
                                            Alt: 2sstore0111@gmail.com
                                        </span>
                                    </div>
                                </a>

                                <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-primary border border-border">
                                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-text-secondary">Postal Address</span>
                                        <span className="text-sm font-bold text-text-primary">
                                            Multan 60810, Pakistan
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
}
