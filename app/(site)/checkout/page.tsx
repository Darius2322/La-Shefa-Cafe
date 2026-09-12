"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { supabase } from "@/lib/supabase";
import { getShopLocation, mapsUrlFromLocation } from "@/lib/settings";
import { DatePicker, TimePicker } from "@/components/DateTimePicker";

type Step = "order" | "details" | "confirmation";
type Contact = { phone?: string; whatsapp?: string; address?: string };

export default function CheckoutPage() {
  const { lines, subtotal, updateQuantity, removeItem, clear } = useCart();

  const [step, setStep] = useState<Step>("order");
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [contact, setContact] = useState<Contact>({});

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<{ order_number: string; phone: string; total: number; itemLines: typeof lines } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pickupMapsUrl, setPickupMapsUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: contactData }, loc] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", "contact").maybeSingle(),
        getShopLocation()
      ]);
      const contactValue = contactData?.value ?? {};
      setContact(contactValue);
      setPickupMapsUrl(mapsUrlFromLocation(loc, contactValue.address ?? null));
    }
    load();
  }, []);

  const canContinue =
    lines.length > 0 && (fulfillment === "pickup" || deliveryAddress.trim().length > 0);
  const canSubmit = name.trim() && phone.trim() && !submitting;

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationError("Location isn't supported on this device/browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDeliveryCoords(coords);

        // Reverse-geocode via OpenStreetMap's free Nominatim service to suggest an
        // address — the customer can still edit it, this is just a head start.
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}`,
            { headers: { Accept: "application/json" } }
          );
          const json = await res.json();
          if (json?.display_name) {
            setDeliveryAddress((prev) => prev.trim() ? prev : json.display_name);
          }
        } catch {
          // Silent fallback — coordinates are already captured, address is optional here.
        }

        setLocating(false);
      },
      () => {
        setLocationError("Couldn't get your location. Please check location permissions, or enter your address manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
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
          scheduled_for: scheduledDate && scheduledTime ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : null,
          subtotal,
          total: subtotal,
          special_instructions: instructions.trim() || null,
          delivery_address: fulfillment === "delivery" ? deliveryAddress.trim() || null : null,
          delivery_lat: fulfillment === "delivery" ? deliveryCoords?.lat ?? null : null,
          delivery_lng: fulfillment === "delivery" ? deliveryCoords?.lng ?? null : null
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
      setPlacedOrder({ order_number: order.order_number, phone: phone.trim(), total: subtotal, itemLines: lines });
      setStep("confirmation");
    } catch (err: any) {
      setError("Something went wrong placing your order. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-lsc py-14 max-w-3xl">
      <h1 className="font-display text-4xl text-brown mb-2">Checkout</h1>

      <div className="flex items-center gap-3 mb-10 text-sm">
        <StepPill active={step === "order"} done={step === "details" || step === "confirmation"} label="1. Order" />
        <span className="h-px w-8 bg-brown/20" />
        <StepPill active={step === "details"} done={step === "confirmation"} label="2. Your details" />
        <span className="h-px w-8 bg-brown/20" />
        <StepPill active={step === "confirmation"} done={false} label="3. Confirmation" />
      </div>

      {step === "confirmation" && placedOrder ? (
        <div className="max-w-xl">
          <p className="text-caramel font-medium mb-2">Order placed</p>
          <h2 className="font-display text-3xl text-brown mb-8">Thank you!</h2>

          <div className="border border-brown/15 rounded-sm p-6 mb-8">
            <p className="text-sm text-brown/60 mb-1">Your order number</p>
            <div className="flex items-center justify-between gap-4">
              <p className="font-display text-2xl text-teal">{placedOrder.order_number}</p>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(placedOrder.order_number);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="btn-primary !py-2 !px-4 text-sm"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="divider pt-4 mb-6">
            <p className="text-sm text-brown/60 mb-2">Items</p>
            <ul className="space-y-1 mb-4">
              {placedOrder.itemLines.map((l) => (
                <li key={l.product_id} className="flex justify-between text-sm text-brown">
                  <span>{l.quantity} × {l.product_name}</span>
                  <span>KSh {(l.quantity * l.unit_price).toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-semibold text-brown">
              <span>Total</span>
              <span>KSh {placedOrder.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href={`/track?order=${placedOrder.order_number}&phone=${encodeURIComponent(placedOrder.phone)}`}
              className="btn-primary"
            >
              Track this order
            </Link>
            <Link href="/menu" className="btn-outline !text-brown !border-brown/30">
              Order more
            </Link>
          </div>
        </div>
      ) : lines.length === 0 && step === "order" ? (
        <div className="border border-dashed border-brown/25 rounded-sm p-10 text-center">
          <p className="font-display text-xl text-brown mb-2">Your cart is empty</p>
          <Link href="/menu" className="text-teal font-medium hover:underline">
            Browse the menu
          </Link>
        </div>
      ) : step === "order" ? (
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-xl text-brown mb-4">Items</h2>
            <div className="space-y-4">
              {lines.map((l) => (
                <div key={l.product_id} className="flex items-center justify-between gap-3 divider pt-4">
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
          </section>

          <section>
            <h2 className="font-display text-xl text-brown mb-4">How would you like it?</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFulfillment("pickup")}
                className={`text-left px-5 py-4 rounded-sm border-2 transition-colors ${
                  fulfillment === "pickup"
                    ? "border-teal bg-teal/5"
                    : "border-brown/15 hover:border-brown/30"
                }`}
              >
                <p className="font-display text-lg text-brown">Pickup</p>
                <p className="text-sm text-brown/60 mt-1">Collect your order at the café</p>
              </button>
              <button
                type="button"
                onClick={() => setFulfillment("delivery")}
                className={`text-left px-5 py-4 rounded-sm border-2 transition-colors ${
                  fulfillment === "delivery"
                    ? "border-teal bg-teal/5"
                    : "border-brown/15 hover:border-brown/30"
                }`}
              >
                <p className="font-display text-lg text-brown">Delivery</p>
                <p className="text-sm text-brown/60 mt-1">We'll bring it to you</p>
              </button>
            </div>

            {fulfillment === "pickup" ? (
              <div className="mt-6 bg-teal/5 border border-teal/20 rounded-sm p-5">
                <p className="font-medium text-brown mb-2">Pickup from La Shefa Cafe</p>
                {contact.address ? (
                  <p className="text-sm text-brown/70 mb-1">{contact.address}</p>
                ) : (
                  <p className="text-sm text-brown/50 mb-1">Address not set up yet — contact us for directions.</p>
                )}
                {contact.phone && <p className="text-sm text-brown/70 mb-3">Call: {contact.phone}</p>}
                {pickupMapsUrl && (
                  <a href={pickupMapsUrl} target="_blank" rel="noopener noreferrer" className="text-teal text-sm font-medium hover:underline">
                    View on Google Maps →
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="block text-sm font-medium text-brown mb-1">Delivery address *</span>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={2}
                    className="input"
                    placeholder="Street, building, landmark, estate…"
                  />
                </label>

                <div>
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locating}
                    className="btn-outline !text-brown !border-brown/30 text-sm disabled:opacity-50"
                  >
                    {locating ? "Getting your location…" : "📍 Use my current location"}
                  </button>
                  {deliveryCoords && (
                    <p className="text-xs text-teal mt-2">
                      Location captured ({deliveryCoords.lat.toFixed(5)}, {deliveryCoords.lng.toFixed(5)}). Please still
                      describe the address above so our rider can find you.
                    </p>
                  )}
                  {locationError && <p className="text-xs text-red-700 mt-2">{locationError}</p>}
                </div>
              </div>
            )}

            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <DatePicker
                label="Preferred date (optional)"
                value={scheduledDate}
                onChange={setScheduledDate}
                minDate={new Date()}
              />
              <TimePicker
                label="Preferred time (optional)"
                value={scheduledTime}
                onChange={setScheduledTime}
              />
            </div>
          </section>

          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep("details")}
            className="btn-primary disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-lg">
          <div className="divider pt-4 mb-6 flex justify-between text-sm text-brown/70">
            <span className="capitalize">{fulfillment} · {lines.length} item{lines.length === 1 ? "" : "s"}</span>
            <span className="font-semibold text-brown">KSh {subtotal.toLocaleString()}</span>
          </div>

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

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep("order")}
              className="btn-outline !text-brown !border-brown/30"
            >
              Back
            </button>
            <button type="submit" disabled={!canSubmit} className="btn-primary disabled:opacity-50">
              {submitting ? "Placing order…" : "Place Order"}
            </button>
          </div>
        </form>
      )}

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

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span
      className={`px-3 py-1 rounded-full font-medium ${
        active
          ? "bg-teal text-cream"
          : done
          ? "bg-caramel/30 text-brown"
          : "bg-brown/10 text-brown/50"
      }`}
    >
      {label}
    </span>
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
