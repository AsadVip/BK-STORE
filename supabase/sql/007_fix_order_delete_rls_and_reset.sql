-- ============================================================================
-- Migration: 007_fix_order_delete_rls_and_reset.sql
-- Description: Adds missing RLS DELETE policies on public.orders and related tables,
--              and provides a SECURITY DEFINER RPC public.reset_all_orders()
--              to permanently delete all order records and clean up caches.
-- ============================================================================

-- 1. Explicit RLS DELETE Policies for Admins on orders and commerce tables
drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
  on public.orders for delete
  using (public.is_admin());

drop policy if exists "Admins can delete order items" on public.order_items;
create policy "Admins can delete order items"
  on public.order_items for delete
  using (public.is_admin());

drop policy if exists "Admins can delete payments" on public.payments;
create policy "Admins can delete payments"
  on public.payments for delete
  using (public.is_admin());

drop policy if exists "Admins can delete refunds" on public.refunds;
create policy "Admins can delete refunds"
  on public.refunds for delete
  using (public.is_admin());

drop policy if exists "Admins can delete order logs" on public.order_logs;
create policy "Admins can delete order logs"
  on public.order_logs for delete
  using (public.is_admin());

-- 2. Drop existing function if present to allow changing return type to jsonb
drop function if exists public.reset_all_orders();

-- SECURITY DEFINER Function to safely and permanently reset all orders
create or replace function public.reset_all_orders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orders_deleted integer := 0;
  v_items_deleted integer := 0;
begin
  -- Verify Admin Permission
  if not public.is_admin() then
    raise exception 'Unauthorized to perform order reset. Super Admin permissions required.';
  end if;

  -- Delete all child records first
  delete from public.order_items;
  get diagnostics v_items_deleted = row_count;

  delete from public.payments;
  delete from public.refunds;
  delete from public.order_logs;
  
  -- Delete all orders
  delete from public.orders;
  get diagnostics v_orders_deleted = row_count;

  -- Reset customer metrics in profiles table
  update public.profiles
  set
    order_count = 0,
    total_spend = 0.00,
    first_order_date = null,
    last_order_date = null,
    updated_at = now();

  return jsonb_build_object(
    'success', true,
    'message', 'All order records permanently deleted.',
    'orders_deleted', v_orders_deleted,
    'items_deleted', v_items_deleted
  );
end;
$$;

-- Grant execution permission to authenticated and anon users (RPC validates is_admin internally)
grant execute on function public.reset_all_orders() to authenticated, anon;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS:
-- drop policy if exists "Admins can delete orders" on public.orders;
-- drop policy if exists "Admins can delete order items" on public.order_items;
-- drop policy if exists "Admins can delete payments" on public.payments;
-- drop policy if exists "Admins can delete refunds" on public.refunds;
-- drop policy if exists "Admins can delete order logs" on public.order_logs;
-- drop function if exists public.reset_all_orders();
-- ============================================================================
