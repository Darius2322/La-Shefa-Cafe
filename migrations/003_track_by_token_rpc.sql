-- Run after migrations/000, 001, 002. Fixes QR/link order tracking, which
-- was silently returning "Order not found" for every token: the tracking
-- page queried the orders table directly with the anon key, and this
-- project's RLS (correctly) blocks anonymous reads of raw order rows —
-- the same reason track_order/track_orders_by_phone exist as RPCs already.
-- This adds the token-based equivalent so /track/[token] can look an order
-- up without needing the customer's phone number.

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
        select jsonb_agg(jsonb_build_object('product_name', oi.product_name, 'quantity', oi.quantity))
        from public.order_items oi
        where oi.order_id = o.id
      ),
      '[]'::jsonb
    ) as items
  from public.orders o
  where o.tracking_token = p_token;
$$;

grant execute on function public.track_order_by_token(uuid) to anon, authenticated;
