"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STATUSES = ["received", "confirmed", "preparing", "ready", "out_for_delivery", "completed", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "paid", "partial", "refunded"];

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  fulfillment_type: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, fulfillment_type, status, payment_status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from("orders").update({ status }).eq("id", id);
    load();
  }

  async function updatePayment(id: string, payment_status: string) {
    await supabase.from("orders").update({ payment_status }).eq("id", id);
    load();
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <h1 className="font-display text-3xl text-brown mb-6">Orders</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")} label="All" />
        {STATUSES.map((s) => (
          <FilterPill key={s} active={filter === s} onClick={() => setFilter(s)} label={s.replace(/_/g, " ")} />
        ))}
      </div>

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-brown/50 text-sm">No orders in this view.</p>
      ) : (
        <div className="bg-white border border-brown/10 rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-cream text-brown/60 text-left">
              <tr>
                <th className="p-3 font-medium">Order #</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-brown/10">
                  <td className="p-3 text-teal font-medium whitespace-nowrap">{o.order_number}</td>
                  <td className="p-3 text-brown">
                    <p>{o.customer_name}</p>
                    <p className="text-xs text-brown/50">{o.customer_phone}</p>
                  </td>
                  <td className="p-3 text-brown capitalize">{o.fulfillment_type}</td>
                  <td className="p-3 text-brown whitespace-nowrap">KSh {Number(o.total).toLocaleString()}</td>
                  <td className="p-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="border border-brown/20 rounded-sm text-xs px-2 py-1 bg-white capitalize"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={o.payment_status}
                      onChange={(e) => updatePayment(o.id, e.target.value)}
                      className="border border-brown/20 rounded-sm text-xs px-2 py-1 bg-white capitalize"
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs capitalize border ${
        active ? "bg-teal text-cream border-teal" : "border-brown/20 text-brown"
      }`}
    >
      {label}
    </button>
  );
}
