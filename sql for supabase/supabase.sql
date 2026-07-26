-- ============================================================================
-- BK STORE — Supabase Schema (supabase.sql)
-- ----------------------------------------------------------------------------
-- Full DDL for the BK Store eCommerce platform backend.
-- Covers: Identity, Catalog, Inventory, Commerce, Marketing, Engagement,
-- Operations, and Admin/System modules.
--
-- Conventions:
--   * All primary keys are uuid (gen_random_uuid()).
--   * All tables carry created_at, updated_at (trigger-maintained).
--   * Soft-deletable tables carry deleted_at.
--   * RLS is enabled on every table — no default-open access.
--   * Money is stored as numeric(12,2) in a single currency at launch
--     (multi-currency fields reserved for future).
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS & SHARED UTILITIES
-- ============================================================================
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";      -- trigram search helpers
create extension if not exists "pg_cron";      -- scheduled jobs (optional)
create extension if not exists "pg_net";       -- outbound HTTP from DB (webhooks)

-- updated_at trigger function — reusable across all tables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Helper: apply the updated_at trigger to a table.
-- NOTE: PostgreSQL does NOT support "CREATE TRIGGER IF NOT EXISTS", so we use
-- the standard idempotent pattern: DROP TRIGGER IF EXISTS, then CREATE TRIGGER.
create or replace function public.attach_updated_at_trigger(p_table text, p_schema text default 'public')
returns void
language plpgsql
as $$
begin
  execute format(
    'drop trigger if exists trg_%1$s_updated on %2$s.%1$s;
     create trigger trg_%1$s_updated
       before update on %2$s.%1$s
       for each row execute function public.set_updated_at();',
    p_table, p_schema
  );
end;
$$;

-- ============================================================================
-- 1. IDENTITY — profiles, addresses
-- ============================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  first_name    text,
  last_name     text,
  phone         text,
  avatar_url    text,
  is_guest      boolean not null default false,
  -- Reserved for future: loyalty points, marketing opt-in, etc.
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_deleted_at on public.profiles(deleted_at);
select public.attach_updated_at_trigger('profiles');

create table if not exists public.addresses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  type          text not null default 'shipping' check (type in ('shipping','billing','both')),
  first_name    text not null,
  last_name     text not null,
  company       text,
  line1         text not null,
  line2         text,
  city          text not null,
  state         text not null,
  postal_code   text not null,
  country       text not null default 'US',
  phone         text,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists idx_addresses_user on public.addresses(user_id);
select public.attach_updated_at_trigger('addresses');

-- ============================================================================
-- 2. CATALOG — categories, brands, products, variants, attributes, images
-- ============================================================================

create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid references public.categories(id) on delete set null,
  name          text not null,
  slug          text not null unique,
  description   text,
  image_url     text,
  sort_order    integer not null default 0,
  is_visible    boolean not null default true,
  -- Max nesting depth enforced in app; default 3 per business rules.
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists idx_categories_parent on public.categories(parent_id);
create index if not exists idx_categories_slug on public.categories(slug);
select public.attach_updated_at_trigger('categories');

