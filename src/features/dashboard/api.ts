import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { useAuth } from "@/app/providers/AuthProvider";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type Address = Database["public"]["Tables"]["addresses"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type Review = Database["public"]["Tables"]["reviews"]["Row"];

/**
 * Fetch the current user's orders (filtered by user_id).
 */
/**
 * Fetch the current user's or guest's orders.
 */
export function useOrders() {
    const { user } = useAuth();
    const storedEmail = typeof window !== "undefined" ? localStorage.getItem("bk_customer_email") : null;
    const customerEmail = user?.email || storedEmail;

    return useQuery<Order[]>({
        queryKey: ["my-orders", user?.id, customerEmail],
        queryFn: async () => {
            let fetchedOrders: any[] = [];

            if (user?.id) {
                const { data } = await supabase
                    .from("orders")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("placed_at", { ascending: false });
                if (data && data.length > 0) fetchedOrders = data;
            }

            if (fetchedOrders.length === 0 && customerEmail) {
                const { data } = await supabase
                    .from("orders")
                    .select("*")
                    .or(`guest_email.eq.${customerEmail},email.eq.${customerEmail}`)
                    .order("placed_at", { ascending: false });
                if (data && data.length > 0) fetchedOrders = data;
            }

            // Fallback to local storage order history if database return is empty
            if (fetchedOrders.length === 0 && typeof window !== "undefined") {
                try {
                    const localOrders = JSON.parse(localStorage.getItem("bk_local_orders") || "[]");
                    if (Array.isArray(localOrders) && localOrders.length > 0) {
                        fetchedOrders = localOrders;
                    }
                } catch (e) {}
            }

            return fetchedOrders as unknown as Order[];
        },
        staleTime: 10 * 1000,
    });
}

/**
 * Fetch a single order with its items (with order.items JSON fallback).
 */
export function useOrder(orderNumber: string | undefined) {
    const { user } = useAuth();
    const storedEmail = typeof window !== "undefined" ? localStorage.getItem("bk_customer_email") : null;

    return useQuery<{ order: Order; items: OrderItem[] } | null>({
        queryKey: ["my-order", orderNumber, user?.id, storedEmail],
        queryFn: async () => {
            if (!orderNumber) return null;

            // Query by order_number
            let { data: order } = await supabase
                .from("orders")
                .select("*")
                .eq("order_number", orderNumber)
                .single();

            // Local fallback
            if (!order && typeof window !== "undefined") {
                try {
                    const localOrders = JSON.parse(localStorage.getItem("bk_local_orders") || "[]");
                    order = localOrders.find((o: any) => o.order_number === orderNumber) || null;
                } catch (e) {}
            }

            if (!order) return null;

            // Fetch order_items relational rows
            const { data: dbItems } = await supabase
                .from("order_items")
                .select("*")
                .eq("order_id", (order as any).id);

            let finalItems = dbItems ?? [];

            // If relational order_items is empty, extract items from JSON snapshot on orders row
            if (finalItems.length === 0 && (order as any).items && Array.isArray((order as any).items)) {
                finalItems = (order as any).items.map((it: any, idx: number) => ({
                    id: it.id || `item-${idx}`,
                    order_id: (order as any).id,
                    product_id: it.product_id || `prod-${idx}`,
                    variant_id: it.variant_id ?? null,
                    product_name: it.product_name || it.name || "Product Item",
                    variant_name: it.variant_name ?? null,
                    unit_price: Number(it.unit_price || it.price || 0),
                    quantity: Number(it.quantity || 1),
                    total_price: Number(it.total_price || it.line_total || (it.price * it.quantity) || 0),
                    created_at: (order as any).created_at || new Date().toISOString(),
                }));
            }

            return { order: order as unknown as Order, items: finalItems as unknown as OrderItem[] };
        },
        enabled: !!orderNumber,
    });
}

/**
 * Fetch the user's addresses.
 */
export function useAddresses() {
    return useQuery<Address[]>({
        queryKey: ["my-addresses"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("addresses")
                .select("*")
                .is("deleted_at", null)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as Address[];
        },
    });
}

export function useSaveAddress() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: Partial<Address> & { id?: string }) => {
            if (input.id) {
                const { data, error } = await supabase
                    .from("addresses")
                    .update(input as never)
                    .eq("id", input.id)
                    .select()
                    .single();
                if (error) throw error;
                return data;
            }
            const { data, error } = await supabase.from("addresses").insert(input as never).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["my-addresses"] }),
    });
}

export function useDeleteAddress() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await supabase.from("addresses").update({ deleted_at: new Date().toISOString() } as never).eq("id", id);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["my-addresses"] }),
    });
}

/**
 * Update the user's profile.
 */
export function useUpdateProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: Partial<Profile>) => {
            const { data, error } = await supabase.from("profiles").update(input as never).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
    });
}

/**
 * Fetch the user's notifications.
 */
export function useNotifications() {
    const { user } = useAuth();
    return useQuery<Notification[]>({
        queryKey: ["my-notifications", user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as Notification[];
        },
        enabled: !!user?.id,
    });
}

export function useMarkNotificationRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() } as never).eq("id", id);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["my-notifications"] }),
    });
}

/**
 * Fetch the user's reviews.
 */
export function useMyReviews() {
    const { user } = useAuth();
    return useQuery<Review[]>({
        queryKey: ["my-reviews", user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data, error } = await supabase
                .from("reviews")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as Review[];
        },
        enabled: !!user?.id,
    });
}
