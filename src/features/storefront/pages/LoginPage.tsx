import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { loginSchema, type LoginValues } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function LoginPage() {
    const { signIn } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string })?.from ?? "/account";
    const [showPass, setShowPass] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

    const onSubmit = async (values: LoginValues) => {
        const { error } = await signIn(values.email, values.password);
        if (error) {
            toast({ variant: "destructive", title: "Sign in failed", description: error });
        } else {
            toast({ title: "✓ Welcome back!", description: "You're successfully signed in.", variant: "success" });
            navigate(from, { replace: true });
        }
    };

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

                {/* Center quote */}
                <div className="relative z-10">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-400/30 mb-5">
                        <Sparkles className="h-3 w-3" /> Premium Experience
                    </span>
                    <h2 className="font-serif text-3xl font-extrabold text-white leading-tight">
                        Your Luxury<br />Destination
                    </h2>
                    <p className="mt-3 text-white/60 text-sm leading-relaxed max-w-xs">
                        Discover authentic watches, luxury shoes, and curated collections delivered to your door.
                    </p>

                    <div className="mt-8 flex items-center gap-4">
                        {[
                            { val: "5000+", label: "Customers" },
                            { val: "500+", label: "Products" },
                            { val: "100%", label: "Authentic" },
                        ].map((s) => (
                            <div key={s.label} className="text-center">
                                <div className="font-serif text-xl font-extrabold text-amber-400">{s.val}</div>
                                <div className="text-[10px] text-white/50">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trust badge */}
                <div className="relative z-10 flex items-center gap-2 text-white/50 text-xs">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Secure & encrypted login
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-bg-primary">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
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
                        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-text-primary">Welcome Back</h1>
                        <p className="mt-2 text-sm text-text-secondary">Sign in to your BK Store account</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-semibold text-text-primary">Password</Label>
                                <Link to="/forgot-password" className="text-xs font-medium text-btn-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPass ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="h-12 rounded-xl border-border/60 bg-bg-secondary/60 text-sm pr-12 focus:border-btn-primary focus:ring-1 focus:ring-btn-primary/30"
                                    {...register("password")}
                                    aria-invalid={!!errors.password}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    {showPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
                        </div>

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
                                    Signing in…
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <LogIn className="h-5 w-5" /> Sign In to BK Store
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border/50 text-center">
                        <p className="text-sm text-text-secondary">
                            New to BK Store?{" "}
                            <Link to="/register" className="font-bold text-btn-primary hover:underline inline-flex items-center gap-1">
                                Create an account <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
