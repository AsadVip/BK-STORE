import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type Coupon = Database["public"]["Tables"]["coupons"]["Row"];
type Review = Database["public"]["Tables"]["reviews"]["Row"];
type AdminRole = Database["public"]["Tables"]["admin_roles"]["Row"];
type AdminPermission = Database["public"]["Tables"]["admin_permissions"]["Row"];
type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Brand = Database["public"]["Tables"]["brands"]["Row"];
type Banner = Database["public"]["Tables"]["banners"]["Row"];
type DiscountCampaign = Database["public"]["Tables"]["discount_campaigns"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
type ShippingMethod = Database["public"]["Tables"]["shipping_methods"]["Row"];
type TaxRule = Database["public"]["Tables"]["tax_rules"]["Row"];
type NotificationTemplate = Database["public"]["Tables"]["notification_templates"]["Row"];
type MediaAsset = Database["public"]["Tables"]["media_assets"]["Row"];
type SeoMetadata = Database["public"]["Tables"]["seo_metadata"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

/**
 * Admin dashboard KPIs.
 */
export function useAdminKpis() {
    return useQuery({
        queryKey: ["admin-kpis"],
        queryFn: async () => {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

            const [ordersToday, allOrders, customers, lowStock] = await Promise.all([
                supabase.from("orders").select("*", { count: "exact" }).gte("placed_at", todayStart),
                supabase.from("orders").select("grand_total, status, placed_at"),
                supabase.from("profiles").select("*", { count: "exact" }),
                supabase.from("product_variants").select("*").lt("stock_quantity", 5).eq("is_active", true),
            ]);

            const orderRows = (allOrders.data ?? []) as unknown as { grand_total: number; status: string; placed_at: string }[];
            const totalRevenue = orderRows.reduce((sum, o) => sum + Number(o.grand_total), 0);
            const todayRevenue = orderRows
                .filter((o) => new Date(o.placed_at) >= new Date(todayStart))
                .reduce((sum, o) => sum + Number(o.grand_total), 0);

            return {
                totalRevenue,
                todayRevenue,
                ordersToday: ordersToday.count ?? 0,
                totalOrders: orderRows.length,
                newCustomers: customers.count ?? 0,
                lowStockCount: (lowStock.data ?? []).length,
                recentOrders: orderRows.slice(0, 10),
            };
        },
        staleTime: 30 * 1000,
    });
}

/**
 * Admin product list.
 */
export function useAdminProducts() {
    return useQuery<(Product & {
        stock_quantity: number;
        images: { id?: string; url: string; is_primary: boolean; sort_order: number }[];
        variants: { id?: string; name: string; sku: string; price: number; stock_quantity: number }[];
        categories?: { id: string; name: string }[];
    })[]>({
        queryKey: ["admin-products"],
        queryFn: async () => {
            let { data: products, error } = await supabase
                .from("products")
                .select("*")
                .is("deleted_at", null)
                .order("sort_order" as any, { ascending: true })
                .order("created_at", { ascending: false });

            if (error || !products) {
                const retry = await supabase.from("products").select("*");
                products = retry.data;
            }

            const productList = (products ?? []) as any[];
            const productIds = productList.map((p) => p.id);

            const imageMap = new Map<string, any[]>();
            const variantMap = new Map<string, any[]>();
            const categoryMap = new Map<string, any[]>();

            if (productIds.length > 0) {
                // Safe fetch images
                try {
                    const { data: images } = await supabase
                        .from("product_images")
                        .select("id, product_id, url, is_primary, sort_order")
                        .in("product_id", productIds)
                        .order("sort_order", { ascending: true });

                    (images ?? []).forEach((img: any) => {
                        const list = imageMap.get(img.product_id) || [];
                        list.push(img);
                        imageMap.set(img.product_id, list);
                    });
                } catch (e) {
                    console.warn("Notice loading product_images:", e);
                }

                // Safe fetch variants
                try {
                    const { data: variants } = await supabase
                        .from("product_variants")
                        .select("id, product_id, name, sku, price, compare_at_price, stock_quantity, is_active, option_values")
                        .in("product_id", productIds);

                    (variants ?? []).forEach((v: any) => {
                        const list = variantMap.get(v.product_id) || [];
                        const variantImg = v.image_url || (typeof v.option_values === "object" && v.option_values !== null ? (v.option_values as any).image_url : null);
                        list.push({ ...v, image_url: variantImg });
                        variantMap.set(v.product_id, list);
                    });
                } catch (e) {
                    console.warn("Notice loading product_variants:", e);
                }

                // Safe fetch categories
                try {
                    const { data: pcLinks } = await supabase
                        .from("product_categories")
                        .select("product_id, category_id")
                        .in("product_id", productIds);

                    if (pcLinks && pcLinks.length > 0) {
                        const catIds = [...new Set(pcLinks.map((l: any) => l.category_id))];
                        const { data: cats } = await supabase
                            .from("categories")
                            .select("id, name")
                            .in("id", catIds);

                        const catObjMap = new Map<string, { id: string; name: string }>();
                        (cats ?? []).forEach((c: any) => catObjMap.set(c.id, c));

                        (pcLinks ?? []).forEach((link: any) => {
                            const cObj = catObjMap.get(link.category_id);
                            if (cObj) {
                                const list = categoryMap.get(link.product_id) || [];
                                list.push(cObj);
                                categoryMap.set(link.product_id, list);
                            }
                        });
                    }
                } catch (e) {
                    console.warn("Notice loading categories:", e);
                }
            }

            return productList.map((p: any) => {
                const pVariants = variantMap.get(p.id) || [];
                const pImages = imageMap.get(p.id) || [];
                const pCategories = categoryMap.get(p.id) || [];
                const totalStock = pVariants.length > 0
                    ? pVariants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0)
                    : 50;

                const isWomen = p.is_women === true || p.vendor_id === "women" || (typeof p.meta_description === "string" && p.meta_description.includes('"is_women":true'));
                const isMen = p.is_men !== undefined && p.is_men !== null
                    ? !!p.is_men
                    : (p.vendor_id === "men" || p.vendor_id === "unisex" || (typeof p.meta_description === "string" && p.meta_description.includes('"is_men":true')) || !isWomen);

                return {
                    ...p,
                    is_men: isMen,
                    is_women: isWomen,
                    stock_quantity: totalStock,
                    images: pImages,
                    variants: pVariants,
                    categories: pCategories,
                };
            });
        },
    });
}

export function useDeleteProduct() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await supabase
                .from("products")
                .update({ deleted_at: new Date().toISOString() } as never)
                .eq("id", id);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-products"] });
            qc.invalidateQueries({ queryKey: ["products"] });
        },
    });
}

