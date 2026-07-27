-- =====================================================================
-- BK STORE — FIX ORDERS RLS & ADMIN RECEIPT
-- Run this script in Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================================

-- 1. Ensure RLS allows Guest Checkout Order Insertion
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- 2. Allow Admin Panel & Customers to Select Orders
DROP POLICY IF EXISTS "Public select orders" ON public.orders;
DROP POLICY IF EXISTS "Public track order by number" ON public.orders;
CREATE POLICY "Public select orders" 
ON public.orders FOR SELECT 
USING (true);

-- 3. Allow Admin Panel to Update Order Status
DROP POLICY IF EXISTS "Public update orders" ON public.orders;
CREATE POLICY "Public update orders" 
ON public.orders FOR UPDATE 
USING (true);

-- 4. Enable RLS policies on order_items table as well
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
CREATE POLICY "Public insert order_items" 
ON public.order_items FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public select order_items" ON public.order_items;
CREATE POLICY "Public select order_items" 
ON public.order_items FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Public update order_items" ON public.order_items;
CREATE POLICY "Public update order_items" 
ON public.order_items FOR UPDATE 
USING (true);

-- Done! Guest orders can now be created and received on Admin Panel.
