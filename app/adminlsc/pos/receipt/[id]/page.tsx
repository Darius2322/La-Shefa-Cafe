"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Receipt, type ReceiptData } from "@/components/Receipt";

export default function PosReceiptPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ReceiptData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: sale }, { data: items }, { data: contact }] = await Promise.all([
        supabase.from("pos_sales").select("*").eq("id", id).maybeSingle(),
        supabase.from("pos_sale_items").select("product_name, quantity, unit_price, line_total").eq("sale_id", id),
        supabase.from("site_settings").select("value").eq("key", "contact").maybeSingle()
      ]);

      if (!sale) {
        setNotFound(true);
        return;
      }

      setData({
        title: "La Shefa Cafe",
        documentLabel: "Receipt",
        number: sale.sale_number,
        date: new Date(sale.created_at).toLocaleString("en-GB", {
          day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"
        }),
        items: (items ?? []).map((it: any) => ({
          name: it.product_name,
          quantity: it.quantity,
          unit_price: Number(it.unit_price),
          line_total: Number(it.line_total)
        })),
        subtotal: Number(sale.subtotal),
        discount: Number(sale.discount ?? 0),
        total: Number(sale.total),
        paymentMethod: sale.payment_method,
        amountPaid: sale.amount_paid != null ? Number(sale.amount_paid) : null,
        changeDue: sale.change_due != null ? Number(sale.change_due) : null,
        contactPhone: contact?.value?.phone || null,
        contactAddress: contact?.value?.address || null
      });
    }
    load();
  }, [id]);

  if (notFound) {
    return <p className="p-10 text-center text-brown/60">Sale not found, or you don't have permission to view it.</p>;
  }
  if (!data) {
    return <p className="p-10 text-center text-brown/60">Loading receipt…</p>;
  }
  return <Receipt data={data} autoPrint />;
}