/**
 * Admin orders list.
 */
export function useAdminOrders() {
    return useQuery<Order[]>({
        queryKey: ["admin-orders"],
        queryFn: async () => {
            let dbOrders: any[] = [];
            try {
                let { data, error } = await supabase
                    .from("orders")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (error || !data) {
                    const retry = await supabase.from("orders").select("*");
                    data = retry.data;
                }
                dbOrders = data ?? [];
            } catch (e) {
                console.warn("DB orders fetch notice:", e);
            }

            let localOrders: any[] = [];
            try {
                localOrders = JSON.parse(localStorage.getItem("bk_local_orders") || "[]");
            } catch (e) {}

            // Merge DB and local orders, prioritizing freshest order
            const mergedMap = new Map<string, any>();

            // First add local orders
            localOrders.forEach((o) => {
                const key = o.order_number || o.id;
                if (key) mergedMap.set(key, o);
            });

            // Then layer DB orders over local, preserving items payload
            dbOrders.forEach((o) => {
                const key = o.order_number || o.id;
                if (key) {
                    const existing = mergedMap.get(key);
                    mergedMap.set(key, {
                        ...existing,
                        ...o,
                        items: o.items || o.order_items || existing?.items || existing?.order_items || null,
                        order_items: o.order_items || o.items || existing?.order_items || existing?.items || null,
                    });
                }
            });

            const combinedList = Array.from(mergedMap.values()).sort((a, b) => {
                const timeA = new Date(a.placed_at || a.created_at || 0).getTime();
                const timeB = new Date(b.placed_at || b.created_at || 0).getTime();
                return timeB - timeA;
            });

            return combinedList.map((o: any) => ({
                ...o,
                grand_total: o.grand_total ?? o.total_amount ?? 0,
                placed_at: o.placed_at ?? o.created_at ?? new Date().toISOString(),
                guest_email: o.guest_email ?? o.email ?? "Customer",
            })) as unknown as Order[];
        },
    });
}

/** Fetch order items for a specific order */
export function useAdminOrderItems(orderId: string | null, orderObj?: any) {
    return useQuery({
        queryKey: ["admin-order-items", orderId, orderObj?.items, orderObj?.order_items, orderObj?.grand_total],
        queryFn: async () => {
            if (!orderId) return [];

            // 1. Check if the order object contains JSON items array directly (including shipping_address payload)
            const sa = typeof orderObj?.shipping_address === "object" ? orderObj.shipping_address : {};
            const embeddedItems = orderObj?.items || orderObj?.order_items || orderObj?.cart_items || sa?.items || sa?.cart_items || sa?.order_items;
            if (Array.isArray(embeddedItems) && embeddedItems.length > 0) {
                return embeddedItems.map((item: any, i: number) => {
                    const qty = Number(item.quantity) || 1;
                    const price = Number(item.unit_price) || Number(item.price) || 0;
                    return {
                        id: item.id || item.variant_id || item.product_id || `item-${i}`,
                        product_name: item.product_name || item.name || item.title || "Product Item",
                        variant_name: item.variant_name || null,
                        quantity: qty,
                        unit_price: price,
                        total_price: item.total_price || (price * qty),
                    };
                });
            }

            // 2. Query order_items table for this order
            const { data: rawItems } = await (supabase.from("order_items" as never) as any)
                .select("*")
                .eq("order_id", orderId);

            if (rawItems && rawItems.length > 0) {
                const productIds = rawItems.map((i: any) => i.product_id).filter(Boolean);
                const productMap = new Map<string, string>();

                if (productIds.length > 0) {
                    const { data: prods } = await supabase
                        .from("products")
                        .select("id, name")
                        .in("id", productIds);

                    (prods ?? []).forEach((p: any) => {
                        productMap.set(p.id, p.name);
                    });
                }

                return rawItems.map((item: any) => {
                    const qty = Number(item.quantity) || 1;
                    const uPrice = Number(item.unit_price) || 0;
                    return {
                        ...item,
                        product_name: productMap.get(item.product_id) || item.product_name || item.name || item.title || "Product Item",
                        quantity: qty,
                        unit_price: uPrice,
                        total_price: Number(item.total_price) || (uPrice * qty),
                    };
                });
            }

            // 3. If no order items recorded (legacy order placed before schema update), return empty array
            return [];
        },
        enabled: !!orderId,
    });
}

