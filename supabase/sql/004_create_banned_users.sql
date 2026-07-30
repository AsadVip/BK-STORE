-- ============================================================================
-- Migration: 004_create_banned_users.sql
-- Description: Implements database-level User Ban System enforcement.
--              Prevents banned users or emails from creating new orders in Supabase,
--              raising exact error message required by specifications.
-- ============================================================================

-- 1. Trigger function to block orders from banned profiles
create or replace function public.check_banned_user_before_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_is_banned boolean := false;
  v_ban_type text;
  v_banned_until timestamptz;
begin
  v_email := lower(trim(coalesce(new.guest_email, new.email, '')));

  -- 1a. Check by user_id
  if new.user_id is not null then
    select (status = 'banned'), ban_type, banned_until
    into v_is_banned, v_ban_type, v_banned_until
    from public.profiles
    where id = new.user_id;
  end if;

  -- 1b. Check by email if not found by user_id
  if not v_is_banned and v_email is not null and v_email != '' then
    select (status = 'banned'), ban_type, banned_until
    into v_is_banned, v_ban_type, v_banned_until
    from public.profiles
    where lower(email) = v_email;
  end if;

  -- 1c. If temporary ban expired, auto-clear ban
  if v_is_banned and v_ban_type = 'temporary' and v_banned_until is not null and now() > v_banned_until then
    v_is_banned := false;
    update public.profiles set status = 'active' where lower(email) = v_email or id = new.user_id;
  end if;

  -- 1d. Reject order if banned
  if v_is_banned then
    raise exception 'Your account has been restricted from placing new orders. Please contact support.';
  end if;

  return new;
end;
$$;

-- Attach trigger to public.orders table before insert
drop trigger if exists trg_check_banned_user_before_order on public.orders;
create trigger trg_check_banned_user_before_order
  before insert on public.orders
  for each row execute function public.check_banned_user_before_order();

-- 2. Helper functions for Admin User Ban System
create or replace function public.ban_user(
  p_profile_id uuid,
  p_reason text,
  p_ban_type text default 'permanent',
  p_banned_until timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized to ban users.';
  end if;

  update public.profiles
  set
    status = 'banned',
    ban_reason = p_reason,
    ban_type = p_ban_type,
    banned_at = now(),
    banned_until = p_banned_until,
    updated_at = now()
  where id = p_profile_id;
end;
$$;

create or replace function public.unban_user(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized to unban users.';
  end if;

  update public.profiles
  set
    status = 'active',
    ban_reason = null,
    ban_type = null,
    banned_at = null,
    banned_until = null,
    updated_at = now()
  where id = p_profile_id;
end;
$$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS:
-- drop trigger if exists trg_check_banned_user_before_order on public.orders;
-- drop function if exists public.check_banned_user_before_order();
-- drop function if exists public.ban_user(uuid, text, text, timestamptz);
-- drop function if exists public.unban_user(uuid);
-- ============================================================================
