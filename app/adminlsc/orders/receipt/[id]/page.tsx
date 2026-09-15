"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Receipt, type ReceiptData, type ReceiptWidth } from "@/components/Receipt";

export default function OrderReceiptPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ReceiptData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [width, setWidth] = useState<ReceiptWidth>("80mm");

  useEffect(() => {
    async function load() {
      const [{ data: order }, { data: items }, { data: contact }, { data: receiptSettings }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id).maybeSingle(),
        supabase.from("order_items").select("product_name, quantity, unit_price, line_total").eq("order_id", id),
        supabase.from("site_settings").select("value").eq("key", "contact").maybeSingle(),
        supabase.from("site_settings").select("value").eq("key", "receipt_settings").maybeSingle()
      ]);

      if (!order) {
        setNotFound(true);
        return;
      }

      setWidth(receiptSettings?.value?.width ?? "80mm");

      setData({
        title: "La Shefa Cafe",
        documentLabel: "Order Receipt",
        number: order.order_number,
        date: new Date(order.created_at).toLocaleString("en-GB", {
          day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"
        }),
        customerName: order.customer_name,
        customerPhone: order.customer_phone ?? null,
        items: (items ?? []).map((it: any) => ({
          name: it.product_name,
          quantity: it.quantity,
          unit_price: Number(it.unit_price),
          line_total: Number(it.line_total)
        })),
        subtotal: Number(order.subtotal),
        total: Number(order.total),
        paymentMethod: null,
        paymentReference: order.payment_reference ?? null,
        contactPhone: contact?.value?.phone || null,
        contactAddress: contact?.value?.address || null,
        website: typeof window !== "undefined" ? window.location.host : null,
        trackingUrl: order.tracking_token && typeof window !== "undefined"
          ? `${window.location.origin}/track/${order.tracking_token}`
          : null
      });
    }
    load();
  }, [id]);

  if (notFound) {
    return <p className="p-10 text-center text-brown/60">Order not found, or you don't have permission to view it.</p>;
  }
  if (!data) {
    return <p className="p-10 text-center text-brown/60">Loading receipt…</p>;
  }
  return <Receipt data={data} width={width} />;
}