export function useUpdateOrderStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status, orderNumber }: { id: string; status: string; orderNumber?: string }) => {
            // Update Supabase DB
            try {
                if (id && !id.startsWith("local-")) {
                    await supabase.from("orders").update({ status } as never).eq("id", id);
                } else if (orderNumber) {
                    await (supabase.from("orders" as never) as any).update({ status }).eq("order_number", orderNumber);
                }
            } catch (e) {
                console.warn("Status DB update notice:", e);
            }

            // Update Local Storage sync store
            let updatedOrder: any = null;
            try {
                const local: any[] = JSON.parse(localStorage.getItem("bk_local_orders") || "[]");
                const updatedList = local.map((o) => {
                    if (o.id === id || (orderNumber && o.order_number === orderNumber)) {
                        updatedOrder = { ...o, status };
                        return updatedOrder;
                    }
                    return o;
                });
                localStorage.setItem("bk_local_orders", JSON.stringify(updatedList));
            } catch (e) {}

            if (!updatedOrder) {
                updatedOrder = { id, order_number: orderNumber, status };
            }

            // Broadcast real-time status change event to customer tracking page
            try {
                const bc = new BroadcastChannel("bk_orders_channel");
                bc.postMessage({ type: "STATUS_CHANGED", order: updatedOrder });
                bc.close();
            } catch (e) {}

            window.dispatchEvent(new CustomEvent("bk_order_event", { detail: { action: "updated", order: updatedOrder } }));
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
    });
}

/**
 * Admin coupons.
 */
export function useAdminCoupons() {
    return useQuery<Coupon[]>({
        queryKey: ["admin-coupons"],
        queryFn: async () => {
            const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as Coupon[];
        },
    });
}

/**
 * Admin reviews (for moderation).
 */
export function useAdminReviews() {
    return useQuery<Review[]>({
        queryKey: ["admin-reviews"],
        queryFn: async () => {
            const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as Review[];
        },
    });
}

export function useModerateReview() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
            await supabase.from("reviews").update({ status } as never).eq("id", id);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-reviews"] });
            qc.invalidateQueries({ queryKey: ["product-reviews"] });
        },
    });
}

/**
 * Admin roles & permissions.
 */
export function useAdminRoles() {
    return useQuery<AdminRole[]>({
        queryKey: ["admin-roles"],
        queryFn: async () => {
            const { data, error } = await supabase.from("admin_roles").select("*").order("name");
            if (error) throw error;
            return (data ?? []) as unknown as AdminRole[];
        },
    });
}

export function useAdminPermissions() {
    return useQuery<AdminPermission[]>({
        queryKey: ["admin-permissions"],
        queryFn: async () => {
            const { data, error } = await supabase.from("admin_permissions").select("*").order("module");
            if (error) throw error;
            return (data ?? []) as unknown as AdminPermission[];
        },
    });
}

/**
 * Audit logs.
 */
export function useAuditLogs() {
    return useQuery<AuditLog[]>({
        queryKey: ["audit-logs"],
        queryFn: async () => {
            const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
            if (error) throw error;
            return (data ?? []) as unknown as AuditLog[];
        },
    });
}

/**
 * Store settings (admin).
 */
export function useAdminStoreSettings() {
    return useQuery<StoreSettings>({
        queryKey: ["admin-store-settings"],
        queryFn: async () => {
            const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
            if (error) throw error;
            return data as unknown as StoreSettings;
        },
    });
}

export function useUpdateStoreSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: Partial<StoreSettings>) => {
            await supabase.from("store_settings").update(input as never).eq("id", 1);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-store-settings"] });
            qc.invalidateQueries({ queryKey: ["store-settings"] });
        },
    });
}

/**
 * Admin categories.
 */
export function useAdminCategories() {
    return useQuery<Category[]>({
        queryKey: ["admin-categories"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .is("deleted_at", null)
                .order("sort_order", { ascending: true });
            if (error) throw error;
            return (data ?? []) as unknown as Category[];
        },
    });
}

export function useDeleteCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await supabase
                .from("categories")
                .update({ deleted_at: new Date().toISOString() } as never)
                .eq("id", id);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-categories"] });
            qc.invalidateQueries({ queryKey: ["categories"] });
        },
    });
}

/**
 * Admin brands.
 */
export function useAdminBrands() {
    return useQuery<Brand[]>({
        queryKey: ["admin-brands"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("brands")
                .select("*")
                .is("deleted_at", null)
                .order("name", { ascending: true });
            if (error) throw error;
            return (data ?? []) as unknown as Brand[];
        },
    });
}

export function useDeleteBrand() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await supabase
                .from("brands")
                .update({ deleted_at: new Date().toISOString() } as never)
                .eq("id", id);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-brands"] });
            qc.invalidateQueries({ queryKey: ["brands"] });
        },
    });
}

/**
 * Admin banners.
 */
export function useAdminBanners() {
    return useQuery<Banner[]>({
        queryKey: ["admin-banners"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("banners")
                .select("*")
                .order("sort_order", { ascending: true });
            if (error) throw error;
            return (data ?? []) as unknown as Banner[];
        },
    });
}

export function useDeleteBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await supabase.from("banners").delete().eq("id", id);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-banners"] });
            qc.invalidateQueries({ queryKey: ["banners"] });
        },
    });
}

