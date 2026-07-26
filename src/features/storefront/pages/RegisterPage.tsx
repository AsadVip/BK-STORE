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

export default function RegisterPage() {
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
            <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md text-center"
                >
                    {/* Success icon with ring animation */}
                    <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                        <div className="absolute inset-2 rounded-full bg-emerald-500/10" />
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/30">
                            <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                    </div>

                    <h1 className="font-serif text-3xl font-extrabold text-text-primary mb-3">
                        Almost There! 🎉
                    </h1>
                    <p className="text-text-secondary text-sm leading-relaxed mb-6">
                        Your BK Store account has been created! We've sent a <strong>confirmation email</strong> to:
                    </p>

                    {/* Email pill */}
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-btn-primary/10 border border-btn-primary/20 px-5 py-3 mb-6">
                        <Mail className="h-4.5 w-4.5 text-btn-primary" />
                        <span className="font-bold text-btn-primary text-sm">{emailSent}</span>
                    </div>

                    <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 p-4 text-left mb-8">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">📧 Next Steps:</p>
                        <ol className="space-y-1.5 text-xs text-amber-700/80 dark:text-amber-300/70">
                            <li>1. Check your email inbox (and spam folder)</li>
                            <li>2. Click the <strong>"Confirm Email"</strong> link</li>
                            <li>3. Come back and sign in to shop!</li>
                        </ol>
                    </div>

                    <Button
                        asChild
                        size="lg"
                        className="w-full h-13 rounded-xl bg-btn-primary text-white font-bold shadow-lg hover:bg-btn-primary-hover"
                    >
                        <Link to="/login">Go to Sign In <ArrowRight className="h-4 w-4 ml-2" /></Link>
                    </Button>

                    <p className="mt-4 text-xs text-text-secondary">
                        Didn't receive the email?{" "}
                        <button
                            type="button"
                            onClick={() => setEmailSent(null)}
                            className="text-btn-primary font-medium hover:underline"
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
                <div className="absolute inset-0 bg-black/70" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#5C3D2E]/60 via-transparent to-black/60" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <img src="/logo.png" alt="BK Store" className="h-10 w-10 rounded-xl object-contain" />
                    <div>
                        <div className="font-serif text-lg font-bold text-white">BK Store</div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400">Luxury Collection</div>
                    </div>
                </div>

                {/* Center content */}
                <div className="relative z-10">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-400/30 mb-5">
                        <Sparkles className="h-3 w-3" /> Join the Inner Circle
                    </span>
                    <h2 className="font-serif text-3xl font-extrabold text-white leading-tight">
                        Become a BK<br />Store Member
                    </h2>
                    <p className="mt-3 text-white/60 text-sm leading-relaxed max-w-xs">
                        Get early access to new arrivals, members-only deals, and exclusive luxury collections.
                    </p>
                    <div className="mt-6 space-y-2.5">
                        {[
                            "Exclusive member pricing",
                            "Early access to new arrivals",
                            "Order tracking & history",
                            "Wishlist & saved items",
                        ].map((benefit) => (
                            <div key={benefit} className="flex items-center gap-2.5 text-sm text-white/70">
                                <div className="h-4 w-4 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
                                    <svg className="h-2.5 w-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                {benefit}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-white/50 text-xs">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Your data is encrypted & never shared
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-bg-primary overflow-y-auto">
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
                            <div className="font-serif text-base font-bold text-text-primary">BK Store</div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-btn-primary">Luxury Collection</div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-text-primary">Create Account</h1>
                        <p className="mt-2 text-sm text-text-secondary">Join the BK Store inner circle today</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="text-sm font-semibold text-text-primary">First Name</Label>
                                <Input
                                    id="first_name"
                                    autoComplete="given-name"
                                    placeholder="Ali"
                                    className="h-12 rounded-xl border-border/60 bg-bg-secondary/60 text-sm focus:border-btn-primary focus:ring-1 focus:ring-btn-primary/30"
                                    {...register("first_name")}
                                    aria-invalid={!!errors.first_name}
                                />
                                {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="text-sm font-semibold text-text-primary">Last Name</Label>
                                <Input
                                    id="last_name"
                                    autoComplete="family-name"
                                    placeholder="Khan"
                                    className="h-12 rounded-xl border-border/60 bg-bg-secondary/60 text-sm focus:border-btn-primary focus:ring-1 focus:ring-btn-primary/30"
                                    {...register("last_name")}
                                    aria-invalid={!!errors.last_name}
                                />
                                {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-text-primary">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="h-12 rounded-xl border-border/60 bg-bg-secondary/60 text-sm focus:border-btn-primary focus:ring-1 focus:ring-btn-primary/30"
                                {...register("email")}
                                aria-invalid={!!errors.email}
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-semibold text-text-primary">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPass ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Min 8 characters"
                                    className="h-12 rounded-xl border-border/60 bg-bg-secondary/60 text-sm pr-12 focus:border-btn-primary focus:ring-1 focus:ring-btn-primary/30"
                                    {...register("password")}
                                    aria-invalid={!!errors.password}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                            <p className="text-xs text-text-secondary">Min 8 characters, with at least one letter and number.</p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirm_password" className="text-sm font-semibold text-text-primary">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirm_password"
                                    type={showConfirm ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Repeat password"
                                    className="h-12 rounded-xl border-border/60 bg-bg-secondary/60 text-sm pr-12 focus:border-btn-primary focus:ring-1 focus:ring-btn-primary/30"
                                    {...register("confirm_password")}
                                    aria-invalid={!!errors.confirm_password}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.confirm_password && <p className="text-xs text-red-500">{errors.confirm_password.message}</p>}
                        </div>

                        {/* Terms notice */}
                        <p className="text-xs text-text-secondary leading-relaxed">
                            By creating an account, you agree to our{" "}
                            <span className="font-medium text-btn-primary">Terms of Service</span> and{" "}
                            <span className="font-medium text-btn-primary">Privacy Policy</span>.
                        </p>

                        <Button
                            type="submit"
                            size="lg"
                            disabled={isSubmitting}
                            className="w-full h-13 rounded-xl bg-btn-primary text-white font-bold text-base shadow-lg hover:bg-btn-primary-hover hover:shadow-xl transition-all"
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

                    <div className="mt-6 pt-6 border-t border-border/50 text-center">
                        <p className="text-sm text-text-secondary">
                            Already have an account?{" "}
                            <Link to="/login" className="font-bold text-btn-primary hover:underline inline-flex items-center gap-1">
                                Sign in <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
