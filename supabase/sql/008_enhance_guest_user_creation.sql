-- ============================================================================
-- Migration: 008_enhance_guest_user_creation.sql
-- Description: Helper functions and triggers to ensure every guest order
--              creates or updates a unique profile record, maintaining exact
--              User Management statistics and spend recalculations on cancellation.
-- ============================================================================

-- 1. Function to ensure a customer profile exists for any email
create or replace function public.ensure_customer_profile(
  p_email text,
  p_first_name text default null,
  p_last_name text default null,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_profile_id uuid;
begin
  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' then
    return null;
  end if;

  -- Check if profile exists by email
  select id into v_profile_id from public.profiles where lower(email) = v_email limit 1;

  if v_profile_id is null then
    -- Create new profile entry (guest account)
    insert into public.profiles (
      id, email, first_name, last_name, phone, is_guest, status
    ) values (
      gen_random_uuid(), v_email, p_first_name, p_last_name, p_phone, true, 'active'
    )
    returning id into v_profile_id;
  else
    -- Update existing profile phone / name if provided
    update public.profiles
    set
      first_name = coalesce(p_first_name, first_name),
      last_name = coalesce(p_last_name, last_name),
      phone = coalesce(p_phone, phone),
      updated_at = now()
    where id = v_profile_id;
  end if;

  return v_profile_id;
end;
$$;

-- 2. Trigger function to recompute customer metrics when order status changes (e.g. cancelled/refunded)
create or replace function public.recompute_customer_stats_on_order_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_order_count integer;
  v_total_spend numeric(12,2);
  v_first_order timestamptz;
  v_last_order timestamptz;
begin
  v_email := lower(trim(coalesce(new.guest_email, old.guest_email, new.email, old.email, '')));

  if v_email is not null and v_email != '' then
    -- Calculate active (non-cancelled) order stats for this customer
    select
      count(*)::integer,
      coalesce(sum(grand_total), 0.00)::numeric(12,2),
      min(placed_at),
      max(placed_at)
    into
      v_order_count,
      v_total_spend,
      v_first_order,
      v_last_order
    from public.orders
    where lower(coalesce(guest_email, email, '')) = v_email
      and status not in ('cancelled', 'refunded');

    -- Update profiles table
    update public.profiles
    set
      order_count = v_order_count,
      total_spend = v_total_spend,
      first_order_date = v_first_order,
      last_order_date = v_last_order,
      updated_at = now()
    where lower(email) = v_email;
  end if;

  return new;
end;
$$;

drop trigger if exists me_recompute_stats on public.orders;
drop trigger if exists trg_recompute_stats on public.orders;
create trigger trg_recompute_stats
  after update of status on public.orders
  for each row execute function public.recompute_customer_stats_on_order_update();

-- Grant permissions
grant execute on function public.ensure_customer_profile(text, text, text, text) to authenticated, anon;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS:
-- drop trigger if exists trg_recompute_stats on public.orders;
-- drop function if exists public.recompute_customer_stats_on_order_update();
-- drop function if exists public.ensure_customer_profile(text, text, text, text);
-- ============================================================================