export function useToggleBannerPublished() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
            await supabase.from("banners").update({ is_published } as never).eq("id", id);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-banners"] });
            qc.invalidateQueries({ queryKey: ["banners"] });
        },
    });
}

/**
 * Admin discount campaigns.
 */
export function useAdminCampaigns() {
    return useQuery<DiscountCampaign[]>({
        queryKey: ["admin-campaigns"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("discount_campaigns")
                .select("*")
                .order("starts_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as DiscountCampaign[];
        },
    });
}

export function useDeleteCampaign() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await supabase.from("discount_campaigns").delete().eq("id", id);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-campaigns"] }),
    });
}

export function useToggleCampaignActive() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            await supabase.from("discount_campaigns").update({ is_active } as never).eq("id", id);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-campaigns"] }),
    });
}
export interface FlashSaleConfig {
    is_active: boolean;
    sale_title: string;
    discount_percentage: number;
    badge_text: string;
    ends_at: string;
}

export function useFlashSaleSetting() {
    return useQuery<FlashSaleConfig>({
        queryKey: ["flash-sale-config"],
        queryFn: async () => {
            // Try fetching from store_sales table first
            const { data: sales } = await (supabase.from("store_sales" as never) as any)
                .select("*")
                .order("created_at", { ascending: false })
                .limit(1);

            if (sales && sales.length > 0) {
                const s = sales[0];
                return {
                    is_active: s.is_active ?? true,
                    sale_title: s.sale_title || "MEGA FLASH SALE",
                    discount_percentage: Number(s.discount_percentage) || 40,
                    badge_text: s.badge_text || "Upto 40% OFF",
                    ends_at: s.ends_at || new Date(Date.now() + 3 * 86400000).toISOString(),
                };
            }

            // Fallback to localStorage / default
            const local = localStorage.getItem("bk_flash_sale_config");
            if (local) {
                try { return JSON.parse(local); } catch (e) { /* ignore */ }
            }

            return {
                is_active: true,
                sale_title: "MEGA FLASH SALE",
                discount_percentage: 40,
                badge_text: "Upto 40% OFF",
                ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            };
        },
    });
}

export function useUpdateFlashSale() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (config: FlashSaleConfig) => {
            // Save to localStorage for instant reliable sync
            localStorage.setItem("bk_flash_sale_config", JSON.stringify(config));

            // Try upserting to store_sales table
            try {
                await (supabase.from("store_sales" as never) as any).insert({
                    sale_title: config.sale_title,
                    discount_percentage: config.discount_percentage,
                    badge_text: config.badge_text,
                    ends_at: config.ends_at,
                    is_active: config.is_active,
                });
            } catch (err) {
                console.warn("store_sales insert warning:", err);
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["flash-sale-config"] });
            qc.invalidateQueries({ queryKey: ["products"] });
        },
    });
}

/**
 * Admin customers (profiles).
 */
export function useAdminCustomers() {
    return useQuery<Profile[]>({
        queryKey: ["admin-customers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .is("deleted_at", null)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as Profile[];
        },
    });
}

/**
 * Admin inventory (product variants with stock).
 */
export function useAdminInventory() {
    return useQuery<ProductVariant[]>({
        queryKey: ["admin-inventory"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("product_variants")
                .select("*")
                .is("deleted_at", null)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as ProductVariant[];
        },
    });
}

export function useUpdateVariantStock() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, stock_quantity }: { id: string; stock_quantity: number }) => {
            await supabase
                .from("product_variants")
                .update({ stock_quantity } as never)
                .eq("id", id);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-inventory"] }),
    });
}

/**
 * Admin shipping methods.
 */
export function useAdminShippingMethods() {
    return useQuery<ShippingMethod[]>({
        queryKey: ["admin-shipping-methods"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("shipping_methods")
                .select("*")
                .order("sort_order", { ascending: true });
            if (error) throw error;
            return (data ?? []) as unknown as ShippingMethod[];
        },
    });
}

export function useDeleteShippingMethod() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await supabase.from("shipping_methods").delete().eq("id", id);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shipping-methods"] }),
    });
}

export function useToggleShippingMethod() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            await supabase.from("shipping_methods").update({ is_active } as never).eq("id", id);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shipping-methods"] }),
    });
}

/**
 * Admin tax rules.
 */
export function useAdminTaxRules() {
    return useQuery<TaxRule[]>({
        queryKey: ["admin-tax-rules"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tax_rules")
                .select("*")
                .order("country", { ascending: true });
            if (error) throw error;
            return (data ?? []) as unknown as TaxRule[];
        },
    });
}

export function useDeleteTaxRule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await supabase.from("tax_rules").delete().eq("id", id);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tax-rules"] }),
    });
}

export function useToggleTaxRule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            await supabase.from("tax_rules").update({ is_active } as never).eq("id", id);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tax-rules"] }),
    });
}

/**
 * Admin notification templates.
 */
export function useAdminNotificationTemplates() {
    return useQuery<NotificationTemplate[]>({
        queryKey: ["admin-notification-templates"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("notification_templates")
                .select("*")
                .order("event_type", { ascending: true });
            if (error) throw error;
            return (data ?? []) as unknown as NotificationTemplate[];
        },
    });
}

export function useToggleNotificationTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            await supabase
                .from("notification_templates")
                .update({ is_active } as never)
                .eq("id", id);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notification-templates"] }),
    });
}

/**
 * Admin media assets.
 */
