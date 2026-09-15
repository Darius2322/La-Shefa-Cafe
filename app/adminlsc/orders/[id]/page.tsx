"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  MapPin,
  MessageCircle,
  CalendarClock,
  ShoppingBag,
  User,
  Truck,
  Store
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SubTabs } from "@/components/SubTabs";
import { QrCode } from "@/components/QrCode";
import { waLink } from "@/lib/whatsapp";
import { ORDER_STATUSES as STATUSES, PAYMENT_STATUSES, STATUS_COLORS, PAYMENT_COLORS } from "@/lib/orderStatus";

type OrderItem = { id: string; product_name: string; quantity: number; unit_price: number; line_total: number };
type HistoryRow = { status: string; changed_at: string; changed_by: string | null };

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/shefastaff") ? "/shefastaff" : "/adminlsc";
  const id = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [staffNames, setStaffNames] = useState<Record<string, string>>({});
  const [staffList, setStaffList] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: o }, { data: itemRows }, { data: historyRows }, { data: staffRows }] = await Promise.all([
      supabase.from("orders").select("*").eq("id", id).maybeSingle(),
      supabase.from("order_items").select("id, product_name, quantity, unit_price, line_total").eq("order_id", id),
      supabase.from("order_status_history").select("status, changed_at, changed_by").eq("order_id", id).order("changed_at", { ascending: true }),
      supabase.from("staff").select("id, auth_user_id, full_name")
    ]);

    if (!o) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setOrder(o);
    setItems((itemRows as OrderItem[]) ?? []);
    setHistory((historyRows as HistoryRow[]) ?? []);
    setStaffNames(Object.fromEntries((staffRows ?? []).map((s: any) => [s.auth_user_id, s.full_name])));
    setStaffList((staffRows ?? []).map((s: any) => ({ id: s.id, full_name: s.full_name })));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status: string) {
    await supabase.from("orders").update({ status }).eq("id", id);
    load();
  }

  async function updatePayment(payment_status: string) {
    await supabase.from("orders").update({ payment_status }).eq("id", id);
    setOrder((prev: any) => ({ ...prev, payment_status }));
  }

  async function assignOrder(staffId: string | null) {
    setAssigning(true);
    const previous = order?.assigned_staff_id ?? null;
    const { data: auth } = await supabase.auth.getUser();
    const { data: me } = await supabase.from("staff").select("id").eq("auth_user_id", auth?.user?.id).maybeSingle();

    const { error } = await supabase
      .from("orders")
      .update({
        assigned_staff_id: staffId,
        assigned_by: me?.id ?? null,
        assigned_at: staffId ? new Date().toISOString() : null
      })
      .eq("id", id);

    if (!error) {
      setOrder((prev: any) => ({ ...prev, assigned_staff_id: staffId }));
      await supabase.from("order_assignment_history").insert({
        order_id: id,
        staff_id: staffId,
        assigned_by: me?.id ?? null,
        action: staffId ? (previous ? "reassigned" : "assigned") : "unassigned"
      });
    }
    setAssigning(false);
  }

  if (loading) return <p className="text-brown/50 text-sm">Loading…</p>;
  if (notFound || !order) {
    return (
      <div>
        <Link href={`${basePath}/orders`} className="inline-flex items-center gap-1.5 text-sm text-brown/60 hover:text-brown mb-4">
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Orders
        </Link>
        <p className="text-brown/50 text-sm">Order not found.</p>
      </div>
    );
  }

  const mapsUrl =
    order.delivery_lat != null && order.delivery_lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`
      : order.delivery_address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`
      : null;
  const trackingUrl = order.tracking_token && typeof window !== "undefined" ? `${window.location.origin}/track/${order.tracking_token}` : null;
  const lastHandler = history.slice(-1)[0]?.changed_by;
  const subtotal = items.reduce((s, it) => s + Number(it.line_total), 0);

  return (
    <div>
      <Link href={`${basePath}/orders`} className="inline-flex items-center gap-1.5 text-sm text-brown/60 hover:text-brown mb-4">
        <ArrowLeft size={15} strokeWidth={2} />
        Back to Orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-brown/50">Order</p>
          <h1 className="font-display text-display-md text-teal">{order.order_number}</h1>
          <p className="text-sm text-brown/60 mt-1">{order.customer_name} · {order.customer_phone}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value)}
            className={`rounded-full text-xs px-3 py-1.5 capitalize border font-medium ${STATUS_COLORS[order.status] ?? "bg-brown/5 text-brown border-brown/20"}`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select
            value={order.payment_status}
            onChange={(e) => updatePayment(e.target.value)}
            className={`rounded-full text-xs px-3 py-1.5 capitalize border font-medium ${PAYMENT_COLORS[order.payment_status] ?? "bg-brown/5 text-brown border-brown/20"}`}
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary CTAs — always visible, not buried in a tab */}
      <div className="flex flex-wrap gap-3 mb-8">
        <a
          href={waLink(order.customer_phone, `Hi ${order.customer_name}, this is La Shefa Cafe. Your order number is ${order.order_number}. Let us know if you need anything!`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary !py-2 !px-4 text-sm"
        >
          <MessageCircle size={15} strokeWidth={1.75} />
          Message on WhatsApp
        </a>
        <a
          href={`/adminlsc/orders/receipt/${order.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline !text-brown !border-brown/30 !py-2 !px-4 text-sm"
        >
          <Printer size={15} strokeWidth={1.75} />
          Print Receipt
        </a>
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-outline !text-brown !border-brown/30 !py-2 !px-4 text-sm">
            <MapPin size={15} strokeWidth={1.75} />
            Open in Maps
          </a>
        )}
      </div>

      <SubTabs
        tabs={[
          {
            label: "Order",
            content: (
              <div className="grid lg:grid-cols-[1fr_320px] gap-6">
                <div className="bg-white border border-brown/10 rounded-sm p-5">
                  <p className="text-xs font-semibold text-brown/60 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                    <ShoppingBag size={14} strokeWidth={1.75} />
                    Items Ordered
                  </p>
                  {items.length === 0 ? (
                    <p className="text-sm text-brown/40">No items recorded for this order.</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between text-sm border-b border-brown/5 pb-2">
                          <span className="text-brown">{it.quantity} × {it.product_name}</span>
                          <span className="text-brown/70">KSh {Number(it.line_total).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-brown/70 pt-2">
                    <span>Subtotal</span>
                    <span>KSh {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-brown text-base pt-1">
                    <span>Total</span>
                    <span>KSh {Number(order.total).toLocaleString()}</span>
                  </div>
                  {order.special_instructions && (
                    <div className="mt-4 pt-4 border-t border-brown/10">
                      <p className="text-xs font-semibold text-brown/60 mb-1 uppercase tracking-wide">Special Instructions</p>
                      <p className="text-sm text-brown">{order.special_instructions}</p>
                    </div>
                  )}
                </div>

                {trackingUrl && (
                  <div className="bg-white border border-brown/10 rounded-sm p-5 flex flex-col items-center text-center">
                    <QrCode value={trackingUrl} size={120} />
                    <p className="text-xs text-brown/60 mt-3 mb-1">Customer tracking link</p>
                    <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="text-teal text-xs font-medium hover:underline">
                      Open tracking page
                    </a>
                  </div>
                )}
              </div>
            )
          },
          {
            label: "Customer & Delivery",
            content: (
              <div className="grid sm:grid-cols-2 gap-6 max-w-3xl">
                <div className="bg-white border border-brown/10 rounded-sm p-5">
                  <p className="text-xs font-semibold text-brown/60 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                    <User size={14} strokeWidth={1.75} />
                    Customer
                  </p>
                  <p className="text-sm text-brown mb-1">{order.customer_name}</p>
                  <p className="text-sm text-brown/70">{order.customer_phone}</p>
                </div>

                <div className="bg-white border border-brown/10 rounded-sm p-5">
                  <p className="text-xs font-semibold text-brown/60 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                    {order.fulfillment_type === "delivery" ? <Truck size={14} strokeWidth={1.75} /> : <Store size={14} strokeWidth={1.75} />}
                    {order.fulfillment_type === "delivery" ? "Delivery" : "Pickup"}
                  </p>
                  {order.fulfillment_type === "delivery" ? (
                    <>
                      <p className="text-sm text-brown mb-2">{order.delivery_address || "No address provided"}</p>
                      {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-teal text-xs font-medium hover:underline inline-flex items-center gap-1">
                          <MapPin size={13} strokeWidth={1.75} />
                          Open in Google Maps
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-brown/70">Customer will collect from the café.</p>
                  )}
                </div>

                <div className="bg-white border border-brown/10 rounded-sm p-5">
                  <p className="text-xs font-semibold text-brown/60 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                    <CalendarClock size={14} strokeWidth={1.75} />
                    Timing
                  </p>
                  <p className="text-sm text-brown mb-1">Placed {formatDateTime(order.created_at)}</p>
                  {order.scheduled_for && <p className="text-sm text-brown">Requested for {formatDateTime(order.scheduled_for)}</p>}
                </div>

                <div className="bg-white border border-brown/10 rounded-sm p-5">
                  <p className="text-xs font-semibold text-brown/60 mb-3 uppercase tracking-wide">Assigned Staff</p>
                  <select
                    value={order.assigned_staff_id ?? ""}
                    disabled={assigning}
                    onChange={(e) => assignOrder(e.target.value || null)}
                    className="w-full border border-brown/20 rounded-sm text-sm px-3 py-2 bg-white disabled:opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )
          },
          {
            label: "Timeline",
            content: (
              <div className="bg-white border border-brown/10 rounded-sm p-5 max-w-xl">
                {history.length === 0 ? (
                  <p className="text-sm text-brown/40">No history recorded.</p>
                ) : (
                  <ol className="space-y-4">
                    {history.map((h, i) => (
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
                {lastHandler && staffNames[lastHandler] && (
                  <p className="text-xs text-brown/50 mt-4 pt-4 border-t border-brown/10">Last handled by {staffNames[lastHandler]}</p>
                )}
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
