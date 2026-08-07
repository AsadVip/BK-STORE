-- Add sort_order column to public.products table for manual product ordering
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Create index for high-performance sort_order queries
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products(sort_order ASC, created_at DESC);
