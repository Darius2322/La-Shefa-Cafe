"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type TrackResult = {
  order_number: string;
  customer_name: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  items: { name: string; quantity: number; unit_price: number }[];
};

export default function ConfirmationPage({
  params,
  searchParams
}: {
  params: { number: string };
  searchParams: { phone?: string };
}) {
  const [order, setOrder] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      if (!searchParams.phone) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.rpc("track_order", {
        p_order_number: params.number,
        p_phone: searchParams.phone
      });
      setOrder(data && data.length > 0 ? data[0] : null);
      setLoading(false);
    }
    load();
  }, [params.number, searchParams.phone]);

  const copyNumber = async () => {
    await navigator.clipboard.writeText(params.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="container-lsc py-16 max-w-xl">
      <p className="text-caramel font-medium mb-2">Order placed</p>
      <h1 className="font-display text-4xl text-brown mb-8">Thank you{order ? `, ${order.customer_name}` : ""}!</h1>

      <div className="border border-brown/15 rounded-sm p-6 mb-8">
        <p className="text-sm text-brown/60 mb-1">Your order number</p>
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-2xl text-teal">{params.number}</p>
          <button onClick={copyNumber} className="btn-primary !py-2 !px-4 text-sm">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-brown/60 text-sm">Loading order details…</p>
      ) : order ? (
        <div className="space-y-4">
          <div className="divider pt-4">
            <p className="text-sm text-brown/60 mb-2">Items</p>
            <ul className="space-y-1">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between text-sm text-brown">
                  <span>{it.quantity} × {it.name}</span>
                  <span>KSh {(it.quantity * it.unit_price).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="divider pt-4 flex justify-between font-semibold text-brown">
            <span>Total</span>
            <span>KSh {Number(order.total).toLocaleString()}</span>
          </div>
          <p className="text-sm text-brown/70 capitalize">
            Status: <span className="text-teal font-medium">{order.status.replace(/_/g, " ")}</span>
          </p>
        </div>
      ) : (
        <p className="text-brown/60 text-sm">
          We couldn't load the order details automatically, but your order was placed successfully.
        </p>
      )}

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href={`/track?order=${params.number}${searchParams.phone ? `&phone=${searchParams.phone}` : ""}`}
          className="btn-primary"
        >
          Track this order
        </Link>
        <Link href="/menu" className="btn-outline !text-brown !border-brown/30">
          Order more
        </Link>
      </div>
    </div>
  );
}
