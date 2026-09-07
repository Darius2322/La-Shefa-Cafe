"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const STEPS = ["received", "confirmed", "preparing", "ready", "out_for_delivery", "completed"];

type TrackResult = {
  order_number: string;
  customer_name: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  items: { name: string; quantity: number; unit_price: number }[];
};

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
        <div className="border border-dashed border-brown/25 rounded-sm p-8 text-center">
          <p className="font-display text-xl text-brown mb-2">No matching order</p>
          <p className="text-brown/60 text-sm">
            Double-check the order number and phone number, then try again.
          </p>
        </div>
      )}

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
