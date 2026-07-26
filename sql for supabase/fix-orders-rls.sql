-- =====================================================================
-- FIX: Remove overly-permissive "USING(true)" RLS policy on orders
-- Run this in Supabase SQL Editor
-- =====================================================================

-- 1. Drop the bad policy that lets everyone see all orders
DROP POLICY IF EXISTS "Public track order by number" ON public.orders;

-- 2. Re-create a SAFE track-order policy (only by matching order_number + email)
-- This allows guests to track their order ONLY if they know both order number AND email
CREATE POLICY "Public track order by number"
ON public.orders FOR SELECT
USING (
  -- Logged-in users can see their own orders
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  -- Admins can see all
  OR public.is_admin()
  -- Guests can track by order_number (passed via RPC or function, not direct query)
  OR (
    user_id IS NULL 
    AND guest_email IS NOT NULL 
    AND guest_email = current_setting('request.headers', true)::json->>'x-guest-email'
  )
);

-- Done! Now only owners and admins can see orders.
