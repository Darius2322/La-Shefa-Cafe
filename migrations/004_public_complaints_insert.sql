-- Run after migrations 000-003. Adds public (anon) INSERT access to
-- complaints so customers can actually submit one from the site — the
-- original policy in 001_complaints_table.sql only allowed staff with
-- reviews.manage to insert, which was fine for staff logging a complaint
-- on a customer's behalf, but blocked a customer-facing complaint form.
-- Reading/updating complaints remains staff-only (unchanged from 001).

create policy "Anyone can submit a complaint"
  on public.complaints for insert
  to anon
  with check (true);
