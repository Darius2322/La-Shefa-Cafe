"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const STEPS = ["received", "confirmed", "preparing", "ready", "out_for_delivery", "completed"];

<<<<<<< HEAD
type StatusEntry = { status: string; changed_at: string };
=======
<<<<<<< HEAD
type StatusEntry = { status: string; changed_at: string };
=======
>>>>>>> a3626bea2327b444c966850b0fcc1e2d0793cfb2
>>>>>>> 3e8e4e50a379db1f971ec26ddb68bdad3757d854
type TrackResult = {
  order_number: string;
  customer_name: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
<<<<<<< HEAD
  fulfillment_type: string;
  delivery_address: string | null;
=======
<<<<<<< HEAD
  fulfillment_type: string;
  delivery_address: string | null;
  items: { name: string; quantity: number; unit_price: number }[];
  status_history: StatusEntry[];
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function StepIcon({ step, className }: { step: string; className?: string }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, className };
  switch (step) {
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
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M7 12.5l3.2 3.2L17 9" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="3" /></svg>;
  }
}

=======
>>>>>>> 3e8e4e50a379db1f971ec26ddb68bdad3757d854
  items: { name: string; quantity: number; unit_price: number }[];
  status_history: StatusEntry[];
};

<<<<<<< HEAD
function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function StepIcon({ step, className }: { step: string; className?: string }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, className };
  switch (step) {
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
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M7 12.5l3.2 3.2L17 9" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="3" /></svg>;
  }
}

=======
>>>>>>> a3626bea2327b444c966850b0fcc1e2d0793cfb2
>>>>>>> 3e8e4e50a379db1f971ec26ddb68bdad3757d854
export default function TrackPage() {
  return (
    <Suspense fallback={null}>
      <TrackPageInner />
    </Suspense>
  );
}

function TrackPageInner() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") ?? "");
  const [phone, setPhone] = useState(searchParams.get("phone") ?? "");
  const [result, setResult] = useState<TrackResult | null | "not_found">(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const { data, error } = await supabase.rpc("track_order", {
      p_order_number: orderNumber.trim(),
      p_phone: phone.trim()
    });
    setLoading(false);
    if (error || !data || data.length === 0) {
      setResult("not_found");
      return;
    }
    setResult(data[0]);
  }

  const activeIndex = result && result !== "not_found" ? STEPS.indexOf(result.status) : -1;
  const isCancelled = result && result !== "not_found" && result.status === "cancelled";

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3e8e4e50a379db1f971ec26ddb68bdad3757d854
  function timestampFor(step: string): string | null {
    if (!result || result === "not_found") return null;
    const entry = result.status_history?.find((h) => h.status === step);
    return entry ? entry.changed_at : null;
  }

<<<<<<< HEAD
=======
=======
>>>>>>> a3626bea2327b444c966850b0fcc1e2d0793cfb2
>>>>>>> 3e8e4e50a379db1f971ec26ddb68bdad3757d854
  return (
    <div className="container-lsc py-16 max-w-2xl">
      <h1 className="font-display text-4xl text-brown mb-3">Track Your Order</h1>
      <p className="text-brown/70 mb-8">
        Enter your order number and the phone number used when ordering.
      </p>

      <form onSubmit={handleSubmit} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 mb-10">
        <input
          required
          placeholder="Order number, e.g. LSC-20260903-00482"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="border border-brown/20 rounded-sm px-4 py-2.5 bg-white text-brown text-sm"
        />
        <input
          required
          placeholder="Phone number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border border-brown/20 rounded-sm px-4 py-2.5 bg-white text-brown text-sm"
        />
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? "Checking…" : "Track"}
        </button>
      </form>

      {result === "not_found" && (
<<<<<<< HEAD
        <div className="border border-dashed border-brown/25 rounded-sm p-8 text-center mb-8">
=======
<<<<<<< HEAD
        <div className="border border-dashed border-brown/25 rounded-sm p-8 text-center mb-8">
=======
        <div className="border border-dashed border-brown/25 rounded-sm p-8 text-center">
>>>>>>> a3626bea2327b444c966850b0fcc1e2d0793cfb2
>>>>>>> 3e8e4e50a379db1f971ec26ddb68bdad3757d854
          <p className="font-display text-xl text-brown mb-2">No matching order</p>
          <p className="text-brown/60 text-sm">
            Double-check the order number and phone number, then try again.
          </p>
        </div>
      )}

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3e8e4e50a379db1f971ec26ddb68bdad3757d854
      {result === "not_found" && (
        <div className="border border-brown/10 rounded-sm p-5 bg-cream/50">
          <p className="text-sm font-medium text-brown mb-1">Need help finding your order?</p>
          <p className="text-sm text-brown/70">
            Get in touch and we'll help you locate it — see our <a href="/contact" className="text-teal hover:underline">contact details</a>.
          </p>
        </div>
      )}

