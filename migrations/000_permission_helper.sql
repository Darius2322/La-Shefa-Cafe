-- Run this FIRST, before migrations 001 and 002 — they both depend on the
-- staff_has_permission() function created here to properly scope access
-- instead of allowing any authenticated staff member to read/write
-- admin-only tables via a direct Supabase REST call.

create or replace function public.staff_has_permission(perm_code text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.staff s
    where s.auth_user_id = auth.uid()
      and s.is_active
      and s.role = 'admin'
  )
  or exists (
    select 1
    from public.staff s
    join public.staff_permissions sp on sp.staff_id = s.id
    join public.permissions p on p.id = sp.permission_id
    where s.auth_user_id = auth.uid()
      and s.is_active
      and p.code = perm_code
  );
$$;

-- Any authenticated staff member can check permissions (needed for RLS
-- policies elsewhere to call this function at all); it only ever returns
-- a boolean, never row data, so this is safe to leave open.
grant execute on function public.staff_has_permission(text) to authenticated;
