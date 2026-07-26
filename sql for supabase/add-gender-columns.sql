-- ============================================================================
-- BK STORE — ADD GENDER TARGETING COLUMNS TO PRODUCTS TABLE
-- ============================================================================
-- Run this script in your Supabase SQL Editor to add `is_men` and `is_women`
-- boolean columns to the public.products table.
-- ============================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_men BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_women BOOLEAN DEFAULT false;

-- Add index for fast catalog gender filtering
CREATE INDEX IF NOT EXISTS idx_products_gender ON public.products (is_men, is_women);

-- Update existing records if needed
UPDATE public.products SET is_men = true WHERE is_men IS NULL;
UPDATE public.products SET is_women = false WHERE is_women IS NULL;
