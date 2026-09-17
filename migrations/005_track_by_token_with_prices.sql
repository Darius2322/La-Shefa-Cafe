-- Run after migrations 000-004. Replaces track_order_by_token from
-- migration 003 with a version that also returns each item's unit price,
-- so the public tracking page can show a proper price breakdown instead of
-- just item names and quantities.

create or replace function public.track_order_by_token(p_token uuid)
returns table (
  order_number text,
  status text,
  payment_status text,
  fulfillment_type text,
  scheduled_for timestamptz,
  total numeric,
  created_at timestamptz,
  items jsonb
)
language sql
security definer
stable
set search_path = public
as $$
  select
    o.order_number,
    o.status,
    o.payment_status,
    o.fulfillment_type,
    o.scheduled_for,
    o.total,
    o.created_at,
    coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'product_name', oi.product_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price
        ))
        from public.order_items oi
        where oi.order_id = o.id
      ),
      '[]'::jsonb
    ) as items
  from public.orders o
  where o.tracking_token = p_token;
$$;

grant execute on function public.track_order_by_token(uuid) to anon, authenticated;
