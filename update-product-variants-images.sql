-- ============================================================================
-- BK STORE — UPDATE PRODUCT VARIANTS & MULTIPLE IMAGES
-- ============================================================================
-- Run this script in your Supabase SQL Editor to ensure product_variants
-- and product_images tables and policies exist and support multiple images
-- and product variants.
-- ============================================================================

-- 1. Ensure product_variants table exists with all required columns
CREATE TABLE IF NOT EXISTS public.product_variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku           TEXT NOT NULL,
  name          TEXT, -- e.g. "Small / Red" or "64GB / Black"
  title         TEXT,
  option_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  price         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  compare_at_price NUMERIC(12,2) CHECK (compare_at_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  weight_grams  INTEGER,
  barcode       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

-- Ensure title/name columns exist if table was created previously without them
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) DEFAULT 0;

-- 2. Ensure product_images table exists with all required columns
CREATE TABLE IF NOT EXISTS public.product_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id    UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL DEFAULT '',
  url           TEXT NOT NULL,
  alt_text      TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist if table was created previously
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS url TEXT;

-- 3. Indexes for fast catalog queries
CREATE INDEX IF NOT EXISTS idx_product_variants_prod ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_prod ON public.product_images (product_id, sort_order);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Public read active product variants" ON public.product_variants;
CREATE POLICY "Public read active product variants" 
ON public.product_variants FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Public read product images" ON public.product_images;
CREATE POLICY "Public read product images" 
ON public.product_images FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admin full access product_variants" ON public.product_variants;
CREATE POLICY "Admin full access product_variants" 
ON public.product_variants FOR ALL 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access product_images" ON public.product_images;
CREATE POLICY "Admin full access product_images" 
ON public.product_images FOR ALL 
USING (true)
WITH CHECK (true);

-- 5. Ensure order_items table & orders JSON payload columns exist
CREATE TABLE IF NOT EXISTS public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id    UUID,
  product_name  TEXT NOT NULL,
  variant_name  TEXT,
  quantity      INTEGER NOT NULL DEFAULT 1,
  unit_price    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_items JSONB;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access order_items" ON public.order_items;
CREATE POLICY "Public access order_items" 
ON public.order_items FOR ALL 
USING (true) 
WITH CHECK (true);

