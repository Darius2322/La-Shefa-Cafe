"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SubTabs } from "@/components/SubTabs";
import { CakeRequestsPanel } from "@/components/admin/CakeRequestsPanel";
import { StatusLegend } from "@/components/StatusLegend";
import { ORDER_STATUSES as STATUSES, PAYMENT_STATUSES, STATUS_COLORS, PAYMENT_COLORS } from "@/lib/orderStatus";

// Light full-row tint so the whole order row reads as "received" /
// "preparing" / etc. at a glance, not just the small status pill.
const ROW_TINT: Record<string, string> = {
  received: "bg-blue-50/70 hover:bg-blue-50",
  confirmed: "bg-teal/5 hover:bg-teal/10",
  preparing: "bg-amber-50/70 hover:bg-amber-50",
  ready: "bg-purple-50/70 hover:bg-purple-50",
  out_for_delivery: "bg-cyan-50/70 hover:bg-cyan-50",
  completed: "bg-green-50/50 hover:bg-green-50",
  cancelled: "bg-red-50/50 hover:bg-red-50"
};

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
  assigned_staff_id?: string | null;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<p className="text-brown/50 text-sm">Loading…</p>}>
      <AdminOrdersPageInner />
    </Suspense>
  );
}

function AdminOrdersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "cakes" ? 1 : 0;
  const assignedToMe = searchParams.get("assigned") === "me";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  // Defaults to "received" ("New Orders") rather than "All" — that's the
  // view staff actually need first thing, not a full unfiltered history.
  const [filter, setFilter] = useState<string>("received");
  const [search, setSearch] = useState("");
  const [myStaffId, setMyStaffId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    let myId: string | null = null;
    if (assignedToMe) {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data: me } = await supabase.from("staff").select("id").eq("auth_user_id", auth.user.id).maybeSingle();
        myId = me?.id ?? null;
        setMyStaffId(myId);
      }
    }

    // select("*") so this keeps working whether or not assigned_staff_id
    // exists yet (migrations/002) — filtering by it below is skipped
    // entirely if it's not present rather than erroring the whole list.
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150);

    let rows = (data as any[]) ?? [];
    if (assignedToMe && myId) {
      rows = rows.filter((o) => o.assigned_staff_id === myId);
    }
    setOrders(rows as Order[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedToMe]);

  async function updateStatus(id: string, status: string, e: React.MouseEvent) {
    e.stopPropagation();
    await supabase.from("orders").update({ status }).eq("id", id);
    load();
  }

  async function updatePayment(id: string, payment_status: string, e: React.MouseEvent) {
    e.stopPropagation();
    await supabase.from("orders").update({ payment_status }).eq("id", id);
    load();
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
      <h1 className="font-display text-display-md text-brown mb-6">
        {assignedToMe ? "My Orders" : "Orders"}
      </h1>

      <SubTabs
        initialIndex={initialTab}
        tabs={[
          {
            label: "Orders",
            content: (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                  <div className="flex flex-wrap gap-2">
                    <FilterPill active={filter === "all"} onClick={() => setFilter("all")} label="All" />
                    {STATUSES.map((s) => (
                      <FilterPill
                        key={s}
                        active={filter === s}
                        onClick={() => setFilter(s)}
                        label={s === "received" ? "New Orders" : s.replace(/_/g, " ")}
                      />
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
                <div className="mb-6">
                  <StatusLegend />
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
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((o) => (
                          <tr
                            key={o.id}
                            className={`border-t border-brown/10 cursor-pointer transition-colors ${ROW_TINT[o.status] ?? "hover:bg-cream/40"}`}
                            onClick={() => router.push(`/adminlsc/orders/${o.id}`)}
                          >
                            <td className="p-3 text-teal font-medium whitespace-nowrap">{o.order_number}</td>
                            <td className="p-3 text-brown">
                              <p>{o.customer_name}</p>
                              <p className="text-xs text-brown/50">{o.customer_phone}</p>
                            </td>
                            <td className="p-3 text-brown/70 text-xs whitespace-nowrap">{formatDateTime(o.created_at)}</td>
                            <td className="p-3 text-brown capitalize">{o.fulfillment_type}</td>
                            <td className="p-3 text-brown whitespace-nowrap">KSh {Number(o.total).toLocaleString()}</td>
                            <td className="p-3">
                              <select
                                value={o.status}
                                onChange={(e) => updateStatus(o.id, e.target.value, e as any)}
                                onClick={(e) => e.stopPropagation()}
                                className={`rounded-full text-xs px-2.5 py-1 capitalize border font-medium ${STATUS_COLORS[o.status] ?? "bg-brown/5 text-brown border-brown/20"}`}
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={o.payment_status}
                                onChange={(e) => updatePayment(o.id, e.target.value, e as any)}
                                onClick={(e) => e.stopPropagation()}
                                className={`rounded-full text-xs px-2.5 py-1 capitalize border font-medium ${PAYMENT_COLORS[o.payment_status] ?? "bg-brown/5 text-brown border-brown/20"}`}
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