export function useAdminMedia() {
    return useQuery<MediaAsset[]>({
        queryKey: ["admin-media"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("media_assets")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as MediaAsset[];
        },
    });
}

export function useDeleteMedia() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (asset: { id: string; storage_path: string }) => {
            // Remove from storage bucket then delete the DB row.
            await supabase.storage.from("media").remove([asset.storage_path]);
            await supabase.from("media_assets").delete().eq("id", asset.id);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-media"] }),
    });
}

/**
 * Admin SEO metadata.
 */
export function useAdminSeo() {
    return useQuery<SeoMetadata[]>({
        queryKey: ["admin-seo"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("seo_metadata")
                .select("*")
                .order("updated_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as SeoMetadata[];
        },
    });
}

export function useDeleteSeo() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await supabase.from("seo_metadata").delete().eq("id", id);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-seo"] }),
    });
}

/**
 * Admin order items (for reports/analytics).
 */
export function useAdminAllOrderItems() {
    return useQuery<OrderItem[]>({
        queryKey: ["admin-all-order-items"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("order_items")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as unknown as OrderItem[];
        },
    });
}

// ---------------------------------------------------------------------------
// Create mutations — power the "Add" buttons across the admin panel.
// ---------------------------------------------------------------------------

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
type BrandInsert = Database["public"]["Tables"]["brands"]["Insert"];
type BannerInsert = Database["public"]["Tables"]["banners"]["Insert"];
type CouponInsert = Database["public"]["Tables"]["coupons"]["Insert"];
type CampaignInsert = Database["public"]["Tables"]["discount_campaigns"]["Insert"];
type ShippingMethodInsert = Database["public"]["Tables"]["shipping_methods"]["Insert"];
type TaxRuleInsert = Database["public"]["Tables"]["tax_rules"]["Insert"];
type SeoInsert = Database["public"]["Tables"]["seo_metadata"]["Insert"];
type NotificationTemplateInsert = Database["public"]["Tables"]["notification_templates"]["Insert"];
type MediaAssetInsert = Database["public"]["Tables"]["media_assets"]["Insert"];

/** Create a new product (optionally attaching multiple images and variants). */
export function useCreateProduct() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: any) => {
            const {
                images = [],
                variants = [],
                image_url,
                stock_quantity = 50,
                is_new_arrival,
                is_best_seller,
                is_featured,
                ...cleanInput
            } = input;

            // 1. Insert product record
            const { data, error } = await supabase
                .from("products")
                .insert({
                    name: cleanInput.name,
                    slug: cleanInput.slug,
                    description: cleanInput.description || null,
                    status: cleanInput.status || "published",
                    base_price: cleanInput.base_price,
                    compare_at_price: cleanInput.compare_at_price || null,
                    currency: cleanInput.currency || "PKR",
                } as never)
                .select()
                .single();

            if (error) {
                console.error("Product insert error:", error);
                throw new Error(error.message || "Failed to insert product row");
            }

            const product = data as unknown as Product;

            if (product?.id) {
                const genderTag = `__GENDER:${JSON.stringify({ is_men: !!input.is_men, is_women: !!input.is_women })}__`;
                const vendorId = input.is_women ? (input.is_men ? "unisex" : "women") : "men";

                // Placement & Gender flags
                try {
                    await supabase
                        .from("products")
                        .update({
                            is_new_arrival: !!is_new_arrival,
                            is_best_seller: !!is_best_seller,
                            is_featured: !!is_featured,
                            is_men: input.is_men !== undefined ? !!input.is_men : true,
                            is_women: !!input.is_women,
                            vendor_id: vendorId,
                            meta_description: genderTag,
                        } as never)
                        .eq("id", product.id);
                } catch (e) {
                    console.warn("Placement flags update notice:", e);
                }

                // 2. Insert Multiple Images
                const finalImages = Array.isArray(images) && images.length > 0
                    ? images
                    : image_url
                    ? [{ url: image_url, is_primary: true }]
                    : [];

                if (finalImages.length > 0) {
                    try {
                        const imageInserts = finalImages.map((img: any, idx: number) => ({
                            product_id: product.id,
                            url: typeof img === "string" ? img : img.url,
                            storage_path: typeof img === "string" ? img : img.url,
                            alt_text: cleanInput.name,
                            is_primary: typeof img === "object" ? !!img.is_primary : idx === 0,
                            sort_order: idx,
                        }));
                        await supabase.from("product_images").insert(imageInserts as never);

                        const primaryObj = finalImages.find((img: any) => typeof img === "object" && img.is_primary) || finalImages[0];
                        const primaryUrl = typeof primaryObj === "string" ? primaryObj : primaryObj?.url;
                        if (primaryUrl) {
                            await supabase.from("products").update({ primary_image_url: primaryUrl } as never).eq("id", product.id);
                        }
                    } catch (e) {
                        console.warn("Product images insert notice:", e);
                    }
                }

                // 3. Insert Product Variants
                const finalVariants = Array.isArray(variants) && variants.length > 0
                    ? variants
                    : [{ name: "Standard", sku: `${cleanInput.slug}-${Date.now()}`, price: cleanInput.base_price, stock_quantity: Number(stock_quantity) || 50 }];

                try {
                    const variantInserts = finalVariants.map((v: any, idx: number) => ({
                        product_id: product.id,
                        title: v.name || "Default",
                        name: v.name || "Default",
                        sku: v.sku?.trim() || `${cleanInput.slug}-${idx + 1}-${Date.now()}`,
                        price: Number(v.price) >= 0 ? Number(v.price) : cleanInput.base_price,
                        compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : (cleanInput.compare_at_price || null),
                        stock_quantity: Number(v.stock_quantity) >= 0 ? Number(v.stock_quantity) : 0,
                        is_active: true,
                        option_values: v.image_url ? { image_url: v.image_url } : (v.option_values || {}),
                    }));
                    await supabase.from("product_variants").insert(variantInserts as never);
                } catch (e) {
                    console.warn("Product variants insert notice:", e);
                }

                // 4. Map Category if provided
                if (cleanInput.category_id) {
                    try {
                        await supabase.from("product_categories").insert({
                            product_id: product.id,
                            category_id: cleanInput.category_id,
                        } as never);
                    } catch (e) {
                        console.warn("Category link notice:", e);
                    }
                }
            }

            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries();
        },
    });
}

