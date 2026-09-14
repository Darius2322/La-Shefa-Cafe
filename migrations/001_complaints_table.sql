-- Complaints table for the admin "Complaints" menu.
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query)
-- before the /adminlsc/complaints page will work. Nothing else in the app
-- depends on this migration, so it's safe to run any time.

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

-- Mirrors the pattern used elsewhere in this project: authenticated staff/admin
-- can read and manage complaints. Adjust the role check below if your staff
-- table's permission model differs from the "staff.manage"-style checks used
-- for other admin tables — this policy intentionally errs permissive for any
-- authenticated staff member since complaints are an internal tool only.
create policy "Staff can view complaints"
  on public.complaints for select
  to authenticated
  using (true);

create policy "Staff can insert complaints"
  on public.complaints for insert
  to authenticated
  with check (true);

create policy "Staff can update complaints"
  on public.complaints for update
  to authenticated
  using (true);
