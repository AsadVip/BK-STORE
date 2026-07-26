import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdminStoreSettings, useUpdateStoreSettings } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

const settingsSchema = z.object({
    store_name: z.string().min(1),
    tagline: z.string().optional(),
    contact_email: z.string().email().or(z.literal("")),
    contact_phone: z.string().optional(),
    default_currency: z.string(),
    default_locale: z.string(),
    enable_guest_checkout: z.boolean(),
    enable_reviews: z.boolean(),
    enable_wishlist: z.boolean(),
    prices_tax_inclusive: z.boolean(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function AdminStoreSettingsPage() {
    const { data, isLoading } = useAdminStoreSettings();
    const updateSettings = useUpdateStoreSettings();
    const { toast } = useToast();

    const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<SettingsValues>({
        resolver: zodResolver(settingsSchema),
        values: data ? {
            store_name: data.store_name,
            tagline: data.tagline ?? "",
            contact_email: data.contact_email ?? "",
            contact_phone: data.contact_phone ?? "",
            default_currency: data.default_currency,
            default_locale: data.default_locale,
            enable_guest_checkout: data.enable_guest_checkout,
            enable_reviews: data.enable_reviews,
            enable_wishlist: data.enable_wishlist,
            prices_tax_inclusive: data.prices_tax_inclusive,
        } : undefined,
    });

    const onSubmit = async (values: SettingsValues) => {
        try {
            await updateSettings.mutateAsync(values as never);
            toast({ title: "Settings saved" });
        } catch (e) {
            toast({ variant: "destructive", title: "Save failed", description: e instanceof Error ? e.message : "" });
        }
    };

    if (isLoading || !data) return <Skeleton className="h-96 w-full rounded-2xl" />;

    const switches: { key: keyof SettingsValues; label: string; desc: string }[] = [
        { key: "enable_guest_checkout", label: "Guest Checkout", desc: "Allow checkout without an account" },
        { key: "enable_reviews", label: "Product Reviews", desc: "Enable customer reviews" },
        { key: "enable_wishlist", label: "Wishlist", desc: "Enable wishlist feature" },
        { key: "prices_tax_inclusive", label: "Tax-Inclusive Pricing", desc: "Prices include tax (VAT-style)" },
    ];

    return (
        <div>
            <h1 className="mb-6 font-serif text-2xl font-semibold">Store Settings</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
                <Card>
                    <CardContent className="space-y-4 p-6">
                        <h2 className="font-serif text-lg font-semibold">General</h2>
                        <div className="space-y-2">
                            <Label htmlFor="store_name">Store Name</Label>
                            <Input id="store_name" {...register("store_name")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tagline">Tagline</Label>
                            <Input id="tagline" {...register("tagline")} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contact_email">Contact Email</Label>
                                <Input id="contact_email" type="email" {...register("contact_email")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_phone">Contact Phone</Label>
                                <Input id="contact_phone" {...register("contact_phone")} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="default_currency">Default Currency</Label>
                                <Input id="default_currency" {...register("default_currency")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="default_locale">Default Locale</Label>
                                <Input id="default_locale" {...register("default_locale")} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="space-y-4 p-6">
                        <h2 className="font-serif text-lg font-semibold">Features</h2>
                        {switches.map((s) => (
                            <div key={s.key} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">{s.label}</p>
                                    <p className="text-xs text-text-secondary">{s.desc}</p>
                                </div>
                                <Switch
                                    checked={Boolean(watch(s.key))}
                                    onCheckedChange={(v) => setValue(s.key, v)}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save Settings"}</Button>
            </form>
        </div>
    );
}
