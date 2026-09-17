import Link from "next/link";
import { PackageSearch, CheckCircle2, Clock3, MapPin, Search, MessageCircle, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getFormattedPaymentMethods } from "@/lib/paymentMethods";
import { waLink, waShareLink } from "@/lib/whatsapp";

export const metadata = { title: "Track Order — La Shefa Cafe" };

const STATUS_STEPS = ["received", "confirmed", "preparing", "ready", "out_for_delivery", "completed"];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Public route reached only via a QR code / link containing a random,
// unguessable tracking_token. Uses the track_order_by_token RPC (SECURITY
// DEFINER) rather than a direct table read — this project's RLS blocks
// anonymous reads of the orders table directly (by design, since it holds
// customer PII), the same reason the phone-based /track lookup already
// goes through a track_order RPC. A raw .select() here would silently
// return no rows for every token, which is exactly the bug this fixes.
export default async function SecureOrderTrackingPage({ params }: { params: { token: string } }) {
  let order: any = null;
  try {
    const { data } = await supabase.rpc("track_order_by_token", { p_token: params.token });
    order = data && data.length > 0 ? data[0] : null;
  } catch {
    order = null;
  }

  if (!order) {
    return (
      <div className="container-lsc py-16 max-w-lg text-center">
        <PackageSearch size={28} strokeWidth={1.5} className="mx-auto mb-4 text-brown/30" />
        <p className="font-display text-xl text-brown mb-2">Order not found</p>
        <p className="text-brown/60 text-sm mb-6">This tracking link may have expired or is incorrect.</p>
        <Link href="/track" className="btn-primary inline-flex">
          <Search size={16} strokeWidth={2} />
          Track Your Order
        </Link>
      </div>
    );
  }

  const [{ data: contactRow }, paymentInstructions] = await Promise.all([
    supabase.from("site_settings").select("value").eq("key", "contact").maybeSingle(),
    order.payment_status === "unpaid" || order.payment_status === "partial"
      ? getFormattedPaymentMethods()
      : Promise.resolve([])
  ]);
  const contact = contactRow?.value ?? null;

  const items: { product_name: string; quantity: number; unit_price: number }[] = order.items ?? [];
  const isCancelled = order.status === "cancelled";
  const currentIndex = STATUS_STEPS.indexOf(order.status);
  const shareText = `My La Shefa Cafe order ${order.order_number} — status: ${order.status.replace(/_/g, " ")}.`;

  return (
    <div className="container-lsc py-10 sm:py-16 max-w-lg">
      <p className="text-xs text-brown/50 mb-1">Order</p>
      <h1 className="font-display text-display-lg text-teal mb-6">{order.order_number}</h1>

      {isCancelled ? (
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6">
          <p className="text-red-700 font-medium text-sm">This order was cancelled.</p>
        </div>
      ) : (
        <div className="mb-8">
          <ol className="space-y-4">
            {STATUS_STEPS.map((s, i) => {
              const done = i <= currentIndex;
              return (
                <li key={s} className="flex items-center gap-3">
                  <span
                    className={`flex items-center justify-center h-7 w-7 rounded-full flex-shrink-0 ${
                      done ? "bg-teal text-cream" : "bg-brown/10 text-brown/40"
                    }`}
                  >
                    {done ? <CheckCircle2 size={14} strokeWidth={2} /> : <Clock3 size={13} strokeWidth={1.75} />}
                  </span>
                  <span className={`text-sm capitalize ${done ? "text-brown font-medium" : "text-brown/40"}`}>
                    {s.replace(/_/g, " ")}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="border border-brown/15 rounded-sm p-5 mb-6">
        <p className="text-xs font-semibold text-brown/50 uppercase tracking-wide mb-3">Items</p>
        {items.length === 0 ? (
          <p className="text-sm text-brown/40 mb-4">No item details available.</p>
        ) : (
          <ul className="space-y-1.5 mb-4">
            {items.map((it, i) => (
              <li key={i} className="flex justify-between text-sm text-brown">
                <span>{it.quantity} × {it.product_name}</span>
                {it.unit_price != null && <span className="text-brown/60">KSh {(it.unit_price * it.quantity).toLocaleString()}</span>}
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-between font-semibold text-brown pt-3 border-t border-brown/10">
          <span>Total</span>
          <span>KSh {Number(order.total).toLocaleString()}</span>
        </div>
        <p className="text-xs text-brown/50 mt-2 capitalize">Payment: {order.payment_status}</p>

        {paymentInstructions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-brown/10">
            <p className="text-xs font-semibold text-brown/50 uppercase tracking-wide mb-2">Complete Your Payment</p>
            {paymentInstructions.map((m, i) => (
              <p key={i} className="text-xs text-brown/70">
                <span className="font-medium text-brown">{m.label}:</span> {m.detail}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-sm text-brown/60 mb-1">
        <Clock3 size={13} strokeWidth={1.75} />
        Placed {formatDateTime(order.created_at)}
      </div>
      {order.scheduled_for && (
        <div className="flex items-center gap-1.5 text-sm text-brown/60 mb-1">
          <Clock3 size={13} strokeWidth={1.75} />
          Requested for {formatDateTime(order.scheduled_for)}
        </div>
      )}
      <div className="flex items-center gap-1.5 text-sm text-brown/60 capitalize mb-6">
        <MapPin size={13} strokeWidth={1.75} />
        {order.fulfillment_type}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/menu" className="btn-primary">
          <ShoppingBag size={16} strokeWidth={1.75} />
          Order More
        </Link>
        {contact?.whatsapp && (
          <a
            href={waLink(contact.whatsapp, `Hi, I have a question about my order ${order.order_number}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline !text-brown !border-brown/30"
          >
            <MessageCircle size={16} strokeWidth={1.75} />
            Message the Cafe
          </a>
        )}
        <a
          href={waShareLink(shareText)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline !text-brown !border-brown/30"
        >
          <MessageCircle size={16} strokeWidth={1.75} />
          Save to WhatsApp
        </a>
      </div>
    </div>
  );
}
