-- ============================================================================
-- Migration: 009_fix_fcm_and_notifications_rls.sql
-- MUST RUN in Supabase Dashboard -> SQL Editor
-- Description: Creates SECURITY DEFINER functions so ANY user (guest/customer)
--              can insert order notifications and the admin's Realtime listener
--              will fire the Chrome native push notification.
-- ============================================================================

-- 1. SECURITY DEFINER function to insert order notification (bypasses RLS)
create or replace function public.insert_order_notification(
  p_title text,
  p_body text,
  p_link text default '/admin/orders',
  p_order_number text default null,
  p_customer_name text default null,
  p_grand_total numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (type, title, body, link, metadata, is_read)
  values (
    'order',
    p_title,
    p_body,
    p_link,
    jsonb_build_object(
      'order_number', coalesce(p_order_number, ''),
      'customer_name', coalesce(p_customer_name, ''),
      'grand_total', p_grand_total
    ),
    false
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.insert_order_notification(text, text, text, text, text, numeric) to authenticated, anon;

-- 2. SECURITY DEFINER function to fetch active admin device tokens
create or replace function public.get_active_admin_device_tokens()
returns table (
  id uuid,
  device_token text,
  browser text,
  platform text
)
language sql
security definer
set search_path = public
as $$
  select id, device_token, browser, platform
  from public.admin_device_tokens
  where last_seen >= now() - interval '90 days';
$$;

grant execute on function public.get_active_admin_device_tokens() to authenticated, anon;

-- 3. Ensure Realtime is enabled for notifications table
alter publication supabase_realtime add table public.notifications;

-- ============================================================================
-- DONE! After running this, customer/guest orders will insert notifications
-- and admin's Chrome native push will fire automatically.
-- ============================================================================