<<<<<<< HEAD
=======
=======
>>>>>>> a3626bea2327b444c966850b0fcc1e2d0793cfb2
>>>>>>> 3e8e4e50a379db1f971ec26ddb68bdad3757d854
      {result && result !== "not_found" && (
        <div>
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="text-sm text-brown/60">Order</p>
              <p className="font-display text-2xl text-teal">{result.order_number}</p>
            </div>
            <p className="text-sm text-brown/60">
              Payment: <span className="capitalize text-brown">{result.payment_status}</span>
            </p>
          </div>

          {isCancelled ? (
            <p className="text-red-700 font-medium mb-8">This order was cancelled.</p>
          ) : (
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3e8e4e50a379db1f971ec26ddb68bdad3757d854
            <ol className="space-y-5 mb-10">
              {STEPS.map((step, i) => {
                const done = i <= activeIndex;
                const ts = timestampFor(step);
                return (
                  <li key={step} className="flex items-start gap-4">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <span
                        className={`h-9 w-9 rounded-full flex items-center justify-center ${
                          done ? "bg-teal text-cream" : "bg-brown/10 text-brown/30"
                        }`}
                      >
                        <StepIcon step={step} className="w-[18px] h-[18px]" />
                      </span>
                      {i < STEPS.length - 1 && (
                        <span className={`w-px flex-1 min-h-[16px] mt-1 ${i < activeIndex ? "bg-teal" : "bg-brown/15"}`} />
                      )}
                    </div>
                    <div className="pt-1.5">
                      <p className={`capitalize font-medium ${done ? "text-brown" : "text-brown/40"}`}>
                        {step.replace(/_/g, " ")}
                      </p>
                      {ts && <p className="text-xs text-brown/50 mt-0.5">{formatDateTime(ts)}</p>}
                    </div>
                  </li>
                );
              })}
<<<<<<< HEAD
            </ol>
          )}

          {result.fulfillment_type === "delivery" && result.delivery_address && (
            <div className="divider pt-4 mb-4">
              <p className="text-sm text-brown/60 mb-1">Delivering to</p>
              <p className="text-sm text-brown">{result.delivery_address}</p>
            </div>
          )}

=======
            </ol>
          )}

          {result.fulfillment_type === "delivery" && result.delivery_address && (
            <div className="divider pt-4 mb-4">
              <p className="text-sm text-brown/60 mb-1">Delivering to</p>
              <p className="text-sm text-brown">{result.delivery_address}</p>
            </div>
          )}

=======
            <ol className="flex flex-wrap gap-y-4 mb-10">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        i <= activeIndex ? "bg-teal" : "bg-brown/20"
                      }`}
                    />
                    <span
                      className={`text-xs mt-2 capitalize whitespace-nowrap ${
                        i <= activeIndex ? "text-teal font-medium" : "text-brown/40"
                      }`}
                    >
                      {step.replace(/_/g, " ")}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span
                      className={`h-px w-8 sm:w-12 mx-1 ${
                        i < activeIndex ? "bg-teal" : "bg-brown/20"
                      }`}
                    />
                  )}
                </li>
              ))}
            </ol>
          )}

>>>>>>> a3626bea2327b444c966850b0fcc1e2d0793cfb2
>>>>>>> 3e8e4e50a379db1f971ec26ddb68bdad3757d854
          <div className="divider pt-6">
            <p className="text-sm text-brown/60 mb-2">Items</p>
            <ul className="space-y-1 mb-4">
              {result.items.map((it, i) => (
                <li key={i} className="flex justify-between text-sm text-brown">
                  <span>{it.quantity} × {it.name}</span>
                  <span>KSh {(it.quantity * it.unit_price).toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-semibold text-brown">
              <span>Total</span>
              <span>KSh {Number(result.total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
