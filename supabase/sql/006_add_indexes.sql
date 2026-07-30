-- ============================================================================
-- Migration: 006_add_indexes.sql
-- Description: Adds performance composite indexes across public schema tables
--              to optimize search, date filtering, and device token queries.
-- ============================================================================

-- Orders filtering & search indexes
create index if not exists idx_orders_placed_at on public.orders(placed_at desc);
create index if not exists idx_orders_guest_email on public.orders(lower(guest_email));
create index if not exists idx_orders_status_placed_at on public.orders(status, placed_at desc);

-- Profiles filtering indexes
create index if not exists idx_profiles_status_created on public.profiles(status, created_at desc);
create index if not exists idx_profiles_email_lower on public.profiles(lower(email));

-- Notifications query indexes
create index if not exists idx_notifications_is_read_created on public.notifications(is_read, created_at desc);
create index if not exists idx_notifications_type on public.notifications(type);

-- Admin device tokens query index
create index if not exists idx_admin_tokens_updated on public.admin_device_tokens(updated_at desc);

-- ============================================================================
-- ROLLBACK INSTRUCTIONS:
-- drop index if exists idx_orders_placed_at;
-- drop index if exists idx_orders_guest_email;
-- drop index if exists idx_orders_status_placed_at;
-- drop index if exists idx_profiles_status_created;
-- drop index if exists idx_profiles_email_lower;
-- drop index if exists idx_notifications_is_read_created;
-- drop index if exists idx_notifications_type;
-- drop index if exists idx_admin_tokens_updated;
-- ============================================================================
