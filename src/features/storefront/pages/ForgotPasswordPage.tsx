import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth();
    const { toast } = useToast();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

    const onSubmit = async (values: ForgotPasswordValues) => {
        const { error } = await resetPassword(values.email);
        if (error) {
            toast({ variant: "destructive", title: "Request failed", description: error });
        } else {
            toast({
                title: "Check your email",
                description: "We've sent a password reset link to your inbox.",
            });
        }
    };

    return (
        <div className="container-bk flex min-h-[70vh] items-center justify-center py-16">
            <div className="w-full max-w-md rounded-2xl border border-border bg-bg-secondary p-8 shadow-soft">
                <div className="mb-8 text-center">
                    <h1 className="font-serif text-3xl font-semibold">Reset Password</h1>
                    <p className="mt-2 text-sm text-text-secondary">Enter your email to receive a reset link</p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
                        {errors.email && <p className="text-sm text-state-danger">{errors.email.message}</p>}
                    </div>
                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Sending…" : "Send Reset Link"}
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
