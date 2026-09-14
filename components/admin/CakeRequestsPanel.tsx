"use client";

import { useEffect, useState, Fragment } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

const STATUSES = ["pending", "confirmed", "preparing", "ready", "collected", "delivered", "cancelled", "completed"];

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
  const [requests, setRequests] = useState<CakeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

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
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <Fragment key={r.id}>
                  <tr
                    className="border-t border-brown/10 cursor-pointer hover:bg-cream/40 transition-colors"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
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
                        onChange={(e) => updateStatus(r.id, e.target.value)}
                        className="border border-brown/20 rounded-sm text-xs px-2 py-1 bg-white capitalize"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-right text-brown/40">
                      {expandedId === r.id ? <ChevronUp size={16} strokeWidth={1.75} /> : <ChevronDown size={16} strokeWidth={1.75} />}
                    </td>
                  </tr>
                  {expandedId === r.id && (
                    <tr className="bg-cream/50 border-t border-brown/5">
                      <td colSpan={6} className="p-5" onClick={(e) => e.stopPropagation()}>
                        <div className="grid md:grid-cols-[1fr_180px] gap-6">
                          <div className="grid sm:grid-cols-2 gap-3 text-xs text-brown/70">
                            {r.customer_email && <p>Email: <span className="text-brown">{r.customer_email}</span></p>}
                            {r.design_theme && <p>Design/theme: <span className="text-brown">{r.design_theme}</span></p>}
                            {r.message_on_cake && <p>Message on cake: <span className="text-brown">{r.message_on_cake}</span></p>}
                            {r.preferred_time && <p>Preferred time: <span className="text-brown">{r.preferred_time}</span></p>}
                            {r.special_instructions && <p className="sm:col-span-2">Instructions: <span className="text-brown">{r.special_instructions}</span></p>}
                          </div>
                          {r.reference_image_url && (
                            <div>
                              <p className="text-xs font-semibold text-brown/60 mb-2 uppercase tracking-wide">Reference Image</p>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={r.reference_image_url}
                                alt="Cake reference"
                                onClick={() => setZoomImage(r.reference_image_url)}
                                className="w-full rounded-sm border border-brown/10 cursor-zoom-in"
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {zoomImage && (
        <div
          className="fixed inset-0 bg-brown/80 flex items-center justify-center z-50 p-4"
          onClick={() => setZoomImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomImage} alt="Cake reference full size" className="max-w-full max-h-full rounded-sm" />
        </div>
      )}
    </div>
  );
}
