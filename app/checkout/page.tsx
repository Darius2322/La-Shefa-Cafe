"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { supabase } from "@/lib/supabase";

export default function CheckoutPage() {
  const { lines, subtotal, updateQuantity, removeItem, clear } = useCart();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [scheduledFor, setScheduledFor] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = lines.length > 0 && name.trim() && phone.trim() && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      // Upsert customer by phone so repeat visits don't duplicate records.
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", phone.trim())
        .maybeSingle();

      let customerId = existingCustomer?.id as string | undefined;
      if (!customerId) {
        const { data: newCustomer, error: custErr } = await supabase
          .from("customers")
          .insert({ full_name: name.trim(), phone: phone.trim(), email: email.trim() || null })
          .select("id")
          .single();
        if (custErr) throw custErr;
        customerId = newCustomer.id;
      }

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          fulfillment_type: fulfillment,
          scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
          subtotal,
          total: subtotal,
          special_instructions: instructions.trim() || null
        })
        .select("id, order_number")
        .single();
      if (orderErr) throw orderErr;

      const { error: itemsErr } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          product_id: l.product_id,
          product_name: l.product_name,
          unit_price: l.unit_price,
          quantity: l.quantity,
          line_total: l.unit_price * l.quantity
        }))
      );
      if (itemsErr) throw itemsErr;

      clear();
      router.push(
        `/confirmation/${order.order_number}?phone=${encodeURIComponent(phone.trim())}`
      );
    } catch (err: any) {
      setError("Something went wrong placing your order. Please try again.");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-lsc py-14">
      <h1 className="font-display text-4xl text-brown mb-10">Checkout</h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <fieldset className="space-y-4">
            <legend className="font-display text-xl text-brown mb-2">Your details</legend>
            <Field label="Full name" required>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Phone number" required hint="Used to verify your order when tracking it">
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                className="input"
              />
            </Field>
            <Field label="Email (optional)">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="input"
              />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-display text-xl text-brown mb-2">Fulfillment</legend>
            <div className="flex gap-3">
              {(["pickup", "delivery"] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setFulfillment(type)}
                  className={`px-4 py-2 rounded-sm text-sm font-medium border capitalize ${
                    fulfillment === type
                      ? "bg-teal text-cream border-teal"
                      : "border-brown/20 text-brown"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <Field label="Preferred date &amp; time (optional)">
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Special instructions (optional)">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="input"
              />
            </Field>
          </fieldset>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={!canSubmit} className="btn-primary disabled:opacity-50">
            {submitting ? "Placing order…" : "Place Order"}
          </button>
        </form>

        <aside className="divider pt-6 lg:border-t-0 lg:pt-0 lg:pl-8 lg:border-l">
          <h2 className="font-display text-xl text-brown mb-4">Order summary</h2>
          {lines.length === 0 ? (
            <div>
              <p className="text-brown/60 text-sm mb-4">Your cart is empty.</p>
              <Link href="/menu" className="text-teal font-medium hover:underline">
                Browse the menu
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {lines.map((l) => (
                <div key={l.product_id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-brown">{l.product_name}</p>
                    <p className="text-xs text-brown/60">
                      KSh {l.unit_price.toLocaleString()} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={l.quantity}
                      onChange={(e) => updateQuantity(l.product_id, Number(e.target.value))}
                      className="w-14 border border-brown/20 rounded-sm text-center text-sm py-1"
                      aria-label={`Quantity for ${l.product_name}`}
                    />
                    <button
                      onClick={() => removeItem(l.product_id)}
                      aria-label={`Remove ${l.product_name}`}
                      className="text-brown/40 hover:text-brown"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <div className="divider pt-4 flex justify-between font-semibold text-brown">
                <span>Total</span>
                <span>KSh {subtotal.toLocaleString()}</span>
              </div>
            </div>
          )}
        </aside>
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid rgba(65,29,13,0.2);
          border-radius: 4px;
          padding: 0.6rem 0.8rem;
          background: white;
          color: #2C1409;
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-brown mb-1">
        {label} {required && <span className="text-caramel">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-brown/50 mt-1">{hint}</span>}
    </label>
  );
}
