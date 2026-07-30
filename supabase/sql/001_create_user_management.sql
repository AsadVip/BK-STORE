-- ============================================================================
-- Migration: 001_create_user_management.sql
-- Description: Extends public.profiles table to support User Management statistics,
--              ban status, total spend, order counts, and auto-updating triggers for
--              both registered and guest customers.
-- ============================================================================

-- 1. Add User Management & Statistics columns to public.profiles if not existing
alter table public.profiles
  add column if not exists status text not null default 'active' check (status in ('active', 'banned')),
  add column if not exists ban_reason text,
  add column if not exists ban_type text check (ban_type in ('permanent', 'temporary')),
  add column if not exists banned_at timestamptz,
  add column if not exists banned_until timestamptz,
  add column if not exists order_count integer not null default 0 check (order_count >= 0),
  add column if not exists first_order_date timestamptz,
  add column if not exists last_order_date timestamptz,
  add column if not exists total_spend numeric(12,2) not null default 0.00 check (total_spend >= 0);

-- Indexes for performance filtering on status and email
create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_total_spend on public.profiles(total_spend desc);
create index if not exists idx_profiles_order_count on public.profiles(order_count desc);

-- 2. Trigger Function: Upsert or Update Profile statistics when an order is created/updated
create or replace function public.sync_profile_order_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_user_id uuid;
  v_grand_total numeric(12,2);
  v_placed_at timestamptz;
begin
  v_email := lower(trim(coalesce(new.guest_email, new.email, '')));
  v_user_id := new.user_id;
  v_grand_total := coalesce(new.grand_total, new.total_amount, 0.00);
  v_placed_at := coalesce(new.placed_at, new.created_at, now());

  if v_email is null or v_email = '' then
    return new;
  end if;

  -- 2a. If profile exists by user_id or email, update stats
  if v_user_id is not null and exists (select 1 from public.profiles where id = v_user_id) then
    update public.profiles
    set
      order_count = coalesce(order_count, 0) + 1,
      total_spend = coalesce(total_spend, 0.00) + v_grand_total,
      first_order_date = coalesce(first_order_date, v_placed_at),
      last_order_date = v_placed_at,
      updated_at = now()
    where id = v_user_id;
  elsif exists (select 1 from public.profiles where lower(email) = v_email) then
    update public.profiles
    set
      order_count = coalesce(order_count, 0) + 1,
      total_spend = coalesce(total_spend, 0.00) + v_grand_total,
      first_order_date = coalesce(first_order_date, v_placed_at),
      last_order_date = v_placed_at,
      updated_at = now()
    where lower(email) = v_email;
  end if;

  return new;
end;
$$;

-- Attach trigger to public.orders table
drop trigger if exists trg_sync_profile_order_stats on public.orders;
create trigger trg_sync_profile_order_stats
  after insert on public.orders
  for each row execute function public.sync_profile_order_stats();

-- 3. RLS Policies for Admin Management on Profiles
create policy "Admins manage profile status and ban settings"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- ROLLBACK INSTRUCTIONS:
-- alter table public.profiles drop column if exists status, drop column if exists ban_reason,
--   drop column if exists ban_type, drop column if exists banned_at, drop column if exists banned_until,
--   drop column if exists order_count, drop column if exists first_order_date, drop column if exists last_order_date,
--   drop column if exists total_spend;
-- drop trigger if exists trg_sync_profile_order_stats on public.orders;
-- drop function if exists public.sync_profile_order_stats();
-- ============================================================================
