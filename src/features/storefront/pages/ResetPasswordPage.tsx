import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function ResetPasswordPage() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Supabase redirects here with a recovery session in the URL hash.
        supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") setReady(true);
        });
        // Also check current session.
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) setReady(true);
        });
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

    const onSubmit = async (values: ResetPasswordValues) => {
        const { error } = await supabase.auth.updateUser({ password: values.password });
        if (error) {
            toast({ variant: "destructive", title: "Reset failed", description: error.message });
        } else {
            toast({ title: "Password updated", description: "You can now sign in with your new password." });
            navigate("/login");
        }
    };

    if (!ready) {
        return (
            <div className="container-bk flex min-h-[70vh] items-center justify-center py-16">
                <p className="text-sm text-text-secondary">Verifying your reset link…</p>
            </div>
        );
    }

    return (
        <div className="container-bk flex min-h-[70vh] items-center justify-center py-16">
            <div className="w-full max-w-md rounded-2xl border border-border bg-bg-secondary p-8 shadow-soft">
                <div className="mb-8 text-center">
                    <h1 className="font-serif text-3xl font-semibold">Set New Password</h1>
                    <p className="mt-2 text-sm text-text-secondary">Choose a new password for your account</p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input id="password" type="password" autoComplete="new-password" {...register("password")} aria-invalid={!!errors.password} />
                        {errors.password && <p className="text-sm text-state-danger">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirm Password</Label>
                        <Input id="confirm_password" type="password" autoComplete="new-password" {...register("confirm_password")} aria-invalid={!!errors.confirm_password} />
                        {errors.confirm_password && <p className="text-sm text-state-danger">{errors.confirm_password.message}</p>}
                    </div>
                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Updating…" : "Update Password"}
                    </Button>
                </form>
                <p className="mt-6 text-center text-sm text-text-secondary">
                    <Link to="/login" className="font-medium text-btn-primary hover:underline">
                        Back to sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
