-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query),
-- after migrations/000_permission_helper.sql and 001_complaints_table.sql.
-- Purely additive — no existing table is dropped or altered destructively,
-- and every new column is nullable or defaulted so existing rows stay valid.

-- 1. Secure QR order tracking -------------------------------------------
-- A random opaque token per order, separate from the numeric id and from
-- order_number (which is human-guessable), so a QR code / URL can identify
-- one order without exposing a database id or requiring the customer's
-- phone number in the link.
alter table public.orders
  add column if not exists tracking_token uuid not null default gen_random_uuid();

create unique index if not exists orders_tracking_token_idx on public.orders (tracking_token);

-- 2. Order assignment ------------------------------------------------------
alter table public.orders
  add column if not exists assigned_staff_id uuid references public.staff(id),
  add column if not exists assigned_by uuid references public.staff(id),
  add column if not exists assigned_at timestamptz;

create table if not exists public.order_assignment_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  staff_id uuid references public.staff(id),
  assigned_by uuid references public.staff(id),
  action text not null check (action in ('assigned', 'reassigned', 'unassigned')),
  created_at timestamptz not null default now()
);

create index if not exists order_assignment_history_order_idx on public.order_assignment_history (order_id);

alter table public.order_assignment_history enable row level security;

-- Scoped to staff with orders.view (the permission that already gates the
-- Orders nav item / page in the admin UI) or admins. This codebase doesn't
-- have a separate "orders.manage" permission code, so this matches the
-- existing convention rather than inventing a new one.
create policy "Staff with orders.view can view assignment history"
  on public.order_assignment_history for select
  to authenticated
  using (public.staff_has_permission('orders.view'));

create policy "Staff with orders.view can insert assignment history"
  on public.order_assignment_history for insert
  to authenticated
  with check (public.staff_has_permission('orders.view'));

-- 3. Payment settings -------------------------------------------------------
-- One row per payment method so the admin can enable/disable and edit each
-- independently, rather than a single JSON blob that's awkward to update
-- atomically from concurrent admin sessions.
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  method text not null unique check (method in ('mpesa_till', 'mpesa_paybill', 'mpesa_pochi', 'cash', 'card', 'other')),
  label text not null,
  is_enabled boolean not null default false,
  till_number text,
  paybill_number text,
  paybill_account text,
  pochi_number text,
  instructions text,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

create policy "Anyone can view enabled payment methods"
  on public.payment_methods for select
  to anon, authenticated
  using (true);

-- Writes scoped to settings.manage (same permission gating the admin
-- Payment Settings and Site Settings pages) or admins.
create policy "Staff with settings.manage can update payment methods"
  on public.payment_methods for update
  to authenticated
  using (public.staff_has_permission('settings.manage'))
  with check (public.staff_has_permission('settings.manage'));

create policy "Staff with settings.manage can insert payment methods"
  on public.payment_methods for insert
  to authenticated
  with check (public.staff_has_permission('settings.manage'));

insert into public.payment_methods (method, label, sort_order)
values
  ('mpesa_till', 'M-Pesa Till', 1),
  ('mpesa_paybill', 'M-Pesa Paybill', 2),
  ('mpesa_pochi', 'Pochi la Biashara', 3),
  ('cash', 'Cash', 4),
  ('card', 'Card', 5)
on conflict (method) do nothing;

-- 4. Staff activity & cost/profit -------------------------------------------
alter table public.staff
  add column if not exists last_active_at timestamptz;

alter table public.products
  add column if not exists cost_price numeric(10, 2);

-- 5. Payment reference on orders/sales (for receipts) -----------------------
alter table public.orders
  add column if not exists payment_reference text;

alter table public.pos_sales
  add column if not exists payment_reference text;
