/**
 * BK Store — Database types (hand-authored to mirror supabase.sql).
 *
 * In production you can regenerate these with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 *
 * The shape below matches the schema in supabase.sql so the Supabase client
 * is fully typed out of the box.
 */
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Currency = "PKR";

export type ProductStatus = "draft" | "published" | "archived";
export type OrderStatus =
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
export type PaymentStatus = "intent" | "authorized" | "captured" | "failed" | "refunded";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type CouponDiscountType = "percentage" | "fixed";
export type CouponScope = "cart" | "product" | "category";
export type DiscountType = "percentage" | "fixed";
export type ShippingType = "flat_rate" | "free" | "free_threshold" | "zone_based";
export type BannerPlacement =
    | "home_hero"
    | "home_secondary"
    | "shop_top"
    | "site_wide"
    | "footer";
export type AddressType = "shipping" | "billing" | "both";
export type NotificationChannel = "email" | "sms" | "in_app";

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    first_name: string | null;
                    last_name: string | null;
                    phone: string | null;
                    avatar_url: string | null;
                    is_guest: boolean;
                    metadata: Json;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    id: string;
                    email: string;
                    first_name?: string | null;
                    last_name?: string | null;
                    phone?: string | null;
                    avatar_url?: string | null;
                    is_guest?: boolean;
                    metadata?: Json;
                };
                Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
            };
            addresses: {
                Row: {
                    id: string;
                    user_id: string;
                    type: AddressType;
                    first_name: string;
                    last_name: string;
                    company: string | null;
                    line1: string;
                    line2: string | null;
                    city: string;
                    state: string;
                    postal_code: string;
                    country: string;
                    phone: string | null;
                    is_default: boolean;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: Omit<Database["public"]["Tables"]["addresses"]["Row"], "id" | "created_at" | "updated_at" | "deleted_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
            };
            categories: {
                Row: {
                    id: string;
                    parent_id: string | null;
                    name: string;
                    slug: string;
                    description: string | null;
                    image_url: string | null;
                    sort_order: number;
                    is_visible: boolean;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
            };
            brands: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    description: string | null;
                    logo_url: string | null;
                    website_url: string | null;
                    is_featured: boolean;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: Omit<Database["public"]["Tables"]["brands"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["brands"]["Insert"]>;
            };
            products: {
                Row: {
                    id: string;
                    brand_id: string | null;
                    name: string;
                    slug: string;
                    description: string | null;
                    description_html: string | null;
                    status: ProductStatus;
                    base_price: number;
                    compare_at_price: number | null;
                    currency: string;
                    vendor_id: string | null;
                    search_document: unknown;
                    meta_title: string | null;
                    meta_description: string | null;
                    rating_average: number;
                    rating_count: number;
                    is_new_arrival: boolean;
                    is_best_seller: boolean;
                    is_featured: boolean;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at" | "search_document" | "rating_average" | "rating_count"> & {
                    id?: string;
                    is_new_arrival?: boolean;
                    is_best_seller?: boolean;
                    is_featured?: boolean;
                };
                Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
            };
            product_categories: {
                Row: {
                    product_id: string;
                    category_id: string;
                    primary_category: boolean;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["product_categories"]["Row"], "created_at">;
                Update: Partial<Database["public"]["Tables"]["product_categories"]["Insert"]>;
            };
            product_attributes: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    type: "select" | "text" | "number" | "boolean" | "color";
                    options: Json;
                    is_filterable: boolean;
                    is_variant: boolean;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["product_attributes"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["product_attributes"]["Insert"]>;
            };
            product_attribute_values: {
                Row: {
                    id: string;
                    product_id: string;
                    attribute_id: string;
                    value: string;
                    meta: Json;
                    sort_order: number;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["product_attribute_values"]["Row"], "id" | "created_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["product_attribute_values"]["Insert"]>;
            };
            product_variants: {
                Row: {
                    id: string;
                    product_id: string;
                    sku: string;
                    name: string | null;
                    option_values: Json;
                    price: number;
                    compare_at_price: number | null;
                    stock_quantity: number;
                    low_stock_threshold: number;
                    track_inventory: boolean;
                    is_active: boolean;
                    weight_grams: number | null;
                    barcode: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: Omit<Database["public"]["Tables"]["product_variants"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
            };
            product_images: {
                Row: {
                    id: string;
                    product_id: string;
                    variant_id: string | null;
                    storage_path: string;
                    url: string;
                    alt_text: string | null;
                    sort_order: number;
                    is_primary: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["product_images"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
            };
            inventory_adjustments: {
                Row: {
                    id: string;
                    variant_id: string;
                    reason: string;
                    quantity_change: number;
                    previous_stock: number;
                    new_stock: number;
                    note: string | null;
                    actor_id: string | null;
                    reference: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["inventory_adjustments"]["Row"], "id" | "created_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["inventory_adjustments"]["Insert"]>;
            };
            carts: {
                Row: {
                    id: string;
                    user_id: string | null;
                    session_id: string | null;
                    status: "active" | "abandoned" | "converted";
                    currency: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["carts"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["carts"]["Insert"]>;
            };
            cart_items: {
                Row: {
                    id: string;
                    cart_id: string;
                    variant_id: string;
                    product_id: string;
                    quantity: number;
                    unit_price: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["cart_items"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>;
            };
            orders: {
                Row: {
                    id: string;
                    order_number: string;
                    user_id: string | null;
                    guest_email: string | null;
                    status: OrderStatus;
                    currency: string;
                    subtotal: number;
                    discount_total: number;
                    shipping_total: number;
                    tax_total: number;
                    grand_total: number;
                    shipping_address: Json | null;
                    billing_address: Json | null;
                    shipping_method: string | null;
                    tracking_number: string | null;
                    coupon_code: string | null;
                    customer_note: string | null;
                    placed_at: string;
                    confirmed_at: string | null;
                    shipped_at: string | null;
                    delivered_at: string | null;
                    cancelled_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at" | "updated_at" | "placed_at"> & {
                    id?: string;
                    placed_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
            };
            order_items: {
                Row: {
                    id: string;
                    order_id: string;
                    variant_id: string | null;
                    product_id: string | null;
                    product_name: string;
                    variant_name: string | null;
                    sku: string;
                    quantity: number;
                    unit_price: number;
                    line_total: number;
                    image_url: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id" | "created_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
            };
            payments: {
                Row: {
                    id: string;
                    order_id: string;
                    provider: string;
                    provider_payment_id: string | null;
                    status: PaymentStatus;
                    amount: number;
                    currency: string;
                    client_secret: string | null;
                    method: string | null;
                    metadata: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
            };
            refunds: {
                Row: {
                    id: string;
                    order_id: string;
                    order_item_id: string | null;
                    amount: number;
                    reason: string;
                    return_to_stock: boolean;
                    status: "pending" | "completed" | "failed";
                    provider_refund_id: string | null;
                    processed_by: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["refunds"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["refunds"]["Insert"]>;
            };
            coupons: {
                Row: {
                    id: string;
                    code: string;
                    description: string | null;
                    discount_type: CouponDiscountType;
                    discount_value: number;
                    scope: CouponScope;
                    target_ids: Json;
                    min_order_value: number;
                    max_discount_amount: number | null;
                    usage_limit: number | null;
                    usage_limit_per_customer: number;
                    used_count: number;
                    starts_at: string | null;
                    expires_at: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["coupons"]["Row"], "id" | "created_at" | "updated_at" | "used_count"> & {
                    id?: string;
                    used_count?: number;
                };
                Update: Partial<Database["public"]["Tables"]["coupons"]["Insert"]>;
            };
            discount_campaigns: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    discount_type: DiscountType;
                    discount_value: number;
                    starts_at: string;
                    ends_at: string;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["discount_campaigns"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["discount_campaigns"]["Insert"]>;
            };
            discount_campaign_targets: {
                Row: {
                    campaign_id: string;
                    target_type: "product" | "category" | "brand";
                    target_id: string;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["discount_campaign_targets"]["Row"], "created_at">;
                Update: Partial<Database["public"]["Tables"]["discount_campaign_targets"]["Insert"]>;
            };
            banners: {
                Row: {
                    id: string;
                    title: string;
                    image_url: string;
                    link_url: string | null;
                    placement: BannerPlacement;
                    text_overlay: string | null;
                    cta_label: string | null;
                    start_at: string | null;
                    end_at: string | null;
                    is_published: boolean;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["banners"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["banners"]["Insert"]>;
            };
            reviews: {
                Row: {
                    id: string;
                    product_id: string;
                    user_id: string;
                    order_item_id: string | null;
                    rating: number;
                    title: string | null;
                    body: string | null;
                    status: ReviewStatus;
                    admin_reply: string | null;
                    admin_replied_at: string | null;
                    is_verified_purchase: boolean;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at" | "updated_at" | "deleted_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
            };
            wishlists: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["wishlists"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["wishlists"]["Insert"]>;
            };
            wishlist_items: {
                Row: {
                    id: string;
                    wishlist_id: string;
                    product_id: string;
                    variant_id: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["wishlist_items"]["Row"], "id" | "created_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["wishlist_items"]["Insert"]>;
            };
            recently_viewed: {
                Row: {
                    id: string;
                    user_id: string | null;
                    session_id: string | null;
                    product_id: string;
                    viewed_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["recently_viewed"]["Row"], "id" | "viewed_at"> & {
                    id?: string;
                    viewed_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["recently_viewed"]["Insert"]>;
            };
            shipping_methods: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    type: ShippingType;
                    rate: number;
                    free_threshold: number | null;
                    zones: Json;
                    estimated_days_min: number | null;
                    estimated_days_max: number | null;
                    is_active: boolean;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["shipping_methods"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["shipping_methods"]["Insert"]>;
            };
            tax_rules: {
                Row: {
                    id: string;
                    name: string;
                    country: string;
                    state: string | null;
                    rate: number;
                    inclusive: boolean;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["tax_rules"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["tax_rules"]["Insert"]>;
            };
            notification_templates: {
                Row: {
                    id: string;
                    event_type: string;
                    channel: NotificationChannel;
                    subject: string | null;
                    body_template: string;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["notification_templates"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["notification_templates"]["Insert"]>;
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string | null;
                    type: string;
                    title: string;
                    body: string | null;
                    link: string | null;
                    is_read: boolean;
                    read_at: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at" | "is_read" | "read_at"> & {
                    id?: string;
                    is_read?: boolean;
                    read_at?: string | null;
                };
                Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
            };
            admin_roles: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    is_system: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["admin_roles"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["admin_roles"]["Insert"]>;
            };
            admin_permissions: {
                Row: {
                    id: string;
                    key: string;
                    description: string | null;
                    module: string;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["admin_permissions"]["Row"], "id" | "created_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["admin_permissions"]["Insert"]>;
            };
            admin_role_permissions: {
                Row: {
                    role_id: string;
                    permission_id: string;
                };
                Insert: Database["public"]["Tables"]["admin_role_permissions"]["Row"];
                Update: Partial<Database["public"]["Tables"]["admin_role_permissions"]["Insert"]>;
            };
            admin_users: {
                Row: {
                    id: string;
                    role_id: string;
                    display_name: string;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["admin_users"]["Row"], "created_at" | "updated_at">;
                Update: Partial<Database["public"]["Tables"]["admin_users"]["Insert"]>;
            };
            audit_logs: {
                Row: {
                    id: string;
                    actor_id: string | null;
                    actor_email: string | null;
                    action: string;
                    entity_type: string;
                    entity_id: string | null;
                    before_state: Json | null;
                    after_state: Json | null;
                    ip_address: string | null;
                    user_agent: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["audit_logs"]["Row"], "id" | "created_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
            };
            media_assets: {
                Row: {
                    id: string;
                    storage_path: string;
                    url: string;
                    file_name: string;
                    mime_type: string;
                    size_bytes: number;
                    width: number | null;
                    height: number | null;
                    alt_text: string | null;
                    uploaded_by: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["media_assets"]["Row"], "id" | "created_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["media_assets"]["Insert"]>;
            };
            store_settings: {
                Row: {
                    id: number;
                    store_name: string;
                    tagline: string | null;
                    logo_url: string | null;
                    contact_email: string | null;
                    contact_phone: string | null;
                    address: string | null;
                    social_links: Json;
                    default_currency: string;
                    default_locale: string;
                    enable_guest_checkout: boolean;
                    enable_reviews: boolean;
                    require_verified_purchase_for_review: boolean;
                    enable_wishlist: boolean;
                    prices_tax_inclusive: boolean;
                    free_shipping_threshold: number | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Partial<Database["public"]["Tables"]["store_settings"]["Row"]> & { id?: number };
                Update: Partial<Database["public"]["Tables"]["store_settings"]["Insert"]>;
            };
            seo_metadata: {
                Row: {
                    id: string;
                    entity_type: string;
                    entity_id: string | null;
                    path: string | null;
                    meta_title: string | null;
                    meta_description: string | null;
                    og_title: string | null;
                    og_description: string | null;
                    og_image_url: string | null;
                    canonical_url: string | null;
                    robots_index: boolean;
                    structured_data: Json | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["seo_metadata"]["Row"], "id" | "created_at" | "updated_at"> & {
                    id?: string;
                };
                Update: Partial<Database["public"]["Tables"]["seo_metadata"]["Insert"]>;
            };
        };
        Views: Record<string, never>;
        Functions: {
            place_order: {
                Args: {
                    p_user_id: string | null;
                    p_guest_email: string | null;
                    p_cart_id: string;
                    p_shipping_address: Json;
                    p_billing_address: Json;
                    p_shipping_method: string;
                    p_shipping_total: number;
                    p_tax_total: number;
                    p_discount_total: number;
                    p_coupon_code: string | null;
                    p_customer_note: string | null;
                };
                Returns: Database["public"]["Tables"]["orders"]["Row"];
            };
            validate_coupon: {
                Args: { p_code: string; p_cart_subtotal: number; p_user_id?: string | null };
                Returns: { is_valid: boolean; discount_amount: number; message: string }[];
            };
            merge_guest_cart: {
                Args: { p_user_id: string; p_session_id: string };
                Returns: void;
            };
            has_permission: { Args: { p_user: string; p_permission: string }; Returns: boolean };
            is_admin: { Args: Record<string, never>; Returns: boolean };
        };
        Enums: Record<string, never>;
    };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];
