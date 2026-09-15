import { PackageSearch, CheckCircle2, Clock3, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const metadata = { title: "Track Order — La Shefa Cafe" };

const STATUS_STEPS = ["received", "confirmed", "preparing", "ready", "out_for_delivery", "completed"];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Public route reached only via a QR code / link containing a random,
// unguessable tracking_token — deliberately doesn't require the customer's
// phone number like the manual /track lookup does, and deliberately doesn't
// expose the order's database id, full delivery address, or any other
// customer's data. Only what's needed to answer "where's my order".
export default async function SecureOrderTrackingPage({ params }: { params: { token: string } }) {
  let order: any = null;
  try {
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, status, payment_status, fulfillment_type, scheduled_for, total, created_at")
      .eq("tracking_token", params.token)
      .maybeSingle();
    order = data;
  } catch {
    order = null;
  }

  let items: any[] = [];
  if (order) {
    const { data: itemRows } = await supabase
      .from("order_items")
      .select("product_name, quantity")
      .eq("order_id", order.id);
    items = itemRows ?? [];
  }

  if (!order) {
    return (
      <div className="container-lsc py-16 max-w-lg text-center">
        <PackageSearch size={28} strokeWidth={1.5} className="mx-auto mb-4 text-brown/30" />
        <p className="font-display text-xl text-brown mb-2">Order not found</p>
        <p className="text-brown/60 text-sm">This tracking link may have expired or is incorrect.</p>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentIndex = STATUS_STEPS.indexOf(order.status);

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
        <ul className="space-y-1.5 mb-4">
          {items.map((it, i) => (
            <li key={i} className="flex justify-between text-sm text-brown">
              <span>{it.quantity} × {it.product_name}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between font-semibold text-brown pt-3 border-t border-brown/10">
          <span>Total</span>
          <span>KSh {Number(order.total).toLocaleString()}</span>
        </div>
        <p className="text-xs text-brown/50 mt-2 capitalize">Payment: {order.payment_status}</p>
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
      <div className="flex items-center gap-1.5 text-sm text-brown/60 capitalize">
        <MapPin size={13} strokeWidth={1.75} />
        {order.fulfillment_type}
      </div>
    </div>
  );
}
