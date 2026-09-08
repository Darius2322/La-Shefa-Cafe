"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STATUSES = ["pending", "confirmed", "preparing", "ready", "collected", "delivered", "cancelled", "completed"];

type CakeRequest = {
  id: string;
  request_number: string;
  customer_name: string;
  customer_phone: string;
  cake_type: string;
  size: string | null;
  flavor: string | null;
  quantity: number;
  collection_date: string | null;
  status: string;
};

export default function AdminCakesPage() {
  const [requests, setRequests] = useState<CakeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("cake_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setRequests((data as CakeRequest[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from("cake_requests").update({ status }).eq("id", id);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-brown mb-6">Cake Requests</h1>
      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-brown/50 text-sm">No cake requests yet.</p>
      ) : (
        <div className="bg-white border border-brown/10 rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-cream text-brown/60 text-left">
              <tr>
                <th className="p-3 font-medium">Request #</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Cake</th>
                <th className="p-3 font-medium">Collection</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-brown/10">
                  <td className="p-3 text-teal font-medium whitespace-nowrap">{r.request_number}</td>
                  <td className="p-3 text-brown">
                    <p>{r.customer_name}</p>
                    <p className="text-xs text-brown/50">{r.customer_phone}</p>
                  </td>
                  <td className="p-3 text-brown">
                    <p>{r.cake_type} · ×{r.quantity}</p>
                    <p className="text-xs text-brown/50">{[r.size, r.flavor].filter(Boolean).join(" · ")}</p>
                  </td>
                  <td className="p-3 text-brown whitespace-nowrap">{r.collection_date ?? "-"}</td>
                  <td className="p-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className="border border-brown/20 rounded-sm text-xs px-2 py-1 bg-white capitalize"
                    >
                      {STATUSES.map((s) => (
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
