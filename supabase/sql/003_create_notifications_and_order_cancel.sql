-- ============================================================================
-- Migration: 003_create_notifications_and_order_cancel.sql
-- Description: Configures notifications table for Admin Notification Center and
--              implements backend functions and policies for the 4-hour customer
--              order cancellation window.
-- ============================================================================

-- 1. Ensure columns on public.notifications
alter table public.notifications
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Allow admins to view and manage all notifications
create policy "Admins can view and manage all notifications"
  on public.notifications for all
  using (public.is_admin())
  with check (public.is_admin());

-- 2. Add cancellation tracking columns to public.orders
alter table public.orders
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz;

-- 3. Function to enforce 4-hour order cancellation window
create or replace function public.cancel_customer_order(p_order_id uuid, p_reason text default 'Customer cancelled order')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_hours_diff numeric;
begin
  select * into v_order from public.orders where id = p_order_id;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Order not found.');
  end if;

  -- Verify ownership (if user logged in)
  if v_order.user_id is not null and v_order.user_id != auth.uid() and not public.is_admin() then
    return jsonb_build_object('success', false, 'message', 'Unauthorized to cancel this order.');
  end if;

  -- Check status eligibility
  if v_order.status in ('shipped', 'delivered', 'cancelled', 'refunded') then
    return jsonb_build_object('success', false, 'message', 'Order cannot be cancelled in current status: ' || v_order.status);
  end if;

  -- Enforce 4 hour restriction
  v_hours_diff := extract(epoch from (now() - coalesce(v_order.placed_at, v_order.created_at))) / 3600.0;
  if v_hours_diff > 4.0 then
    return jsonb_build_object('success', false, 'message', 'Order cancellation window has expired (4 hours limit exceeded).');
  end if;

  -- Perform cancellation
  update public.orders
  set
    status = 'cancelled',
    cancelled_at = now(),
    cancellation_reason = p_reason,
    updated_at = now()
  where id = p_order_id;

  -- Create notification record for Admin Notification Center
  insert into public.notifications (
    type, title, body, link, metadata
  ) values (
    'order',
    'Order Cancelled',
    'Order #' || v_order.order_number || ' was cancelled by customer.',
    '/admin/orders',
    jsonb_build_object('order_id', p_order_id, 'order_number', v_order.order_number)
  );

  return jsonb_build_object('success', true, 'message', 'Order successfully cancelled.');
end;
$$;

-- Grant execution permissions
grant execute on function public.cancel_customer_order(uuid, text) to authenticated, anon;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS:
-- alter table public.orders drop column if exists cancellation_reason, drop column if exists cancelled_at;
-- drop function if exists public.cancel_customer_order(uuid, text);
-- drop policy if exists "Admins can view and manage all notifications" on public.notifications;
-- ============================================================================