/** Update an existing product. */
export function useUpdateProduct() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: any) => {
            const {
                id,
                images,
                variants,
                image_url,
                stock_quantity,
                is_new_arrival,
                is_best_seller,
                is_featured,
                ...cleanInput
            } = input;

            // 1. Update core product row
            const { data, error } = await supabase
                .from("products")
                .update({
                    name: cleanInput.name,
                    slug: cleanInput.slug,
                    description: cleanInput.description || null,
                    status: cleanInput.status || "published",
                    base_price: cleanInput.base_price,
                    compare_at_price: cleanInput.compare_at_price || null,
                    currency: cleanInput.currency || "PKR",
                } as never)
                .eq("id", id)
                .select()
                .single();

            if (error) {
                console.error("Product update error:", error);
                throw new Error(error.message || "Failed to update product");
            }

            // 2. Placement & Gender flags
            const genderTag = `__GENDER:${JSON.stringify({ is_men: !!input.is_men, is_women: !!input.is_women })}__`;
            const vendorId = input.is_women ? (input.is_men ? "unisex" : "women") : "men";

            try {
                await supabase
                    .from("products")
                    .update({
                        is_new_arrival: !!is_new_arrival,
                        is_best_seller: !!is_best_seller,
                        is_featured: !!is_featured,
                        is_men: input.is_men !== undefined ? !!input.is_men : true,
                        is_women: !!input.is_women,
                        vendor_id: vendorId,
                        meta_description: genderTag,
                    } as never)
                    .eq("id", id);
            } catch (e) {
                console.warn("Placement update notice:", e);
            }

            // 3. Sync Images
            if (images !== undefined || image_url !== undefined) {
                try {
                    await supabase.from("product_images").delete().eq("product_id", id);
                    const finalImages = Array.isArray(images) && images.length > 0
                        ? images
                        : image_url
                        ? [{ url: image_url, is_primary: true }]
                        : [];

                    if (finalImages.length > 0) {
                        const imageInserts = finalImages.map((img: any, idx: number) => ({
                            product_id: id,
                            url: typeof img === "string" ? img : img.url,
                            storage_path: typeof img === "string" ? img : img.url,
                            alt_text: cleanInput.name,
                            is_primary: typeof img === "object" ? !!img.is_primary : idx === 0,
                            sort_order: idx,
                        }));
                        await supabase.from("product_images").insert(imageInserts as never);

                        const primaryObj = finalImages.find((img: any) => typeof img === "object" && img.is_primary) || finalImages[0];
                        const primaryUrl = typeof primaryObj === "string" ? primaryObj : primaryObj?.url;
                        if (primaryUrl) {
                            await supabase.from("products").update({ primary_image_url: primaryUrl } as never).eq("id", id);
                        }
                    }
                } catch (e) {
                    console.warn("Image sync notice:", e);
                }
            }

            // 4. Sync Variants
            if (variants !== undefined || stock_quantity !== undefined) {
                try {
                    await supabase.from("product_variants").delete().eq("product_id", id);
                    const finalVariants = Array.isArray(variants) && variants.length > 0
                        ? variants
                        : [{ name: "Standard", sku: `${cleanInput.slug}-${Date.now()}`, price: cleanInput.base_price, stock_quantity: Number(stock_quantity || 50) }];

                    const variantInserts = finalVariants.map((v: any, idx: number) => ({
                        product_id: id,
                        title: v.name || "Default",
                        name: v.name || "Default",
                        sku: v.sku?.trim() || `${cleanInput.slug}-${idx + 1}-${Date.now()}`,
                        price: Number(v.price) >= 0 ? Number(v.price) : cleanInput.base_price,
                        compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : (cleanInput.compare_at_price || null),
                        stock_quantity: Number(v.stock_quantity) >= 0 ? Number(v.stock_quantity) : 0,
                        is_active: true,
                        option_values: v.image_url ? { image_url: v.image_url } : (v.option_values || {}),
                    }));
                    await supabase.from("product_variants").insert(variantInserts as never);
                } catch (e) {
                    console.warn("Variant sync notice:", e);
                }
            }

            // 5. Sync Category link
            if (cleanInput.category_id !== undefined) {
                try {
                    await supabase.from("product_categories").delete().eq("product_id", id);
                    if (cleanInput.category_id) {
                        await supabase.from("product_categories").insert({
                            product_id: id,
                            category_id: cleanInput.category_id,
                        } as never);
                    }
                } catch (e) {
                    console.warn("Category update notice:", e);
                }
            }

            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries();
        },
    });
}

