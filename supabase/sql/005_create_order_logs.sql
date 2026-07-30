-- ============================================================================
-- Migration: 005_create_order_logs.sql
-- Description: Creates public.order_logs table to record order activity audit trails,
--              status changes, customer cancellations, and system reset actions.
-- ============================================================================

create table if not exists public.order_logs (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid references public.orders(id) on delete set null,
  order_number  text,
  action        text not null, -- 'created', 'status_updated', 'cancelled', 'reset_deleted'
  performed_by  uuid, -- references auth.users
  actor_name    text default 'System / Customer',
  notes         text,
  previous_state jsonb,
  new_state     jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists idx_order_logs_order_id on public.order_logs(order_id);
create index if not exists idx_order_logs_created_at on public.order_logs(created_at desc);

-- RLS Policies for order_logs
alter table public.order_logs enable row level security;

create policy "Admins view all order logs"
  on public.order_logs for select
  using (public.is_admin());

create policy "Admins insert order logs"
  on public.order_logs for insert
  with check (public.is_admin());

-- Trigger function to automatically log order status updates
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into public.order_logs (
      order_id, order_number, action, performed_by, actor_name, notes, previous_state, new_state
    ) values (
      new.id,
      new.order_number,
      'status_updated',
      auth.uid(),
      coalesce(auth.jwt()->>'email', 'Admin'),
      'Order status changed from ' || old.status || ' to ' || new.status,
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_order_status_change on public.orders;
create trigger trg_log_order_status_change
  after update on public.orders
  for each row execute function public.log_order_status_change();

-- Function for Super Admin to Reset (delete all) orders safely
create or replace function public.reset_all_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_count integer;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized to reset order records. Super Admin privileges required.';
  end if;

  -- Log action before deleting
  insert into public.order_logs (
    action, performed_by, actor_name, notes
  ) values (
    'reset_deleted',
    auth.uid(),
    coalesce(auth.jwt()->>'email', 'Super Admin'),
    'Super Admin initiated total order reset.'
  );

  delete from public.orders;
  get diagnostics v_deleted_count = row_count;

  return v_deleted_count;
end;
$$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS:
-- drop table if exists public.order_logs cascade;
-- drop function if exists public.reset_all_orders();
-- ============================================================================
