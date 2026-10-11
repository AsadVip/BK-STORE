import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, UserPlus, Sparkles, ShieldCheck, ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { registerSchema, type RegisterValues } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useSEO } from "@/lib/seo";

export default function RegisterPage() {
    useSEO({
        title: "Create an Account | BK Store — BK Tajir",
        description: "Join BK Store (bktajir.com) Inner Circle. Enjoy VIP access, fast order tracking, and exclusive discounts on luxury watches & shoes.",
        canonicalPath: "/register",
    });

    const { signUp } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [emailSent, setEmailSent] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

    const onSubmit = async (values: RegisterValues) => {
        const { error, session } = await signUp(values.email, values.password, values.first_name, values.last_name);
        if (error) {
            toast({ variant: "destructive", title: "Registration failed", description: error });
        } else if (session) {
            toast({
                title: "🎉 Account Created Successfully!",
                description: "Welcome to BK Store! Your account is active and you are now logged in.",
                variant: "success",
            });
            navigate("/");
        } else {
            setEmailSent(values.email);
            // Big confirmation notification
            toast({
                title: "🎉 Account Created Successfully!",
                description: `A confirmation email has been sent to ${values.email}. Please check your inbox and click the link to activate your account.`,
                variant: "success",
            });
        }
    };

    // Email confirmation screen
    if (emailSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md text-center p-8 rounded-3xl border border-neutral-200 bg-white shadow-xl"
                >
                    {/* Success icon */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-black text-white shadow-md">
                        <CheckCircle2 className="h-10 w-10 text-white" />
                    </div>

                    <h1 className="font-serif text-3xl font-extrabold text-black mb-3">
                        Almost There! 🎉
                    </h1>
                    <p className="text-neutral-600 text-sm leading-relaxed mb-6 font-medium">
                        Your BK Store account has been created! We've sent a <strong>confirmation email</strong> to:
                    </p>

                    {/* Email pill */}
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-neutral-100 border border-neutral-200 px-5 py-3 mb-6">
                        <Mail className="h-4.5 w-4.5 text-black" />
                        <span className="font-bold text-black text-sm">{emailSent}</span>
                    </div>

                    <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-4 text-left mb-8">
                        <p className="text-xs font-bold text-black mb-2">📧 Next Steps:</p>
                        <ol className="space-y-1.5 text-xs text-neutral-600 font-medium">
                            <li>1. Check your email inbox (and spam folder)</li>
                            <li>2. Click the <strong>"Confirm Email"</strong> link</li>
                            <li>3. Come back and sign in to shop!</li>
                        </ol>
                    </div>

                    <Button
                        asChild
                        size="lg"
                        className="w-full h-13 rounded-xl bg-black text-white font-extrabold shadow-lg hover:bg-neutral-800"
                    >
                        <Link to="/login">Go to Sign In <ArrowRight className="h-4 w-4 ml-2" /></Link>
                    </Button>

                    <p className="mt-4 text-xs text-neutral-500 font-medium">
                        Didn't receive the email?{" "}
                        <button
                            type="button"
                            onClick={() => setEmailSent(null)}
                            className="text-black font-bold hover:underline"
                        >
                            Try again
                        </button>
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Panel — Cinematic Visual */}
            <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12">
                <img
                    src="/hero-bg.png"
                    alt="BK Store"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/75" />
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-black/90" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <img src="/logo.png" alt="BK Store" className="h-10 w-10 rounded-xl object-contain" />
                    <div>
                        <div className="font-serif text-lg font-bold text-white">BK Store</div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-300">Luxury Collection</div>
                    </div>
                </div>

                {/* Center content */}
                <div className="relative z-10">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white border border-white/20 mb-5">
                        <Sparkles className="h-3 w-3" /> Join the Inner Circle
                    </span>
                    <h2 className="font-serif text-3xl font-extrabold text-white leading-tight">
                        Become a BK<br />Store Member
                    </h2>
                    <p className="mt-3 text-white/70 text-sm leading-relaxed max-w-xs font-medium">
                        Get early access to new arrivals, members-only deals, and exclusive luxury collections.
                    </p>
                    <div className="mt-6 space-y-2.5">
                        {[
                            "Exclusive member pricing",
                            "Early access to new arrivals",
                            "Order tracking & history",
                            "Wishlist & saved items",
                        ].map((benefit) => (
                            <div key={benefit} className="flex items-center gap-2.5 text-sm text-white/80 font-medium">
                                <div className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                {benefit}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-white/70 text-xs font-medium">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Your data is encrypted & never shared
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-white overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md py-6"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <img src="/logo.png" alt="BK Store" className="h-9 w-9 rounded-xl object-contain" />
                        <div>
                            <div className="font-serif text-base font-bold text-black">BK Store</div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-500">Luxury Collection</div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-black">Create Account</h1>
                        <p className="mt-2 text-sm text-neutral-600 font-medium">Join the BK Store inner circle today</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="text-sm font-bold text-black">First Name</Label>
                                <Input
                                    id="first_name"
                                    autoComplete="given-name"
                                    placeholder="Ali"
                                    className="h-12 rounded-xl border border-neutral-300 bg-white text-black text-sm placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black"
                                    {...register("first_name")}
                                    aria-invalid={!!errors.first_name}
                                />
                                {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="text-sm font-bold text-black">Last Name</Label>
                                <Input
                                    id="last_name"
                                    autoComplete="family-name"
                                    placeholder="Khan"
                                    className="h-12 rounded-xl border border-neutral-300 bg-white text-black text-sm placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black"
                                    {...register("last_name")}
                                    aria-invalid={!!errors.last_name}
                                />
                                {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-bold text-black">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="h-12 rounded-xl border border-neutral-300 bg-white text-black text-sm placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black"
                                {...register("email")}
                                aria-invalid={!!errors.email}
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-bold text-black">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPass ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Min 8 characters"
                                    className="h-12 rounded-xl border border-neutral-300 bg-white text-black text-sm pr-12 placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black"
                                    {...register("password")}
                                    aria-invalid={!!errors.password}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition-colors"
                                >
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                            <p className="text-xs text-neutral-500 font-medium">Min 8 characters, with at least one letter and number.</p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirm_password" className="text-sm font-bold text-black">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirm_password"
                                    type={showConfirm ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Repeat password"
                                    className="h-12 rounded-xl border border-neutral-300 bg-white text-black text-sm pr-12 placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black"
                                    {...register("confirm_password")}
                                    aria-invalid={!!errors.confirm_password}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition-colors"
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.confirm_password && <p className="text-xs text-red-500">{errors.confirm_password.message}</p>}
                        </div>

                        {/* Terms notice */}
                        <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                            By creating an account, you agree to our{" "}
                            <Link to="/terms" target="_blank" className="font-bold text-black hover:underline">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link to="/privacy-policy" target="_blank" className="font-bold text-black hover:underline">
                                Privacy Policy
                            </Link>.
                        </p>

                        <Button
                            type="submit"
                            size="lg"
                            disabled={isSubmitting}
                            className="w-full h-13 rounded-xl bg-black text-white font-extrabold text-base shadow-lg hover:bg-neutral-800 transition-all"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating Account…
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" /> Create My Account
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
                        <p className="text-sm text-neutral-600 font-medium">
                            Already have an account?{" "}
                            <Link to="/login" className="font-bold text-black hover:underline inline-flex items-center gap-1">
                                Sign in <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
