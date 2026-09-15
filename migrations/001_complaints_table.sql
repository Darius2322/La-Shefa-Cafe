-- Complaints table for the admin "Complaints" menu.
-- Run migrations/000_permission_helper.sql FIRST, then this file, in the
-- Supabase SQL editor (Project → SQL Editor → New query) before the
-- /adminlsc/complaints page will work.

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  complaint_number text unique not null default (
    'CMP-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 100000)::text, 5, '0')
  ),
  customer_name text not null,
  customer_phone text not null,
  related_order_number text,
  subject text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'dismissed')),
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists complaints_status_idx on public.complaints (status);
create index if not exists complaints_created_at_idx on public.complaints (created_at desc);

alter table public.complaints enable row level security;

-- Scoped to staff with the "reviews.manage" permission (the same permission
-- that gates the Complaints nav item in the admin UI) or admins, via the
-- staff_has_permission() helper from migrations/000. Run 000 before this
-- file, or these policies will fail to create.
create policy "Staff with reviews.manage can view complaints"
  on public.complaints for select
  to authenticated
  using (public.staff_has_permission('reviews.manage'));

create policy "Staff with reviews.manage can insert complaints"
  on public.complaints for insert
  to authenticated
  with check (public.staff_has_permission('reviews.manage'));

create policy "Staff with reviews.manage can update complaints"
  on public.complaints for update
  to authenticated
  using (public.staff_has_permission('reviews.manage'));
