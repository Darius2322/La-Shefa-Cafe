"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CAKE_STATUSES, CAKE_STATUS_COLORS } from "@/lib/cakeStatus";

type CakeRequest = {
  id: string;
  request_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  cake_type: string;
  size: string | null;
  flavor: string | null;
  design_theme: string | null;
  message_on_cake: string | null;
  quantity: number;
  collection_date: string | null;
  preferred_time: string | null;
  special_instructions: string | null;
  reference_image_url: string | null;
  status: string;
};

export function CakeRequestsPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/shefastaff") ? "/shefastaff" : "/adminlsc";
  const [requests, setRequests] = useState<CakeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  async function updateStatus(id: string, status: string, e: React.MouseEvent) {
    e.stopPropagation();
    await supabase.from("cake_requests").update({ status }).eq("id", id);
    load();
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? requests.filter((r) => [r.request_number, r.customer_name, r.customer_phone, r.cake_type].some((f) => f.toLowerCase().includes(q)))
    : requests;

  return (
    <div>

      <div className="relative w-full sm:w-64 mb-6">
        <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search request #, name, phone, type"
          className="border border-brown/20 rounded-sm pl-9 pr-3 py-2 text-sm bg-white w-full focus:border-teal transition-colors"
        />
      </div>

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-brown/50 text-sm">No cake requests in this view.</p>
      ) : (
        <div className="bg-white border border-brown/10 rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
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
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-brown/10 cursor-pointer hover:bg-cream/40 transition-colors"
                  onClick={() => router.push(`${basePath}/cakes/${r.id}`)}
                >
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
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      className={`rounded-full text-xs px-2.5 py-1 capitalize border font-medium ${CAKE_STATUS_COLORS[r.status] ?? "bg-brown/5 text-brown border-brown/20"}`}
                    >
                      {CAKE_STATUSES.map((s) => (
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
