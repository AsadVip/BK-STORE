-- =====================================================================
-- BK STORE — SALE-SYSTEM.SQL
-- Flash Sale & Storewide Discount System Database Schema & Seed
-- =====================================================================

-- 1. Create store_settings Table (if not existing) & Ensure Columns Exist
CREATE TABLE IF NOT EXISTS public.store_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure key and value columns exist even if table pre-existed with different columns
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS key VARCHAR(255),
ADD COLUMN IF NOT EXISTS value JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read store settings" ON public.store_settings;
CREATE POLICY "Public read store settings" 
ON public.store_settings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Authenticated write store settings" ON public.store_settings;
CREATE POLICY "Authenticated write store settings" 
ON public.store_settings FOR ALL 
USING (true);

-- 2. Create store_sales Table for Flash Sale Configurations
CREATE TABLE IF NOT EXISTS public.store_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_title VARCHAR(255) NOT NULL DEFAULT 'MEGA FLASH SALE',
    discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 40.00,
    badge_text VARCHAR(100) DEFAULT 'Upto 40% OFF',
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for public read
ALTER TABLE public.store_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active store sales" ON public.store_sales;
CREATE POLICY "Public read active store sales" 
ON public.store_sales FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admin modify store sales" ON public.store_sales;
CREATE POLICY "Admin modify store sales" 
ON public.store_sales FOR ALL 
USING (true);

-- 3. Insert Default Active Flash Sale Record (if none exists)
INSERT INTO public.store_sales (sale_title, discount_percentage, badge_text, starts_at, ends_at, is_active)
SELECT 
    'MEGA FLASH SALE', 
    40.00, 
    'Upto 40% OFF', 
    NOW(), 
    NOW() + INTERVAL '3 days', 
    true
WHERE NOT EXISTS (SELECT 1 FROM public.store_sales LIMIT 1);

-- 4. Seed store_settings key for fallback compatibility
INSERT INTO public.store_settings (key, value)
VALUES (
  'flash_sale', 
  jsonb_build_object(
    'is_active', true,
    'sale_title', 'MEGA FLASH SALE',
    'discount_percentage', 40,
    'badge_text', 'Upto 40% OFF',
    'ends_at', (NOW() + INTERVAL '3 days')
  )
)
ON CONFLICT DO NOTHING;

-- End of sale-system.sql
