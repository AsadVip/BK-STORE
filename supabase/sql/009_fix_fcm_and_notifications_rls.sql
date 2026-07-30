-- ============================================================================
-- Migration: 009_fix_fcm_and_notifications_rls.sql
-- Description: Enables anonymous & authenticated customer checkouts to insert
--              notifications and query active admin FCM device tokens via a
--              SECURITY DEFINER helper function.
-- ============================================================================

-- 1. Helper function to fetch active admin device tokens securely for order push
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

-- Grant execution permissions on function
grant execute on function public.get_active_admin_device_tokens() to authenticated, anon;

-- 2. Allow insert into public.notifications for anonymous and authenticated customer checkouts
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'notifications' and policyname = 'Anyone can insert notifications'
  ) then
    create policy "Anyone can insert notifications"
      on public.notifications for insert
      with check (true);
  end if;
end $$;

-- 3. Allow select on public.admin_device_tokens for push dispatch
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'admin_device_tokens' and policyname = 'Anyone can select admin device tokens for push notification'
  ) then
    create policy "Anyone can select admin device tokens for push notification"
      on public.admin_device_tokens for select
      using (true);
  end if;
end $$;