create table if not exists public.brands (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  logo_url      text,
  website_url   text,
  is_featured   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists idx_brands_slug on public.brands(slug);
select public.attach_updated_at_trigger('brands');

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid references public.brands(id) on delete set null,
  name          text not null,
  slug          text not null unique,
  description   text,
  -- Rich description stored sanitized on the client (DOMPurify).
  description_html text,
  status        text not null default 'draft' check (status in ('draft','published','archived')),
  base_price    numeric(12,2) not null default 0 check (base_price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price >= 0),
  currency      text not null default 'PKR',
  -- Reserved for future multi-vendor marketplace.
  vendor_id     uuid,
  -- Full-text search document (generated by trigger).
  search_document tsvector,
  -- SEO
  meta_title    text,
  meta_description text,
  -- Aggregated rating cache (maintained by trigger on reviews).
  rating_average numeric(3,2) not null default 0,
  rating_count   integer not null default 0,
  -- Homepage placement flags (admin-curated sections).
  is_new_arrival boolean not null default false,
  is_best_seller boolean not null default false,
  is_featured    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_brand on public.products(brand_id);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_search on public.products using gin (search_document);
create index if not exists idx_products_new_arrival on public.products(is_new_arrival) where is_new_arrival = true;
create index if not exists idx_products_best_seller on public.products(is_best_seller) where is_best_seller = true;
create index if not exists idx_products_featured on public.products(is_featured) where is_featured = true;
select public.attach_updated_at_trigger('products');

-- Junction: product <-> category (a product may belong to many categories).
create table if not exists public.product_categories (
  product_id    uuid not null references public.products(id) on delete cascade,
  category_id   uuid not null references public.categories(id) on delete cascade,
  primary_category boolean not null default false,
  created_at    timestamptz not null default now(),
  primary key (product_id, category_id)
);

create index if not exists idx_pc_category on public.product_categories(category_id);

-- Generic, configurable attributes (size, color, material, etc.)
create table if not exists public.product_attributes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  -- 'select' | 'text' | 'number' | 'boolean' | 'color'
  type          text not null default 'select' check (type in ('select','text','number','boolean','color')),
  -- For select/color types: allowed values as json array.
  options       jsonb not null default '[]'::jsonb,
  is_filterable boolean not null default true,
  is_variant    boolean not null default false, -- drives variant axes
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

select public.attach_updated_at_trigger('product_attributes');

-- Per-product attribute values (e.g., this product's available sizes).
create table if not exists public.product_attribute_values (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  attribute_id  uuid not null references public.product_attributes(id) on delete cascade,
  value         text not null,
  -- For color: hex code; for select: the option label.
  meta          jsonb not null default '{}'::jsonb,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (product_id, attribute_id, value)
);

create index if not exists idx_pav_product on public.product_attribute_values(product_id);
create index if not exists idx_pav_attribute on public.product_attribute_values(attribute_id);

create table if not exists public.product_variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  sku           text not null unique, -- globally unique SKU
  name          text, -- e.g., "Small / Black"
  -- Variant axis values stored as jsonb: { "size": "S", "color": "Black" }
  option_values jsonb not null default '{}'::jsonb,
  price         numeric(12,2) not null default 0 check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price >= 0),
  -- Inventory lives on the variant.
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 5,
  track_inventory boolean not null default true,
  is_active     boolean not null default true,
  weight_grams  integer,
  barcode       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists idx_variants_product on public.product_variants(product_id);
create index if not exists idx_variants_sku on public.product_variants(sku);
select public.attach_updated_at_trigger('product_variants');

create table if not exists public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  variant_id    uuid references public.product_variants(id) on delete cascade,
  storage_path  text not null, -- Supabase Storage path
  url           text not null,
  alt_text       text,
  sort_order    integer not null default 0,
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_images_product on public.product_images(product_id);
create index if not exists idx_images_variant on public.product_images(variant_id);
select public.attach_updated_at_trigger('product_images');

-- Trigger: maintain products.search_document from name + description + brand.
create or replace function public.rebuild_product_search_document()
returns trigger
language plpgsql
as $$
declare
  v_brand text;
  v_categories text;
begin
  select b.name into v_brand
    from public.brands b
    join public.products p on p.brand_id = b.id
    where p.id = coalesce(new.id, old.id);

  select string_agg(c.name, ' ') into v_categories
    from public.categories c
    join public.product_categories pc on pc.category_id = c.id
    where pc.product_id = coalesce(new.id, old.id);

  if (tg_op = 'DELETE') then
    update public.products set search_document = null where id = old.id;
    return old;
  end if;

  update public.products
    set search_document =
      setweight(to_tsvector('english', coalesce(new.name,'')), 'A') ||
      setweight(to_tsvector('english', coalesce(new.description,'')), 'B') ||
      setweight(to_tsvector('english', coalesce(v_brand,'')), 'C') ||
      setweight(to_tsvector('english', coalesce(v_categories,'')), 'C')
    where id = new.id;
  return new;
end;
$$;

create trigger trg_product_search_document
  after insert or update of name, description, brand_id on public.products
  for each row execute function public.rebuild_product_search_document();

-- ============================================================================
-- 3. INVENTORY — adjustments (audit trail)
-- ============================================================================

create table if not exists public.inventory_adjustments (
  id            uuid primary key default gen_random_uuid(),
  variant_id    uuid not null references public.product_variants(id) on delete cascade,
  -- 'restock' | 'sale' | 'return' | 'manual' | 'damage'
  reason        text not null default 'manual',
  quantity_change integer not null, -- +ve increases, -ve decreases
  previous_stock integer not null,
  new_stock    integer not null,
  note         text,
  -- Actor: admin user id or system.
  actor_id      uuid,
  reference    text, -- e.g., order number for sale adjustments
  created_at    timestamptz not null default now()
);

create index if not exists idx_invadj_variant on public.inventory_adjustments(variant_id);
create index if not exists idx_invadj_created on public.inventory_adjustments(created_at);

-- Trigger: record an inventory adjustment whenever a variant's stock changes.
create or replace function public.record_inventory_adjustment()
returns trigger
language plpgsql
as $$
begin
  if new.stock_quantity is distinct from old.stock_quantity then
    insert into public.inventory_adjustments
      (variant_id, reason, quantity_change, previous_stock, new_stock, actor_id)
    values
      (new.id, 'manual', new.stock_quantity - old.stock_quantity,
       old.stock_quantity, new.stock_quantity, null);
  end if;
  return new;
end;
$$;

create trigger trg_variant_inventory_audit
  after update of stock_quantity on public.product_variants
  for each row execute function public.record_inventory_adjustment();

-- ============================================================================
-- 4. COMMERCE — carts, cart_items, orders, order_items, payments, refunds
-- ============================================================================

create table if not exists public.carts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade,
  -- For guest carts: a stable device/session id from the client.
  session_id    text,
  status        text not null default 'active' check (status in ('active','abandoned','converted')),
  currency      text not null default 'PKR',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_carts_user on public.carts(user_id);
create index if not exists idx_carts_session on public.carts(session_id);
select public.attach_updated_at_trigger('carts');

create table if not exists public.cart_items (
  id            uuid primary key default gen_random_uuid(),
  cart_id       uuid not null references public.carts(id) on delete cascade,
  variant_id    uuid not null references public.product_variants(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete cascade,
  quantity      integer not null default 1 check (quantity > 0),
  unit_price    numeric(12,2) not null, -- snapshot at add time
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index if not exists idx_cartitems_cart on public.cart_items(cart_id);
select public.attach_updated_at_trigger('cart_items');

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text not null unique, -- human-readable, e.g., BK-100001
  user_id       uuid references public.profiles(id) on delete set null,
  -- Guest checkout snapshot
  guest_email   text,
  status        text not null default 'pending'
    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  currency      text not null default 'PKR',
  subtotal      numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  shipping_total numeric(12,2) not null default 0,
  tax_total     numeric(12,2) not null default 0,
  grand_total   numeric(12,2) not null default 0,
  -- Snapshot of addresses at purchase time.
  shipping_address jsonb,
  billing_address  jsonb,
  shipping_method  text,
  tracking_number  text,
  -- Coupon applied (snapshot).
  coupon_code   text,
  customer_note text,
  placed_at     timestamptz not null default now(),
  confirmed_at  timestamptz,
  shipped_at    timestamptz,
  delivered_at  timestamptz,
  cancelled_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_number on public.orders(order_number);
select public.attach_updated_at_trigger('orders');

create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  variant_id    uuid references public.product_variants(id) on delete set null,
  product_id    uuid references public.products(id) on delete set null,
  product_name  text not null, -- snapshot
  variant_name  text,
  sku           text not null, -- snapshot
  quantity      integer not null check (quantity > 0),
  unit_price    numeric(12,2) not null,
  line_total    numeric(12,2) not null,
  -- Snapshot of variant image for order history display.
  image_url     text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_orderitems_order on public.order_items(order_id);

create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  -- This store uses Cash on Delivery (COD) only.
  provider      text not null default 'cash_on_delivery',
  provider_payment_id text,
  -- 'intent' | 'captured' | 'failed' | 'refunded' (COD starts as 'intent', set to 'captured' on delivery)
  status        text not null default 'intent',
  amount        numeric(12,2) not null,
  currency      text not null default 'PKR',
  client_secret text, -- unused for COD, kept for schema compatibility
  method        text not null default 'cash_on_delivery', -- 'cash_on_delivery'
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_payments_order on public.payments(order_id);
select public.attach_updated_at_trigger('payments');

create table if not exists public.refunds (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  amount        numeric(12,2) not null,
  reason        text not null,
  -- Whether returned items restock inventory.
  return_to_stock boolean not null default false,
  status        text not null default 'pending' check (status in ('pending','completed','failed')),
  provider_refund_id text,
  processed_by  uuid, -- admin user id
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_refunds_order on public.refunds(order_id);
select public.attach_updated_at_trigger('refunds');

-- ============================================================================
-- 5. MARKETING — coupons, discount campaigns, banners
-- ============================================================================

create table if not exists public.coupons (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique, -- case-insensitive uniqueness enforced via lower()
  description   text,
  -- 'percentage' | 'fixed'
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(12,2) not null check (discount_value >= 0),
  -- Scope: 'cart' | 'product' | 'category'
  scope         text not null default 'cart' check (scope in ('cart','product','category')),
  -- For product/category scope: target ids (json array).
  target_ids    jsonb not null default '[]'::jsonb,
  min_order_value numeric(12,2) not null default 0,
  max_discount_amount numeric(12,2), -- cap for percentage coupons
  usage_limit   integer, -- global limit (null = unlimited)
  usage_limit_per_customer integer not null default 1,
  used_count    integer not null default 0,
  starts_at     timestamptz,
  expires_at    timestamptz,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Case-insensitive uniqueness on coupon code.
create unique index if not exists idx_coupons_code_lower on public.coupons(lower(code));
select public.attach_updated_at_trigger('coupons');

create table if not exists public.discount_campaigns (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  -- 'percentage' | 'fixed'
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(12,2) not null check (discount_value >= 0),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

select public.attach_updated_at_trigger('discount_campaigns');

create table if not exists public.discount_campaign_targets (
  campaign_id   uuid not null references public.discount_campaigns(id) on delete cascade,
  -- 'product' | 'category' | 'brand'
  target_type   text not null check (target_type in ('product','category','brand')),
  target_id     uuid not null,
  created_at    timestamptz not null default now(),
  primary key (campaign_id, target_type, target_id)
);

create table if not exists public.banners (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  image_url     text not null,
  link_url      text,
  placement     text not null default 'home_hero'
    check (placement in ('home_hero','home_secondary','shop_top','site_wide','footer')),
  text_overlay  text,
  cta_label     text,
  start_at      timestamptz,
  end_at        timestamptz,
  is_published  boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_banners_placement on public.banners(placement);
select public.attach_updated_at_trigger('banners');

-- ============================================================================
-- 6. ENGAGEMENT — reviews, wishlists, recently_viewed
-- ============================================================================

create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  rating        integer not null check (rating between 1 and 5),
  title         text,
  body          text,
  -- 'pending' | 'approved' | 'rejected'
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_reply   text,
  admin_replied_at timestamptz,
  is_verified_purchase boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (product_id, user_id)
);

create index if not exists idx_reviews_product on public.reviews(product_id);
create index if not exists idx_reviews_user on public.reviews(user_id);
create index if not exists idx_reviews_status on public.reviews(status);
select public.attach_updated_at_trigger('reviews');

-- Trigger: maintain product rating_average / rating_count from approved reviews.
create or replace function public.recompute_product_rating()
returns trigger
language plpgsql
as $$
declare
  v_product uuid;
begin
  v_product := coalesce(new.product_id, old.product_id);
  update public.products p
    set rating_average = coalesce(r.avg_rating, 0),
        rating_count   = coalesce(r.count_rating, 0)
    from (
      select avg(rating)::numeric(3,2) as avg_rating, count(*)::integer as count_rating
      from public.reviews
      where product_id = v_product and status = 'approved' and deleted_at is null
    ) r
    where p.id = v_product;
  return coalesce(new, old);
end;
$$;

create trigger trg_recompute_rating_after_review
  after insert or update or delete on public.reviews
  for each row execute function public.recompute_product_rating();

create table if not exists public.wishlists (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null default 'My Wishlist',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_wishlists_user on public.wishlists(user_id);
select public.attach_updated_at_trigger('wishlists');

create table if not exists public.wishlist_items (
  id            uuid primary key default gen_random_uuid(),
  wishlist_id   uuid not null references public.wishlists(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete cascade,
  variant_id    uuid references public.product_variants(id) on delete cascade,
  created_at    timestamptz not null default now()
);

create index if not exists idx_wishlistitems_wishlist on public.wishlist_items(wishlist_id);
-- Prevent duplicate wishlist entries for the same product+variant combination.
-- Uses coalesce() so a NULL variant_id is treated as a stable sentinel value.
create unique index if not exists uq_wishlistitems_product_variant
  on public.wishlist_items (wishlist_id, product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'));

create table if not exists public.recently_viewed (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade,
  session_id    text,
  product_id    uuid not null references public.products(id) on delete cascade,
  viewed_at     timestamptz not null default now()
);

create index if not exists idx_recent_user on public.recently_viewed(user_id, viewed_at desc);
create index if not exists idx_recent_session on public.recently_viewed(session_id, viewed_at desc);

-- ============================================================================
-- 7. OPERATIONS — shipping, tax, notifications
-- ============================================================================

create table if not exists public.shipping_methods (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  -- 'flat_rate' | 'free' | 'free_threshold' | 'zone_based'
  type          text not null default 'flat_rate',
  rate          numeric(12,2) not null default 0,
  free_threshold numeric(12,2), -- order subtotal above which shipping is free
  -- For zone_based: json mapping of zones to rates.
  zones         jsonb not null default '{}'::jsonb,
  estimated_days_min integer,
  estimated_days_max integer,
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

select public.attach_updated_at_trigger('shipping_methods');

create table if not exists public.tax_rules (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  country       text not null default 'US',
  state         text, -- null = all states
  rate          numeric(5,4) not null check (rate >= 0 and rate <= 1),
  -- Whether prices are tax-inclusive (VAT-style) or exclusive.
  inclusive      boolean not null default false,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

select public.attach_updated_at_trigger('tax_rules');

create table if not exists public.notification_templates (
  id            uuid primary key default gen_random_uuid(),
  event_type    text not null unique, -- 'order_confirmed','order_shipped','password_reset', etc.
  channel       text not null default 'email' check (channel in ('email','sms','in_app')),
  subject       text,
  body_template text not null, -- with {{placeholders}}
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

select public.attach_updated_at_trigger('notification_templates');

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade,
  -- 'order' | 'system' | 'marketing' | 'admin'
  type          text not null default 'system',
  title         text not null,
  body          text,
  link          text,
  is_read       boolean not null default false,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

-- ============================================================================
-- 8. ADMIN / SYSTEM — roles, permissions, audit, media, settings, seo
-- ============================================================================

create table if not exists public.admin_roles (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique, -- 'Super Admin','Store Manager', etc.
  description   text,
  is_system     boolean not null default false, -- system roles cannot be deleted
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

select public.attach_updated_at_trigger('admin_roles');

create table if not exists public.admin_permissions (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique, -- 'products.write','orders.refund', etc.
  description   text,
  module        text not null, -- 'catalog','orders','settings', etc.
  created_at    timestamptz not null default now()
);

create table if not exists public.admin_role_permissions (
  role_id       uuid not null references public.admin_roles(id) on delete cascade,
  permission_id uuid not null references public.admin_permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.admin_users (
  id            uuid primary key references auth.users(id) on delete cascade,
  role_id       uuid not null references public.admin_roles(id) on delete restrict,
  display_name  text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_adminusers_role on public.admin_users(role_id);
select public.attach_updated_at_trigger('admin_users');

-- Helper: check whether the current user has a given permission.
create or replace function public.has_permission(p_user uuid, p_permission text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    join public.admin_role_permissions arp on arp.role_id = au.role_id
    join public.admin_permissions ap on ap.id = arp.permission_id
    where au.id = p_user
      and au.is_active = true
      and ap.key = p_permission
  );
$$;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where id = auth.uid() and is_active = true);
$$;

create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid, -- admin user id (references auth.users)
  actor_email   text,
  action        text not null, -- 'create','update','delete','status_change', etc.
  entity_type   text not null, -- 'product','order','coupon', etc.
  entity_id     uuid,
  -- Before/after diff as jsonb.
  before_state  jsonb,
  after_state   jsonb,
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_audit_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);

create table if not exists public.media_assets (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null,
  url           text not null,
  file_name     text not null,
  mime_type     text not null,
  size_bytes    bigint not null,
  width         integer,
  height        integer,
  alt_text      text,
  -- Who uploaded (admin user id).
  uploaded_by   uuid,
  created_at    timestamptz not null default now()
);

create index if not exists idx_media_created on public.media_assets(created_at desc);

create table if not exists public.store_settings (
  id            integer primary key default 1 check (id = 1), -- singleton row
  store_name    text not null default 'BK Store',
  tagline       text,
  logo_url      text,
  contact_email text,
  contact_phone text,
  address       text,
  social_links  jsonb not null default '{}'::jsonb,
  default_currency text not null default 'PKR',
  default_locale   text not null default 'en-US',
  -- Feature flags
  enable_guest_checkout boolean not null default true,
  enable_reviews boolean not null default true,
  require_verified_purchase_for_review boolean not null default false,
  enable_wishlist boolean not null default true,
  -- Tax & shipping defaults
  prices_tax_inclusive boolean not null default false,
  free_shipping_threshold numeric(12,2),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

select public.attach_updated_at_trigger('store_settings');

-- Ensure the singleton settings row exists.
insert into public.store_settings (id) values (1)
  on conflict (id) do nothing;

create table if not exists public.seo_metadata (
  id            uuid primary key default gen_random_uuid(),
  -- Polymorphic target: 'page' | 'product' | 'category'
  entity_type   text not null,
  entity_id     uuid,
  path          text, -- for static pages, e.g., '/about'
  meta_title    text,
  meta_description text,
  og_title      text,
  og_description text,
  og_image_url  text,
  canonical_url text,
  robots_index  boolean not null default true,
  structured_data jsonb, -- JSON-LD
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_seo_entity on public.seo_metadata(entity_type, entity_id);
create index if not exists idx_seo_path on public.seo_metadata(path);
select public.attach_updated_at_trigger('seo_metadata');

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- RLS is enabled on every table. No table is left default-open.
-- ============================================================================

-- Helper: current user's profile id (auth.uid()).
-- Guests are identified by anon role + session id passed via request.headers
-- (for cart/wishlist we use a client-generated session id stored in the row).

-- ---- profiles ----
alter table public.profiles enable row level security;
create policy "Profiles are viewable by owner or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());
create policy "Users manage their own profile"
  on public.profiles for update
  using (auth.uid() = id);
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---- addresses ----
alter table public.addresses enable row level security;
create policy "Users view own addresses" on public.addresses for select
  using (auth.uid() = user_id);
create policy "Users manage own addresses" on public.addresses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- categories (public read) ----
alter table public.categories enable row level security;
create policy "Categories are publicly readable" on public.categories for select
  using (is_visible = true and deleted_at is null);
create policy "Admins manage categories" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- brands (public read) ----
alter table public.brands enable row level security;
create policy "Brands are publicly readable" on public.brands for select
  using (deleted_at is null);
create policy "Admins manage brands" on public.brands for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- products (public read of published) ----
alter table public.products enable row level security;
create policy "Published products are publicly readable" on public.products for select
  using (status = 'published' and deleted_at is null);
create policy "Admins manage products" on public.products for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- product_categories ----
alter table public.product_categories enable row level security;
create policy "Product-category links are publicly readable" on public.product_categories for select
  using (true);
create policy "Admins manage product categories" on public.product_categories for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- product_attributes ----
alter table public.product_attributes enable row level security;
create policy "Attributes are publicly readable" on public.product_attributes for select
  using (true);
create policy "Admins manage attributes" on public.product_attributes for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- product_attribute_values ----
alter table public.product_attribute_values enable row level security;
create policy "Attribute values are publicly readable" on public.product_attribute_values for select
  using (true);
create policy "Admins manage attribute values" on public.product_attribute_values for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- product_variants ----
alter table public.product_variants enable row level security;
create policy "Variants of published products are publicly readable" on public.product_variants for select
  using (
    is_active = true and deleted_at is null and
    exists (select 1 from public.products p where p.id = product_id and p.status = 'published' and p.deleted_at is null)
  );
create policy "Admins manage variants" on public.product_variants for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- product_images ----
alter table public.product_images enable row level security;
create policy "Product images are publicly readable" on public.product_images for select
  using (true);
create policy "Admins manage product images" on public.product_images for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- inventory_adjustments (admin only) ----
alter table public.inventory_adjustments enable row level security;
create policy "Admins view inventory adjustments" on public.inventory_adjustments for select
  using (public.is_admin());
create policy "Admins create inventory adjustments" on public.inventory_adjustments for insert
  with check (public.is_admin());

-- ---- carts (owner or guest session) ----
alter table public.carts enable row level security;
create policy "Users view own carts" on public.carts for select
  using (auth.uid() = user_id);
create policy "Guests view own session carts" on public.carts for select
  using (user_id is null and session_id = current_setting('request.session_id', true));
create policy "Users insert own carts" on public.carts for insert
  with check (auth.uid() = user_id or user_id is null);
create policy "Guests insert session carts" on public.carts for insert
  with check (user_id is null);
create policy "Users update own carts" on public.carts for update
  using (auth.uid() = user_id);
create policy "Users delete own carts" on public.carts for delete
  using (auth.uid() = user_id);

-- ---- cart_items (via cart ownership) ----
alter table public.cart_items enable row level security;
create policy "Users view own cart items" on public.cart_items for select
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
create policy "Guests view own session cart items" on public.cart_items for select
  using (exists (
    select 1 from public.carts c
    where c.id = cart_id and c.user_id is null
      and c.session_id = current_setting('request.session_id', true)
  ));
create policy "Users manage own cart items" on public.cart_items for all
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
create policy "Guests manage own session cart items" on public.cart_items for all
  using (exists (
    select 1 from public.carts c
    where c.id = cart_id and c.user_id is null
      and c.session_id = current_setting('request.session_id', true)
  ))
  with check (exists (
    select 1 from public.carts c
    where c.id = cart_id and c.user_id is null
      and c.session_id = current_setting('request.session_id', true)
  ));

-- ---- orders (owner or admin) ----
alter table public.orders enable row level security;
create policy "Users view own orders" on public.orders for select
  using (auth.uid() = user_id);
create policy "Guests view orders by email" on public.orders for select
  using (user_id is null and guest_email = current_setting('request.guest_email', true));
create policy "Admins view all orders" on public.orders for select
  using (public.is_admin());
create policy "Users create own orders" on public.orders for insert
  with check (auth.uid() = user_id or user_id is null);
create policy "Admins update orders" on public.orders for update
  using (public.is_admin());

-- ---- order_items (via order ownership) ----
alter table public.order_items enable row level security;
create policy "Users view own order items" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "Admins view all order items" on public.order_items for select
  using (public.is_admin());
create policy "Users create own order items" on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- ---- payments (admin + owner read) ----
alter table public.payments enable row level security;
create policy "Users view own payments" on public.payments for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "Admins manage payments" on public.payments for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- refunds (admin only) ----
alter table public.refunds enable row level security;
create policy "Users view own refunds" on public.refunds for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "Admins manage refunds" on public.refunds for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- coupons (public read of active, admin manage) ----
alter table public.coupons enable row level security;
create policy "Active coupons are publicly readable" on public.coupons for select
  using (is_active = true);
create policy "Admins manage coupons" on public.coupons for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- discount_campaigns (public read of active, admin manage) ----
alter table public.discount_campaigns enable row level security;
create policy "Active campaigns are publicly readable" on public.discount_campaigns for select
  using (is_active = true);
create policy "Admins manage campaigns" on public.discount_campaigns for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.discount_campaign_targets enable row level security;
create policy "Campaign targets are publicly readable" on public.discount_campaign_targets for select
  using (true);
create policy "Admins manage campaign targets" on public.discount_campaign_targets for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- banners (public read of published, admin manage) ----
alter table public.banners enable row level security;
create policy "Published banners are publicly readable" on public.banners for select
  using (is_published = true);
create policy "Admins manage banners" on public.banners for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- reviews ----
alter table public.reviews enable row level security;
create policy "Approved reviews are publicly readable" on public.reviews for select
  using (status = 'approved' and deleted_at is null);
create policy "Users view own reviews" on public.reviews for select
  using (auth.uid() = user_id);
create policy "Users create own reviews" on public.reviews for insert
  with check (auth.uid() = user_id);
create policy "Users update own reviews" on public.reviews for update
  using (auth.uid() = user_id and status = 'pending');
create policy "Admins manage reviews" on public.reviews for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- wishlists (owner only) ----
alter table public.wishlists enable row level security;
create policy "Users manage own wishlists" on public.wishlists for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.wishlist_items enable row level security;
create policy "Users manage own wishlist items" on public.wishlist_items for all
  using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()));

-- ---- recently_viewed (owner or session) ----
alter table public.recently_viewed enable row level security;
create policy "Users view own recently viewed" on public.recently_viewed for select
  using (auth.uid() = user_id);
create policy "Guests view own session recently viewed" on public.recently_viewed for select
  using (user_id is null and session_id = current_setting('request.session_id', true));
create policy "Users insert own recently viewed" on public.recently_viewed for insert
  with check (auth.uid() = user_id or user_id is null);

-- ---- shipping_methods (public read, admin manage) ----
alter table public.shipping_methods enable row level security;
create policy "Active shipping methods are publicly readable" on public.shipping_methods for select
  using (is_active = true);
create policy "Admins manage shipping methods" on public.shipping_methods for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- tax_rules (public read, admin manage) ----
alter table public.tax_rules enable row level security;
create policy "Active tax rules are publicly readable" on public.tax_rules for select
  using (is_active = true);
create policy "Admins manage tax rules" on public.tax_rules for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- notification_templates (admin only) ----
alter table public.notification_templates enable row level security;
create policy "Admins manage notification templates" on public.notification_templates for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- notifications (owner only) ----
alter table public.notifications enable row level security;
create policy "Users view own notifications" on public.notifications for select
  using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update
  using (auth.uid() = user_id);
create policy "Users insert own notifications" on public.notifications for insert
  with check (auth.uid() = user_id);

-- ---- admin_roles / permissions (admin only) ----
alter table public.admin_roles enable row level security;
create policy "Admins manage roles" on public.admin_roles for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.admin_permissions enable row level security;
create policy "Admins manage permissions" on public.admin_permissions for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.admin_role_permissions enable row level security;
create policy "Admins manage role permissions" on public.admin_role_permissions for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- admin_users (admin only; a user can read their own row) ----
alter table public.admin_users enable row level security;
create policy "Admins view all admin users" on public.admin_users for select
  using (public.is_admin());
create policy "A user can read their own admin row" on public.admin_users for select
  using (auth.uid() = id);
create policy "Admins manage admin users" on public.admin_users for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- audit_logs (admin only) ----
alter table public.audit_logs enable row level security;
create policy "Admins view audit logs" on public.audit_logs for select
  using (public.is_admin());
create policy "Admins insert audit logs" on public.audit_logs for insert
  with check (public.is_admin());

-- ---- media_assets (admin manage, public read) ----
alter table public.media_assets enable row level security;
create policy "Media assets are publicly readable" on public.media_assets for select
  using (true);
create policy "Admins manage media assets" on public.media_assets for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- store_settings (public read, admin manage) ----
alter table public.store_settings enable row level security;
create policy "Store settings are publicly readable" on public.store_settings for select
  using (true);
create policy "Admins manage store settings" on public.store_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- seo_metadata (public read, admin manage) ----
alter table public.seo_metadata enable row level security;
create policy "SEO metadata is publicly readable" on public.seo_metadata for select
  using (true);
create policy "Admins manage SEO metadata" on public.seo_metadata for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 10. RPC FUNCTIONS (transactional business logic)
-- ============================================================================

-- place_order: validates stock, creates order + items, decrements inventory,
-- marks cart as converted. Executed transactionally via supabase.rpc().
create or replace function public.place_order(
  p_user_id      uuid,
  p_guest_email  text,
  p_cart_id      uuid,
  p_shipping_address jsonb,
  p_billing_address  jsonb,
  p_shipping_method  text,
  p_shipping_total   numeric,
  p_tax_total        numeric,
  p_discount_total   numeric,
  p_coupon_code      text,
  p_customer_note    text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order        public.orders%rowtype;
  v_order_number text;
  v_cart_item    record;
  v_subtotal     numeric(12,2) := 0;
  v_grand_total  numeric(12,2);
  v_count        integer;
begin
  -- Generate a sequential, human-readable order number.
  select coalesce(max(id), 0) + 1 into v_count from public.orders;
  v_order_number := 'BK-' || lpad(v_count::text, 6, '0');

  -- Compute subtotal from cart items.
  select coalesce(sum(ci.unit_price * ci.quantity), 0) into v_subtotal
    from public.cart_items ci where ci.cart_id = p_cart_id;

  v_grand_total := v_subtotal - p_discount_total + p_shipping_total + p_tax_total;

  -- Insert the order.
  insert into public.orders (
    order_number, user_id, guest_email, status, currency,
    subtotal, discount_total, shipping_total, tax_total, grand_total,
    shipping_address, billing_address, shipping_method,
    coupon_code, customer_note, confirmed_at
  ) values (
    v_order_number, p_user_id, p_guest_email, 'confirmed', 'PKR',
    v_subtotal, p_discount_total, p_shipping_total, p_tax_total, v_grand_total,
    p_shipping_address, p_billing_address, p_shipping_method,
    p_coupon_code, p_customer_note, now()
  ) returning * into v_order;

  -- Move cart items to order items + decrement inventory.
  for v_cart_item in select * from public.cart_items where cart_id = p_cart_id loop
    insert into public.order_items (
      order_id, variant_id, product_id, product_name, variant_name, sku,
      quantity, unit_price, line_total
    ) values (
      v_order.id, v_cart_item.variant_id, v_cart_item.product_id,
      (select name from public.products where id = v_cart_item.product_id),
      (select name from public.product_variants where id = v_cart_item.variant_id),
      (select sku from public.product_variants where id = v_cart_item.variant_id),
      v_cart_item.quantity, v_cart_item.unit_price,
      v_cart_item.unit_price * v_cart_item.quantity
    );

    -- Decrement inventory (with a guard against oversell).
    update public.product_variants
      set stock_quantity = stock_quantity - v_cart_item.quantity
      where id = v_cart_item.variant_id
        and stock_quantity >= v_cart_item.quantity;

    if not found then
      raise exception 'Insufficient stock for variant %', v_cart_item.variant_id;
    end if;
  end loop;

  -- Mark cart as converted.
  update public.carts set status = 'converted' where id = p_cart_id;

  -- Increment coupon usage if a coupon was applied.
  if p_coupon_code is not null then
    update public.coupons
      set used_count = used_count + 1
      where lower(code) = lower(p_coupon_code);
  end if;

  return v_order;
end;
$$;

-- validate_coupon: server-side coupon validation before checkout.
create or replace function public.validate_coupon(
  p_code        text,
  p_cart_subtotal numeric,
  p_user_id     uuid default null
)
returns table(is_valid boolean, discount_amount numeric, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon public.coupons%rowtype;
  v_user_usage integer;
begin
  select * into v_coupon from public.coupons where lower(code) = lower(p_code);

  if not found then
    return query select false, 0::numeric, 'Coupon not found'::text;
    return;
  end if;

  if not v_coupon.is_active then
    return query select false, 0::numeric, 'Coupon is inactive'::text;
    return;
  end if;

  if v_coupon.starts_at is not null and now() < v_coupon.starts_at then
    return query select false, 0::numeric, 'Coupon not yet active'::text;
    return;
  end if;

  if v_coupon.expires_at is not null and now() > v_coupon.expires_at then
    return query select false, 0::numeric, 'Coupon has expired'::text;
    return;
  end if;

  if v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit then
    return query select false, 0::numeric, 'Coupon usage limit reached'::text;
    return;
  end if;

  if p_cart_subtotal < v_coupon.min_order_value then
    return query select false, 0::numeric, 'Cart does not meet minimum order value'::text;
    return;
  end if;

  if p_user_id is not null and v_coupon.usage_limit_per_customer > 0 then
    select count(*) into v_user_usage
      from public.orders o
      where o.user_id = p_user_id and lower(o.coupon_code) = lower(p_code);
    if v_user_usage >= v_coupon.usage_limit_per_customer then
      return query select false, 0::numeric, 'You have already used this coupon'::text;
      return;
    end if;
  end if;

  -- Compute discount.
  if v_coupon.discount_type = 'percentage' then
    declare v_disc numeric;
    begin
      v_disc := p_cart_subtotal * (v_coupon.discount_value / 100.0);
      if v_coupon.max_discount_amount is not null and v_disc > v_coupon.max_discount_amount then
        v_disc := v_coupon.max_discount_amount;
      end if;
      return query select true, v_disc, 'Coupon applied'::text;
    end;
  else
    return query select true, least(v_coupon.discount_value, p_cart_subtotal), 'Coupon applied'::text;
  end if;
end;
$$;

-- merge_guest_cart: merge a guest session cart into the user's account cart on login.
create or replace function public.merge_guest_cart(p_user_id uuid, p_session_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest_cart uuid;
  v_user_cart  uuid;
  v_item      record;
begin
  -- Find the guest cart.
  select id into v_guest_cart from public.carts
    where session_id = p_session_id and user_id is null and status = 'active'
    limit 1;

  if v_guest_cart is null then return; end if;

  -- Find or create the user's active cart.
  select id into v_user_cart from public.carts
    where user_id = p_user_id and status = 'active' limit 1;

  if v_user_cart is null then
    insert into public.carts (user_id, status) values (p_user_id, 'active')
      returning id into v_user_cart;
  end if;

  -- Move items, deduping by variant.
  for v_item in select * from public.cart_items where cart_id = v_guest_cart loop
    insert into public.cart_items (cart_id, variant_id, product_id, quantity, unit_price)
    values (v_user_cart, v_item.variant_id, v_item.product_id, v_item.quantity, v_item.unit_price)
    on conflict (cart_id, variant_id)
    do update set quantity = public.cart_items.quantity + excluded.quantity;
  end loop;

  -- Delete the guest cart.
  delete from public.carts where id = v_guest_cart;
end;
$$;

-- ============================================================================
-- 11. AUTH HOOK — auto-create a profile on signup
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Idempotent: PostgreSQL has no "CREATE TRIGGER IF NOT EXISTS", so drop+create.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 12. STORAGE BUCKETS
-- ============================================================================
insert into storage.buckets (id, name, public) values
  ('product-images', 'product-images', true),
  ('banner-images', 'banner-images', true),
  ('avatars', 'avatars', true),
  ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- Storage policies: public read, admin write for product/banner images.
create policy "Public read product images" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "Admin write product images" on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admin update product images" on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());
create policy "Admin delete product images" on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

create policy "Public read banner images" on storage.objects for select
  using (bucket_id = 'banner-images');
create policy "Admin write banner images" on storage.objects for insert
  with check (bucket_id = 'banner-images' and public.is_admin());

create policy "Public read avatars" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "Owner write avatar" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() = (storage.foldername(name))[1]::uuid);
create policy "Owner update avatar" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() = (storage.foldername(name))[1]::uuid);

create policy "Admin read invoices" on storage.objects for select
  using (bucket_id = 'invoices' and public.is_admin());
create policy "Admin write invoices" on storage.objects for insert
  with check (bucket_id = 'invoices' and public.is_admin());

-- ============================================================================
-- 13. SEED DATA
-- ============================================================================

-- Admin roles
insert into public.admin_roles (id, name, description, is_system) values
  ('00000000-0000-0000-0000-000000000001', 'Super Admin', 'Full access to everything', true),
  ('00000000-0000-0000-0000-000000000002', 'Store Manager', 'Manage catalog, orders, marketing', false),
  ('00000000-0000-0000-0000-000000000003', 'Support Agent', 'View orders and customers, manage reviews', false),
  ('00000000-0000-0000-0000-000000000004', 'Content Editor', 'Manage products, banners, SEO', false)
on conflict (name) do nothing;

-- Admin permissions
insert into public.admin_permissions (id, key, description, module) values
  ('00000000-0000-0000-0000-000000000101', 'products.read', 'View products', 'catalog'),
  ('00000000-0000-0000-0000-000000000102', 'products.write', 'Create and edit products', 'catalog'),
  ('00000000-0000-0000-0000-000000000103', 'products.delete', 'Delete products', 'catalog'),
  ('00000000-0000-0000-0000-000000000201', 'categories.write', 'Manage categories', 'catalog'),
  ('00000000-0000-0000-0000-000000000202', 'brands.write', 'Manage brands', 'catalog'),
  ('00000000-0000-0000-0000-000000000301', 'orders.read', 'View orders', 'orders'),
  ('00000000-0000-0000-0000-000000000302', 'orders.write', 'Update order status', 'orders'),
  ('00000000-0000-0000-0000-000000000303', 'orders.refund', 'Issue refunds', 'orders'),
  ('00000000-0000-0000-0000-000000000401', 'customers.read', 'View customers', 'customers'),
  ('00000000-0000-0000-0000-000000000402', 'customers.write', 'Manage customers', 'customers'),
  ('00000000-0000-0000-0000-000000000501', 'reviews.moderate', 'Moderate reviews', 'reviews'),
  ('00000000-0000-0000-0000-000000000601', 'coupons.write', 'Manage coupons', 'marketing'),
  ('00000000-0000-0000-0000-000000000602', 'campaigns.write', 'Manage discount campaigns', 'marketing'),
  ('00000000-0000-0000-0000-000000000603', 'banners.write', 'Manage banners', 'marketing'),
  ('00000000-0000-0000-0000-000000000701', 'inventory.write', 'Adjust inventory', 'inventory'),
  ('00000000-0000-0000-0000-000000000801', 'settings.manage', 'Manage store settings', 'settings'),
  ('00000000-0000-0000-0000-000000000802', 'shipping.write', 'Manage shipping methods', 'settings'),
  ('00000000-0000-0000-0000-000000000803', 'tax.write', 'Manage tax rules', 'settings'),
  ('00000000-0000-0000-0000-000000000804', 'seo.write', 'Manage SEO metadata', 'content'),
  ('00000000-0000-0000-0000-000000000901', 'roles.write', 'Manage admin roles', 'system'),
  ('00000000-0000-0000-0000-000000000902', 'audit.read', 'View audit logs', 'system')
on conflict (key) do nothing;

-- Super Admin gets all permissions.
insert into public.admin_role_permissions (role_id, permission_id)
select r.id, p.id
  from public.admin_roles r, public.admin_permissions p
  where r.name = 'Super Admin'
on conflict do nothing;

-- Store Manager gets catalog + orders + marketing + inventory.
insert into public.admin_role_permissions (role_id, permission_id)
select r.id, p.id
  from public.admin_roles r, public.admin_permissions p
  where r.name = 'Store Manager'
    and p.key in ('products.read','products.write','categories.write','brands.write',
                  'orders.read','orders.write','orders.refund','customers.read',
                  'coupons.write','campaigns.write','banners.write','inventory.write',
                  'reviews.moderate')
on conflict do nothing;

-- Support Agent gets orders read + customers read + reviews.
insert into public.admin_role_permissions (role_id, permission_id)
select r.id, p.id
  from public.admin_roles r, public.admin_permissions p
  where r.name = 'Support Agent'
    and p.key in ('orders.read','orders.write','customers.read','customers.write','reviews.moderate')
on conflict do nothing;

-- Content Editor gets products + banners + SEO.
insert into public.admin_role_permissions (role_id, permission_id)
select r.id, p.id
  from public.admin_roles r, public.admin_permissions p
  where r.name = 'Content Editor'
    and p.key in ('products.read','products.write','categories.write','brands.write',
                  'banners.write','seo.write')
on conflict do nothing;

-- Default notification templates.
insert into public.notification_templates (event_type, channel, subject, body_template) values
  ('order_confirmed', 'email', 'Your BK Store order {{order_number}} is confirmed',
   'Hi {{first_name}}, thank you for your order {{order_number}}. We''ll let you know once it ships.'),
  ('order_shipped', 'email', 'Your order {{order_number}} has shipped',
   'Hi {{first_name}}, your order is on its way. Tracking: {{tracking_number}}.'),
  ('password_reset', 'email', 'Reset your BK Store password',
   'Click the link below to reset your password: {{reset_link}}'),
  ('low_stock_alert', 'email', 'Low stock alert: {{product_name}}',
   'The product {{product_name}} (SKU {{sku}}) has dropped below its threshold ({{stock}} remaining).')
on conflict (event_type) do nothing;

-- Default shipping methods.
insert into public.shipping_methods (name, type, rate, estimated_days_min, estimated_days_max, sort_order) values
  ('Standard Shipping', 'flat_rate', 9.99, 5, 7, 1),
  ('Express Shipping', 'flat_rate', 19.99, 2, 3, 2),
  ('Free Shipping (over $75)', 'free_threshold', 0.00, 5, 7, 3)
on conflict do nothing;

-- Default tax rule (US, all states, 0% — configure per region).
insert into public.tax_rules (name, country, rate, inclusive) values
  ('US Default', 'US', 0.0000, false)
on conflict do nothing;

-- Sample categories.
insert into public.categories (id, name, slug, sort_order) values
  ('00000000-0000-0000-0000-000000000a01', 'Apparel', 'apparel', 1),
  ('00000000-0000-0000-0000-000000000a02', 'Electronics', 'electronics', 2),
  ('00000000-0000-0000-0000-000000000a03', 'Home Goods', 'home-goods', 3),
  ('00000000-0000-0000-0000-000000000a04', 'Accessories', 'accessories', 4)
on conflict (slug) do nothing;

-- Sample brands.
insert into public.brands (id, name, slug, is_featured) values
  ('00000000-0000-0000-0000-000000000b01', 'BK Originals', 'bk-originals', true),
  ('00000000-0000-0000-0000-000000000b02', 'Atelier Noir', 'atelier-noir', true)
on conflict (slug) do nothing;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
