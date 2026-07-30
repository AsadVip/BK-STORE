-- ============================================================================
-- Migration: 002_create_admin_device_tokens.sql
-- Description: Creates the admin_device_tokens table in Supabase to store FCM push
--              notification registration tokens for Admin devices.
-- ============================================================================

create table if not exists public.admin_device_tokens (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid references auth.users(id) on delete cascade,
  device_token  text not null unique,
  browser       text,
  platform      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_seen     timestamptz not null default now()
);

-- Indexes for active admin lookup and token uniqueness
create index if not exists idx_admin_device_tokens_admin_id on public.admin_device_tokens(admin_id);
create index if not exists idx_admin_device_tokens_last_seen on public.admin_device_tokens(last_seen desc);

-- Attach updated_at trigger function
select public.attach_updated_at_trigger('admin_device_tokens');

-- RLS Policies for admin_device_tokens
alter table public.admin_device_tokens enable row level security;

-- Admins can view and manage device tokens
create policy "Admins can view registered device tokens"
  on public.admin_device_tokens for select
  using (public.is_admin() or auth.uid() = admin_id);

create policy "Admins can insert and update their own device tokens"
  on public.admin_device_tokens for insert
  with check (auth.uid() = admin_id or public.is_admin());

create policy "Admins can update device tokens"
  on public.admin_device_tokens for update
  using (auth.uid() = admin_id or public.is_admin());

create policy "Admins can delete device tokens"
  on public.admin_device_tokens for delete
  using (auth.uid() = admin_id or public.is_admin());

-- ============================================================================
-- ROLLBACK INSTRUCTIONS:
-- drop table if exists public.admin_device_tokens cascade;
-- ============================================================================