/** Batch update product sort_order (Manual Drag & Drop). */
export function useUpdateProductOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (items: { id: string; sort_order: number }[]) => {
            const updates = items.map(({ id, sort_order }) =>
                supabase.from("products").update({ sort_order } as never).eq("id", id)
            );
            const results = await Promise.all(updates);
            const firstErr = results.find((r) => r.error);
            if (firstErr?.error) {
                console.error("Batch sort_order update error:", firstErr.error);
                throw firstErr.error;
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-products"] });
            qc.invalidateQueries({ queryKey: ["products"] });
        },
    });
}

/** Create a new category. */
export function useCreateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: CategoryInsert) => {
            // Only send fields that exist in the DB — try with is_visible first, fallback without it
            const basePayload: any = {
                name: (input as any).name,
                slug: (input as any).slug,
                description: (input as any).description ?? null,
                image_url: (input as any).image_url ?? null,
                sort_order: (input as any).sort_order ?? 0,
                parent_id: (input as any).parent_id ?? null,
            };

            // Try inserting with is_visible first
            const { data, error } = await (supabase.from("categories") as any)
                .insert({ ...basePayload, is_visible: (input as any).is_visible ?? true })
                .select()
                .single();

            if (error) {
                // If is_visible column doesn't exist, retry without it
                const { data: retryData, error: retryErr } = await (supabase.from("categories") as any)
                    .insert(basePayload)
                    .select()
                    .single();
                if (retryErr) throw new Error(retryErr.message || "Failed to create category");
                return retryData;
            }
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-categories"] });
            qc.invalidateQueries({ queryKey: ["categories"] });
        },
    });
}

/** Update an existing category. */
export function useUpdateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: { id: string; name: string; slug: string; description?: string | null; image_url?: string | null; sort_order?: number; is_visible?: boolean }) => {
            const basePayload: any = {
                name: input.name,
                slug: input.slug,
                description: input.description ?? null,
                image_url: input.image_url ?? null,
                sort_order: input.sort_order ?? 0,
            };
            const { data, error } = await (supabase.from("categories") as any)
                .update({ ...basePayload, is_visible: input.is_visible ?? true })
                .eq("id", input.id)
                .select()
                .single();

            if (error) {
                const { data: retryData, error: retryErr } = await (supabase.from("categories") as any)
                    .update(basePayload)
                    .eq("id", input.id)
                    .select()
                    .single();
                if (retryErr) throw new Error(retryErr.message || "Failed to update category");
                return retryData;
            }
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-categories"] });
            qc.invalidateQueries({ queryKey: ["categories"] });
        },
    });
}

/** Create a new brand. */
export function useCreateBrand() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: BrandInsert) => {
            const { data, error } = await supabase
                .from("brands")
                .insert(input as never)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-brands"] });
            qc.invalidateQueries({ queryKey: ["brands"] });
        },
    });
}

/** Create a new banner. */
export function useCreateBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: BannerInsert) => {
            const { data, error } = await supabase
                .from("banners")
                .insert(input as never)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-banners"] });
            qc.invalidateQueries({ queryKey: ["banners"] });
        },
    });
}

/** Create a new coupon. */
export function useCreateCoupon() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: CouponInsert) => {
            const { data, error } = await supabase
                .from("coupons")
                .insert(input as never)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
    });
}

/** Create a new discount campaign. */
export function useCreateCampaign() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: CampaignInsert) => {
            const { data, error } = await supabase
                .from("discount_campaigns")
                .insert(input as never)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-campaigns"] }),
    });
}

/** Create a new shipping method. */
export function useCreateShippingMethod() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: ShippingMethodInsert) => {
            const { data, error } = await supabase
                .from("shipping_methods")
                .insert(input as never)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shipping-methods"] }),
    });
}

/** Create a new tax rule. */
export function useCreateTaxRule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: TaxRuleInsert) => {
            const { data, error } = await supabase
                .from("tax_rules")
                .insert(input as never)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tax-rules"] }),
    });
}

/** Create a new SEO metadata entry. */
export function useCreateSeo() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: SeoInsert) => {
            const { data, error } = await supabase
                .from("seo_metadata")
                .insert(input as never)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-seo"] }),
    });
}

/** Create a new notification template. */
export function useCreateNotificationTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: NotificationTemplateInsert) => {
            const { data, error } = await supabase
                .from("notification_templates")
                .insert(input as never)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notification-templates"] }),
    });
}

/**
 * Upload an image file to the `media` storage bucket and record it in the
 * `media_assets` table. Powers the Media Library "Upload" button.
 */
