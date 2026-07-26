import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { useAddresses, useSaveAddress, useDeleteAddress } from "@/features/dashboard/api";
import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/types/database";

type Address = Database["public"]["Tables"]["addresses"]["Row"];

export default function AddressesPage() {
    const { user } = useAuth();
    const { data: addresses, isLoading } = useAddresses();
    const saveAddress = useSaveAddress();
    const deleteAddress = useDeleteAddress();
    const { toast } = useToast();

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Address | null>(null);
    const [form, setForm] = useState<Partial<Address>>({});

    const openNew = () => { setEditing(null); setForm({ type: "shipping", country: "US" }); setOpen(true); };
    const openEdit = (a: Address) => { setEditing(a); setForm(a); setOpen(true); };

    const save = async () => {
        try {
            await saveAddress.mutateAsync({ ...form, user_id: user!.id });
            toast({ title: "Address saved" });
            setOpen(false);
        } catch (e) {
            toast({ variant: "destructive", title: "Save failed", description: e instanceof Error ? e.message : "" });
        }
    };

    const remove = async (id: string) => {
        await deleteAddress.mutateAsync(id);
        toast({ title: "Address removed" });
    };

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <h1 className="font-serif text-3xl font-semibold">Addresses</h1>
                <Button onClick={openNew}><Plus className="h-4 w-4" /> Add Address</Button>
            </div>

            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
            ) : addresses && addresses.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                    {addresses.map((a) => (
                        <Card key={a.id}>
                            <CardContent className="p-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm font-medium capitalize">
                                        <MapPin className="h-4 w-4 text-btn-primary" /> {a.type}
                                        {a.is_default && <span className="text-xs text-btn-primary">· Default</span>}
                                    </span>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(a)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                                        <button onClick={() => remove(a.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-state-danger/10 hover:text-state-danger" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <p className="text-sm">{a.first_name} {a.last_name}</p>
                                <p className="text-sm text-text-secondary">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                                <p className="text-sm text-text-secondary">{a.city}, {a.state} {a.postal_code}</p>
                                <p className="text-sm text-text-secondary">{a.country}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState icon={MapPin} title="No addresses saved" description="Add an address for faster checkout." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Add Address</Button>} />
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editing ? "Edit Address" : "Add Address"}</DialogTitle></DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>First Name</Label><Input value={form.first_name ?? ""} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} /></div>
                            <div className="space-y-2"><Label>Last Name</Label><Input value={form.last_name ?? ""} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} /></div>
                        </div>
                        <div className="space-y-2"><Label>Address</Label><Input value={form.line1 ?? ""} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>City</Label><Input value={form.city ?? ""} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
                            <div className="space-y-2"><Label>State</Label><Input value={form.state ?? ""} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Postal Code</Label><Input value={form.postal_code ?? ""} onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))} /></div>
                            <div className="space-y-2"><Label>Country</Label><Input value={form.country ?? "US"} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                        <Button onClick={save} disabled={saveAddress.isPending}>{saveAddress.isPending ? "Saving…" : "Save"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
