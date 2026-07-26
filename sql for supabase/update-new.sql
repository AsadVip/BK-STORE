-- =====================================================================
-- BK STORE — UPDATE-NEW.SQL
-- Schema Enhancements, Placement Flags, Performance Indexes & Seeds
-- =====================================================================

-- 1. Ensure all product, category & review columns exist safely
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS body TEXT,
ADD COLUMN IF NOT EXISTS comment TEXT,
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved';

-- 2. Performance Indexes for Fast Catalog Queries
CREATE INDEX IF NOT EXISTS idx_products_published_deleted 
ON public.products (status, deleted_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_placement_new_arrival 
ON public.products (is_new_arrival) WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_placement_best_seller 
ON public.products (is_best_seller) WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_categories_join 
ON public.product_categories (product_id, category_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_stock 
ON public.product_variants (product_id, stock_quantity) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_product_images_order 
ON public.product_images (product_id, sort_order);

-- 3. Watch & Shoes Primary Categories Seeding (if not present)
INSERT INTO public.categories (name, slug, description, is_active, sort_order)
VALUES 
  ('Luxury Watches', 'luxury-watches', 'Boutique Swiss & luxury timepieces crafted for precision and style.', true, 1),
  ('Premium Sneakers & Shoes', 'premium-shoes', 'Exclusive footwear, deadstock sneakers, and luxury leather shoes.', true, 2)
ON CONFLICT (slug) DO UPDATE 
SET description = EXCLUDED.description, is_active = true;

-- 4. Enable Public Read RLS Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published products" ON public.products;
CREATE POLICY "Public read published products" 
ON public.products FOR SELECT 
USING (status = 'published' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
CREATE POLICY "Public read active categories" 
ON public.categories FOR SELECT 
USING (is_active = true);

-- 5. Seed Fake Verified Reviews (sample) safely
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;

INSERT INTO public.reviews (product_id, user_id, rating, title, body, comment, status)
SELECT 
  p.id as product_id, 
  (SELECT id FROM public.profiles LIMIT 1) as user_id, 
  5 as rating, 
  'Outstanding Quality & Authenticity' as title, 
  'Fast delivery, pristine original box and condition. Exceptional service!' as body,
  'Fast delivery, pristine original box and condition. Exceptional service!' as comment,
  'approved' as status
FROM public.products p
WHERE p.status = 'published' 
LIMIT 5
ON CONFLICT DO NOTHING;

-- End of update-new.sql
