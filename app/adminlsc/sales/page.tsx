"use client";

import { useEffect, useState, Fragment } from "react";
import { supabase } from "@/lib/supabase";

type SaleRow = {
  id: string;
  number: string;
  source: "pos" | "online";
  date: string;
  total: number;
  paymentMethod: string | null;
  paymentStatus: string | null;
  customerOrCashier: string | null;
  items: { name: string; quantity: number; unit_price: number }[];
};

const RANGES = ["today", "week", "month", "all"] as const;
type Range = (typeof RANGES)[number];

function rangeStart(range: Range): Date | null {
  const now = new Date();
  if (range === "today") {
    now.setHours(0, 0, 0, 0);
    return now;
  }
  if (range === "week") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }
  if (range === "month") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    return d;
  }
  return null;
}

export default function AdminSalesPage() {
  const [range, setRange] = useState<Range>("today");
  const [source, setSource] = useState<"all" | "pos" | "online">("all");
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const since = rangeStart(range);
      const sinceIso = since ? since.toISOString() : "1970-01-01T00:00:00Z";

      const [{ data: posSales }, { data: onlineOrders }, { data: staffRows }] = await Promise.all([
        supabase
          .from("pos_sales")
          .select("id, sale_number, created_at, total, payment_method, status")
          .eq("status", "completed")
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id, order_number, created_at, total, payment_status, customer_name, status")
          .neq("status", "cancelled")
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false }),
        supabase.from("staff").select("id, full_name")
      ]);

      const staffMap = Object.fromEntries((staffRows ?? []).map((s: any) => [s.id, s.full_name]));

      const posRows: SaleRow[] = (posSales ?? []).map((s: any) => ({
        id: `pos-${s.id}`,
        number: s.sale_number,
        source: "pos" as const,
        date: s.created_at,
        total: Number(s.total),
        paymentMethod: s.payment_method,
        paymentStatus: "paid",
        customerOrCashier: null,
        items: []
      }));

      const onlineRows: SaleRow[] = (onlineOrders ?? []).map((o: any) => ({
        id: `order-${o.id}`,
        number: o.order_number,
        source: "online" as const,
        date: o.created_at,
        total: Number(o.total),
        paymentMethod: null,
        paymentStatus: o.payment_status,
        customerOrCashier: o.customer_name,
        items: []
      }));

      const combined = [...posRows, ...onlineRows].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setRows(combined);
      setLoading(false);
    }
    load();
  }, [range]);

  async function loadDetail(row: SaleRow) {
    if (row.items.length > 0) return;
    const rawId = row.id.replace(/^(pos|order)-/, "");
    if (row.source === "pos") {
      const { data } = await supabase
        .from("pos_sale_items")
        .select("product_name, quantity, unit_price")
        .eq("sale_id", rawId);
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, items: (data ?? []).map((it: any) => ({ name: it.product_name, quantity: it.quantity, unit_price: Number(it.unit_price) })) } : r))
      );
    } else {
      const { data } = await supabase
        .from("order_items")
        .select("product_name, quantity, unit_price")
        .eq("order_id", rawId);
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, items: (data ?? []).map((it: any) => ({ name: it.product_name, quantity: it.quantity, unit_price: Number(it.unit_price) })) } : r))
      );
    }
  }

  function toggleExpand(row: SaleRow) {
    const next = expandedId === row.id ? null : row.id;
    setExpandedId(next);
    if (next) loadDetail(row);
  }

  const filtered = source === "all" ? rows : rows.filter((r) => r.source === source);
  const paidRows = filtered.filter((r) => r.source === "pos" || r.paymentStatus === "paid");
  const totalRevenue = paidRows.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <h1 className="font-display text-3xl text-brown mb-2">Sales</h1>
      <p className="text-sm text-brown/50 mb-6">All completed POS sales and paid online orders, from the database.</p>

      <div className="space-y-3 mb-4">
        <div>
          <span className="block text-xs font-semibold text-brown/50 uppercase tracking-wide mb-1.5">Period</span>
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-full text-xs capitalize border transition-colors ${
                  range === r ? "bg-teal text-cream border-teal" : "border-brown/20 text-brown hover:border-teal"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="block text-xs font-semibold text-brown/50 uppercase tracking-wide mb-1.5">Source</span>
          <div className="flex flex-wrap gap-2">
            {(["all", "pos", "online"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-3 py-1.5 text-xs capitalize border-2 rounded-sm font-medium transition-colors ${
                  source === s ? "bg-brown text-cream border-brown" : "border-brown/25 text-brown hover:border-brown/50"
                }`}
              >
                {s === "pos" ? "POS" : s === "all" ? "All Sources" : "Online"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-brown/10 rounded-sm p-4 mb-6 flex justify-between items-center">
        <span className="text-sm text-brown/60">{filtered.length} record{filtered.length === 1 ? "" : "s"} · {paidRows.length} paid</span>
        <div className="text-right">
          <span className="font-display text-xl text-brown">KSh {totalRevenue.toLocaleString()}</span>
          <span className="block text-xs text-brown/40">confirmed revenue (paid only)</span>
        </div>
      </div>

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-brown/50 text-sm">No sales in this view.</p>
      ) : (
        <div className="bg-white border border-brown/10 rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-cream text-brown/60 text-left">
              <tr>
                <th className="p-3 font-medium">Number</th>
                <th className="p-3 font-medium">Source</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Payment</th>
                <th className="p-3 font-medium text-right">Total</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <Fragment key={r.id}>
                  <tr className="border-t border-brown/10">
                    <td className="p-3 text-teal font-medium whitespace-nowrap">{r.number}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.source === "pos" ? "bg-caramel/20 text-brown" : "bg-teal/10 text-teal"}`}>
                        {r.source === "pos" ? "POS" : "Online"}
                      </span>
                    </td>
                    <td className="p-3 text-brown/70 whitespace-nowrap">{new Date(r.date).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" })}</td>
                    <td className="p-3 text-brown">{r.customerOrCashier || "—"}</td>
                    <td className="p-3">
                      {r.paymentMethod ? (
                        <span className="text-brown/70 capitalize text-xs">{r.paymentMethod}</span>
                      ) : (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            r.paymentStatus === "paid"
                              ? "bg-teal/10 text-teal"
                              : r.paymentStatus === "partial"
                              ? "bg-caramel/20 text-brown"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {r.paymentStatus || "—"}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right text-brown whitespace-nowrap">KSh {r.total.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => toggleExpand(r)} className="text-brown/60 hover:underline text-xs">
                        {expandedId === r.id ? "Hide" : "Details"}
                      </button>
                    </td>
                  </tr>
                  {expandedId === r.id && (
                    <tr className="bg-cream/50 border-t border-brown/5">
                      <td colSpan={7} className="p-4">
                        {r.items.length === 0 ? (
                          <p className="text-xs text-brown/40">Loading items…</p>
                        ) : (
                          <ul className="text-xs text-brown/70 space-y-1">
                            {r.items.map((it, i) => (
                              <li key={i} className="flex justify-between max-w-sm">
                                <span>{it.quantity} × {it.name}</span>
                                <span>KSh {(it.quantity * it.unit_price).toLocaleString()}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
