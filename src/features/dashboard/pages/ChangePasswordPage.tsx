import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function ChangePasswordPage() {
    const { toast } = useToast();
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (next !== confirm) {
            toast({ variant: "destructive", title: "Passwords don't match" });
            return;
        }
        if (next.length < 8) {
            toast({ variant: "destructive", title: "Password too short", description: "Minimum 8 characters." });
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: next });
        setLoading(false);
        if (error) {
            toast({ variant: "destructive", title: "Update failed", description: error.message });
        } else {
            toast({ title: "Password updated" });
            setCurrent(""); setNext(""); setConfirm("");
        }
    };

    return (
        <div>
            <h1 className="mb-8 font-serif text-3xl font-semibold">Change Password</h1>
            <Card className="max-w-xl">
                <CardContent className="p-6">
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current">Current Password</Label>
                            <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="next">New Password</Label>
                            <Input id="next" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
                            <p className="text-xs text-text-secondary">Min 8 characters, with a letter and a number.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm">Confirm New Password</Label>
                            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                        </div>
                        <Button type="submit" disabled={loading}>{loading ? "Updating…" : "Update Password"}</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
