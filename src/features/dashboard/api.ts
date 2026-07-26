import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type Address = Database["public"]["Tables"]["addresses"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type Review = Database["public"]["Tables"]["reviews"]["Row"];

/**
 * Fetch the current user's orders.
 */
export function useOrders() {
    return useQuery<Order[]>({
        queryKey: ["my-orders"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .order("placed_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as Order[];
        },
        staleTime: 30 * 1000,
    });
}

/**
 * Fetch a single order with its items.
 */
export function useOrder(orderNumber: string | undefined) {
    return useQuery<{ order: Order; items: OrderItem[] } | null>({
        queryKey: ["my-order", orderNumber],
        queryFn: async () => {
            if (!orderNumber) return null;
            const { data: order, error } = await supabase
                .from("orders")
                .select("*")
                .eq("order_number", orderNumber)
                .single();
            if (error || !order) return null;
            const { data: items } = await supabase
                .from("order_items")
                .select("*")
                .eq("order_id", (order as unknown as Order).id);
            return { order: order as unknown as Order, items: (items ?? []) as unknown as OrderItem[] };
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
    return useQuery<Notification[]>({
        queryKey: ["my-notifications"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as Notification[];
        },
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
    return useQuery<Review[]>({
        queryKey: ["my-reviews"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("reviews")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as Review[];
        },
    });
}
