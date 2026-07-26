import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdminStoreSettings, useUpdateStoreSettings } from "@/features/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

const websiteSchema = z.object({
    logo_url: z.string().optional(),
    contact_email: z.string().email().or(z.literal("")),
    contact_phone: z.string().optional(),
    address: z.string().optional(),
    social_links: z.string().optional(), // JSON string of social links
});

type WebsiteValues = z.infer<typeof websiteSchema>;

export default function AdminWebsiteSettingsPage() {
    const { data, isLoading } = useAdminStoreSettings();
    const updateSettings = useUpdateStoreSettings();
    const { toast } = useToast();

    const { register, handleSubmit, formState: { isSubmitting } } = useForm<WebsiteValues>({
        resolver: zodResolver(websiteSchema),
        values: data
            ? {
                logo_url: data.logo_url ?? "",
                contact_email: data.contact_email ?? "",
                contact_phone: data.contact_phone ?? "",
                address: data.address ?? "",
                social_links:
                    typeof data.social_links === "string"
                        ? data.social_links
                        : JSON.stringify(data.social_links ?? {}, null, 2),
            }
            : undefined,
    });

    const onSubmit = async (values: WebsiteValues) => {
        try {
            let socialLinks: unknown = values.social_links;
            if (values.social_links) {
                try {
                    socialLinks = JSON.parse(values.social_links);
                } catch {
                    // keep as string if invalid JSON
                }
            }
            await updateSettings.mutateAsync({
                logo_url: values.logo_url || null,
                contact_email: values.contact_email || null,
                contact_phone: values.contact_phone || null,
                address: values.address || null,
                social_links: socialLinks as never,
            } as never);
            toast({ title: "Website settings saved", variant: "success" });
        } catch (e) {
            toast({
                variant: "destructive",
                title: "Save failed",
                description: e instanceof Error ? e.message : "",
            });
        }
    };

    if (isLoading || !data) return <Skeleton className="h-96 w-full rounded-2xl" />;

    return (
        <div>
            <h1 className="mb-6 font-serif text-2xl font-semibold">Website Settings</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
                <Card>
                    <CardContent className="space-y-4 p-6">
                        <h2 className="font-serif text-lg font-semibold">Branding</h2>
                        <div className="space-y-2">
                            <Label htmlFor="logo_url">Logo URL</Label>
                            <Input id="logo_url" placeholder="https://…" {...register("logo_url")} />
                        </div>
                        {data.logo_url && (
                            <img
                                src={data.logo_url}
                                alt="Logo preview"
                                className="h-16 w-auto rounded-lg border border-border bg-bg-secondary p-2"
                            />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="space-y-4 p-6">
                        <h2 className="font-serif text-lg font-semibold">Contact Information</h2>
                        <div className="space-y-2">
                            <Label htmlFor="contact_email">Contact Email</Label>
                            <Input id="contact_email" type="email" {...register("contact_email")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_phone">Contact Phone</Label>
                            <Input id="contact_phone" {...register("contact_phone")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" rows={3} {...register("address")} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="space-y-4 p-6">
                        <h2 className="font-serif text-lg font-semibold">Social Links</h2>
                        <p className="text-xs text-text-secondary">
                            Edit the JSON object below with your social profile URLs.
                        </p>
                        <div className="space-y-2">
                            <Label htmlFor="social_links">Social Links (JSON)</Label>
                            <Textarea
                                id="social_links"
                                rows={6}
                                className="font-mono text-xs"
                                {...register("social_links")}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? "Saving…" : "Save Website Settings"}
                </Button>
            </form>
        </div>
    );
}
