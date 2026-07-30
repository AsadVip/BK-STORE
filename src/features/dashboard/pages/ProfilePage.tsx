import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/app/providers/AuthProvider";
import { useUpdateProfile } from "@/features/dashboard/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const profileSchema = z.object({
    first_name: z.string().min(1, "Required"),
    last_name: z.string().min(1, "Required"),
    phone: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { profile, refreshProfile } = useAuth();
    const updateProfile = useUpdateProfile();
    const { toast } = useToast();

    const storedEmail = typeof window !== "undefined" ? localStorage.getItem("bk_customer_email") : "";
    const customerEmail = profile?.email || storedEmail;

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: profile?.first_name ?? "",
            last_name: profile?.last_name ?? "",
            phone: profile?.phone ?? "",
        },
    });

    const onSubmit = async (values: ProfileValues) => {
        try {
            await updateProfile.mutateAsync(values);
            await refreshProfile();
            toast({ title: "Profile updated" });
        } catch (e) {
            toast({ variant: "destructive", title: "Update failed", description: e instanceof Error ? e.message : "" });
        }
    };

    return (
        <div>
            <h1 className="mb-8 font-serif text-3xl font-semibold">Profile</h1>
            <Card className="max-w-xl">
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input id="first_name" {...register("first_name")} />
                                {errors.first_name && <p className="text-sm text-state-danger">{errors.first_name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input id="last_name" {...register("last_name")} />
                                {errors.last_name && <p className="text-sm text-state-danger">{errors.last_name.message}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={customerEmail || ""} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" {...register("phone")} placeholder="+1 (555) 000-0000" />
                        </div>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save Changes"}</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