export function useUploadMedia() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ file, alt_text }: { file: File; alt_text?: string }) => {
            const ext = file.name.split(".").pop() ?? "jpg";
            const path = `misc/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: upErr } = await supabase.storage
                .from("media")
                .upload(path, file, { contentType: file.type || "image/*", upsert: false });
            if (upErr) throw upErr;

            const { data: pub } = supabase.storage.from("media").getPublicUrl(path);

            const row: MediaAssetInsert = {
                storage_path: path,
                url: pub.publicUrl,
                file_name: file.name,
                mime_type: file.type || "application/octet-stream",
                size_bytes: file.size,
                width: null,
                height: null,
                alt_text: alt_text ?? null,
                uploaded_by: null,
            };
            const { data, error } = await supabase
                .from("media_assets")
                .insert(row as never)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-media"] }),
    });
}

/**
 * Upload an image to the `media` storage bucket and return its public URL.
 * Used by the reusable ImageUpload component for banner/category/brand/SEO
 * image fields — uploads the file only (no media_assets row is created).
 */
export function useImageUpload() {
    return useMutation({
        mutationFn: async (file: File): Promise<string> => {
            const ext = file.name.split(".").pop() ?? "jpg";
            const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: upErr } = await supabase.storage
                .from("media")
                .upload(path, file, { contentType: file.type || "image/*", upsert: false });
            if (upErr) throw upErr;
            const { data } = supabase.storage.from("media").getPublicUrl(path);
            return data.publicUrl;
        },
    });
}

/**
 * Ban a customer/user profile.
 */
export function useBanUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({
            profileId,
            reason,
            banType = "permanent",
            bannedUntil = null,
        }: {
            profileId: string;
            reason: string;
            banType?: "permanent" | "temporary";
            bannedUntil?: string | null;
        }) => {
            // Try rpc first
            const { error: rpcErr } = await (supabase.rpc as any)("ban_user", {
                p_profile_id: profileId,
                p_reason: reason,
                p_ban_type: banType,
                p_banned_until: bannedUntil,
            });

            if (rpcErr) {
                // Fallback to direct update
                const { error: updateErr } = await (supabase.from("profiles" as never) as any)
                    .update({
                        status: "banned",
                        ban_reason: reason,
                        ban_type: banType,
                        banned_at: new Date().toISOString(),
                        banned_until: bannedUntil,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", profileId);

                if (updateErr) throw updateErr;
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-customers"] });
            qc.invalidateQueries({ queryKey: ["admin-kpis"] });
        },
    });
}

/**
 * Unban a customer/user profile.
 */
export function useUnbanUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (profileId: string) => {
            const { error: rpcErr } = await (supabase.rpc as any)("unban_user", {
                p_profile_id: profileId,
            });

            if (rpcErr) {
                const { error: updateErr } = await (supabase.from("profiles" as never) as any)
                    .update({
                        status: "active",
                        ban_reason: null,
                        ban_type: null,
                        banned_at: null,
                        banned_until: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", profileId);

                if (updateErr) throw updateErr;
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-customers"] });
            qc.invalidateQueries({ queryKey: ["admin-kpis"] });
        },
    });
}

/**
 * Super Admin Reset All Orders (Permanent deletion after backup confirmation).
 */
export function useResetOrders() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            // Call RPC or delete all orders
            const { data, error } = await (supabase.rpc as any)("reset_all_orders");
            if (error) {
                // Delete child tables first to avoid FK errors
                await (supabase.from("order_items" as never) as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
                await (supabase.from("payments" as never) as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
                await (supabase.from("refunds" as never) as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
                await (supabase.from("order_logs" as never) as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

                const deleteRes = await (supabase.from("orders" as never) as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
                if (deleteRes.error) throw deleteRes.error;
            }
            // Clear local backup cache
            try {
                localStorage.removeItem("bk_local_orders");
            } catch (e) {}
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-orders"] });
            qc.invalidateQueries({ queryKey: ["admin-kpis"] });
            qc.invalidateQueries({ queryKey: ["admin-customers"] });
            qc.invalidateQueries({ queryKey: ["admin-reports"] });
            qc.invalidateQueries({ queryKey: ["admin-analytics"] });
            qc.invalidateQueries({ queryKey: ["admin-notifications-center"] });
            qc.invalidateQueries({ queryKey: ["orders"] });
        },
    });
}

/**
 * Cancel order (Customer within 4-hour window or Admin override).
 */
export function useCancelOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
            const { data: rpcData, error: rpcErr } = await (supabase.rpc as any)("cancel_customer_order", {
                p_order_id: orderId,
                p_reason: reason || "Customer requested cancellation",
            });

            if (rpcErr || (rpcData && rpcData.success === false)) {
                // Fallback manual check
                const { data: order } = await (supabase.from("orders" as never) as any)
                    .select("placed_at, created_at, status")
                    .eq("id", orderId)
                    .single();

                if (!order) throw new Error("Order not found");

                const placedAt = new Date(order.placed_at || order.created_at).getTime();
                const hoursDiff = (Date.now() - placedAt) / (1000 * 60 * 60);

                if (hoursDiff > 4) {
                    throw new Error("Order cancellation window has expired (4 hours limit exceeded).");
                }

                const { error: updateErr } = await (supabase.from("orders" as never) as any)
                    .update({
                        status: "cancelled",
                        cancelled_at: new Date().toISOString(),
                        cancellation_reason: reason || "Cancelled within 4 hours",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", orderId);

                if (updateErr) throw updateErr;
            }
            return rpcData;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["admin-orders"] });
            qc.invalidateQueries({ queryKey: ["admin-kpis"] });
        },
    });
}

/**
 * Fetch notifications for Admin Notification Center.
 */
export function useAdminNotificationsCenter() {
    return useQuery<any[]>({
        queryKey: ["admin-notifications-center"],
        queryFn: async () => {
            const { data, error } = await (supabase.from("notifications" as never) as any)
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.warn("Notice fetching admin notifications:", error);
                return [];
            }
            return data ?? [];
        },
        staleTime: 10 * 1000,
    });
}

/**
 * Mark notification as read.
 */
export function useMarkNotificationAsRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase.from("notifications" as never) as any)
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notifications-center"] }),
    });
}

/**
 * Delete a notification.
 */
export function useDeleteNotification() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase.from("notifications" as never) as any)
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notifications-center"] }),
    });
}

