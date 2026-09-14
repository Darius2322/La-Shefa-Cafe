"use client";

import { useEffect, useState, Fragment, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, Search, MapPin, MessageCircle, ChevronDown, ChevronUp, CalendarClock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SubTabs } from "@/components/SubTabs";
import { CakeRequestsPanel } from "@/components/admin/CakeRequestsPanel";

const STATUSES = ["received", "confirmed", "preparing", "ready", "out_for_delivery", "completed", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "paid", "partial", "refunded"];

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  fulfillment_type: string;
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  scheduled_for: string | null;
  status: string;
  payment_status: string;
  total: number;
  special_instructions: string | null;
  created_at: string;
};

type HistoryRow = { status: string; changed_at: string; changed_by: string | null };

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function waLink(phone: string, text: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function StatusIcon({ status, className }: { status: string; className?: string }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, className };
  switch (status) {
    case "received":
      return <svg {...common}><path d="M6 4h12v16l-3-2-3 2-3-2-3 2z" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /></svg>;
    case "confirmed":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></svg>;
    case "preparing":
      return <svg {...common}><circle cx="12" cy="13" r="7" /><path d="M9 6.5c0-1 .8-1.2.8-2S9 3 9 3M15 6.5c0-1-.8-1.2-.8-2S15 3 15 3" /></svg>;
    case "ready":
      return <svg {...common}><path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z" /><path d="M4 8.5 12 13l8-4.5" /><line x1="12" y1="13" x2="12" y2="20" /></svg>;
    case "out_for_delivery":
      return <svg {...common}><rect x="2.5" y="9" width="12" height="8" rx="1" /><path d="M14.5 12h3.5l3 3v2h-6.5z" /><circle cx="6.5" cy="18.5" r="1.6" /><circle cx="16.5" cy="18.5" r="1.6" /></svg>;
    case "completed":
      return <svg {...common}><circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" opacity="0.15" /><path d="M7 12.5l3.2 3.2L17 9" /></svg>;
    case "cancelled":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="3" /></svg>;
  }
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<p className="text-brown/50 text-sm">Loading…</p>}>
      <AdminOrdersPageInner />
    </Suspense>
  );
}

function AdminOrdersPageInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "cakes" ? 1 : 0;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, HistoryRow[]>>({});
  const [staffNames, setStaffNames] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const [{ data }, { data: staffRows }] = await Promise.all([
      supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone, fulfillment_type, delivery_address, delivery_lat, delivery_lng, scheduled_for, status, payment_status, total, special_instructions, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("staff").select("auth_user_id, full_name")
    ]);
    setOrders((data as Order[]) ?? []);
    setStaffNames(Object.fromEntries((staffRows ?? []).map((s: any) => [s.auth_user_id, s.full_name])));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function loadHistory(orderId: string) {
    const { data } = await supabase
      .from("order_status_history")
      .select("status, changed_at, changed_by")
      .eq("order_id", orderId)
      .order("changed_at", { ascending: true });
    setHistory((prev) => ({ ...prev, [orderId]: (data as HistoryRow[]) ?? [] }));
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("orders").update({ status }).eq("id", id);
    load();
    if (expandedId === id) loadHistory(id);
  }

  async function updatePayment(id: string, payment_status: string) {
    await supabase.from("orders").update({ payment_status }).eq("id", id);
    load();
  }

  function toggleExpand(o: Order) {
    const next = expandedId === o.id ? null : o.id;
    setExpandedId(next);
    if (next) loadHistory(o.id);
  }

  const statusFiltered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const q = search.trim().toLowerCase();
  const filtered = q
    ? statusFiltered.filter((o) =>
        [o.order_number, o.customer_name, o.customer_phone].some((f) => f.toLowerCase().includes(q))
      )
    : statusFiltered;

  return (
    <div>
      <h1 className="font-display text-display-md text-brown mb-6">Orders</h1>

      <SubTabs
        initialIndex={initialTab}
        tabs={[
          {
            label: "Orders",
            content: (
              <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")} label="All" />
          {STATUSES.map((s) => (
            <FilterPill key={s} active={filter === s} onClick={() => setFilter(s)} label={s.replace(/_/g, " ")} />
          ))}
        </div>
        <div className="relative sm:ml-auto w-full sm:w-64 flex-shrink-0">
          <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, name, phone"
            className="border border-brown/20 rounded-sm pl-9 pr-3 py-2 text-sm bg-white w-full focus:border-teal transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-brown/50 text-sm">No orders in this view.</p>
      ) : (
        <div className="bg-white border border-brown/10 rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-cream text-brown/60 text-left">
              <tr>
                <th className="p-3 font-medium">Order #</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Placed</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Payment</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const mapsUrl =
                  o.delivery_lat != null && o.delivery_lng != null
                    ? `https://www.google.com/maps/search/?api=1&query=${o.delivery_lat},${o.delivery_lng}`
                    : o.delivery_address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.delivery_address)}`
                    : null;
                const lastHandler = history[o.id]?.slice(-1)[0]?.changed_by;

                return (
                  <Fragment key={o.id}>
                    <tr
                      className="border-t border-brown/10 cursor-pointer hover:bg-cream/40 transition-colors"
                      onClick={() => toggleExpand(o)}
                    >
                      <td className="p-3 text-teal font-medium whitespace-nowrap">{o.order_number}</td>
                      <td className="p-3 text-brown">
                        <p>{o.customer_name}</p>
                        <p className="text-xs text-brown/50">{o.customer_phone}</p>
                      </td>
                      <td className="p-3 text-brown/70 text-xs whitespace-nowrap">{formatDateTime(o.created_at)}</td>
                      <td className="p-3 text-brown capitalize">{o.fulfillment_type}</td>
                      <td className="p-3 text-brown whitespace-nowrap">KSh {Number(o.total).toLocaleString()}</td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
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
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
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
                      <td className="p-3 text-right text-brown/40">
                        {expandedId === o.id ? <ChevronUp size={16} strokeWidth={1.75} /> : <ChevronDown size={16} strokeWidth={1.75} />}
                      </td>
                    </tr>
                    {expandedId === o.id && (
                      <tr className="bg-cream/50 border-t border-brown/5">
                        <td colSpan={8} className="p-5" onClick={(e) => e.stopPropagation()}>
                          <div className="grid md:grid-cols-3 gap-6">
                            <div>
                              <p className="text-xs font-semibold text-brown/60 mb-3 uppercase tracking-wide">Status History</p>
                              {!history[o.id] ? (
                                <p className="text-xs text-brown/40">Loading…</p>
                              ) : history[o.id].length === 0 ? (
                                <p className="text-xs text-brown/40">No history recorded.</p>
                              ) : (
                                <ol className="space-y-3">
                                  {history[o.id].map((h, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                      <span className="mt-0.5 text-teal flex-shrink-0">
                                        <StatusIcon status={h.status} className="w-4 h-4" />
                                      </span>
                                      <div>
                                        <p className="text-sm text-brown capitalize font-medium">{h.status.replace(/_/g, " ")}</p>
                                        <p className="text-xs text-brown/50">
                                          {formatDateTime(h.changed_at)}
                                          {h.changed_by && staffNames[h.changed_by] && ` · By ${staffNames[h.changed_by]}`}
                                        </p>
                                      </div>
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-brown/60 mb-2 uppercase tracking-wide">Order Timing</p>
                              <p className="text-sm text-brown flex items-center gap-1.5 mb-1">
                                <CalendarClock size={14} strokeWidth={1.75} className="text-caramel flex-shrink-0" />
                                Placed {formatDateTime(o.created_at)}
                              </p>
                              {o.scheduled_for && (
                                <p className="text-sm text-brown flex items-center gap-1.5 mb-1">
                                  <CalendarClock size={14} strokeWidth={1.75} className="text-caramel flex-shrink-0" />
                                  Requested for {formatDateTime(o.scheduled_for)}
                                </p>
                              )}
                              {lastHandler && staffNames[lastHandler] && (
                                <p className="text-xs text-brown/50 mt-2">Last handled by {staffNames[lastHandler]}</p>
                              )}
                              <div className="flex flex-wrap gap-3 mt-3">
                                <a
                                  href={waLink(o.customer_phone, `Hi ${o.customer_name}, this is La Shefa Cafe. Your order number is ${o.order_number}. Let us know if you need anything!`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-teal text-xs font-medium hover:underline inline-flex items-center gap-1"
                                >
                                  <MessageCircle size={13} strokeWidth={1.75} />
                                  Send order # via WhatsApp
                                </a>
                                <a
                                  href={`/adminlsc/orders/receipt/${o.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-teal text-xs font-medium hover:underline inline-flex items-center gap-1"
                                >
                                  <Printer size={13} strokeWidth={1.75} />
                                  Print Receipt
                                </a>
                              </div>
                            </div>

                            {(o.fulfillment_type === "delivery" || o.special_instructions) && (
                              <div>
                                {o.fulfillment_type === "delivery" && (
                                  <div className="mb-4">
                                    <p className="text-xs font-semibold text-brown/60 mb-2 uppercase tracking-wide">Delivery</p>
                                    <p className="text-sm text-brown mb-2">{o.delivery_address || "No address provided"}</p>
                                    {mapsUrl && (
                                      <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-teal text-xs font-medium hover:underline inline-flex items-center gap-1"
                                      >
                                        <MapPin size={13} strokeWidth={1.75} />
                                        Open in Google Maps
                                      </a>
                                    )}
                                  </div>
                                )}
                                {o.special_instructions && (
                                  <div>
                                    <p className="text-xs font-semibold text-brown/60 mb-2 uppercase tracking-wide">Special Instructions</p>
                                    <p className="text-sm text-brown">{o.special_instructions}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
              </>
            )
          },
          {
            label: "Cake Requests",
            content: <CakeRequestsPanel />
          }
        ]}
      />
    </div>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs capitalize border transition-colors ${
        active ? "bg-teal text-cream border-teal" : "border-brown/20 text-brown"
      }`}
    >
      {label}
    </button>
  );
}
