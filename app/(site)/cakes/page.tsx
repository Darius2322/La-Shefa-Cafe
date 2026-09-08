"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const CAKE_TYPES = ["Birthday", "Wedding", "Anniversary", "Graduation", "Custom"];

export default function CakesPage() {
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    cake_type: CAKE_TYPES[0],
    size: "",
    flavor: "",
    design_theme: "",
    message_on_cake: "",
    quantity: 1,
    collection_date: "",
    preferred_time: "",
    special_instructions: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("cake_requests")
      .insert({
        ...form,
        customer_email: form.customer_email || null,
        collection_date: form.collection_date || null
      })
      .select("request_number")
      .single();
    setSubmitting(false);
    if (err) {
      setError("We couldn't submit your request. Please try again.");
      return;
    }
    setConfirmation(data.request_number);
  }

  if (confirmation) {
    return (
      <div className="container-lsc py-16 max-w-xl">
        <p className="text-caramel font-medium mb-2">Request received</p>
        <h1 className="font-display text-4xl text-brown mb-6">We've got your cake request!</h1>
        <div className="border border-brown/15 rounded-sm p-6 mb-6">
          <p className="text-sm text-brown/60 mb-1">Request number</p>
          <p className="font-display text-2xl text-teal">{confirmation}</p>
        </div>
        <p className="text-brown/70 text-sm">
          We'll confirm details and pricing with you by phone. Keep your request number for reference.
        </p>
      </div>
    );
  }

  return (
    <div className="container-lsc py-14 max-w-2xl">
      <h1 className="font-display text-4xl text-brown mb-3">Request a Cake</h1>
      <p className="text-brown/70 mb-10">
        Tell us what you're celebrating and we'll get back to you to confirm the details.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        {CAKE_TYPES.map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => update("cake_type", t)}
            className={`text-left px-4 py-4 rounded-sm border-2 transition-colors ${
              form.cake_type === t
                ? "border-teal bg-teal/5"
                : "border-brown/15 hover:border-brown/30"
            }`}
          >
            <p className="font-display text-lg text-brown">{t}</p>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" required>
            <input required value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} className="input" />
          </Field>
          <Field label="Phone number" required>
            <input required type="tel" value={form.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} className="input" />
          </Field>
        </div>
        <Field label="Email (optional)">
          <input type="email" value={form.customer_email} onChange={(e) => update("customer_email", e.target.value)} className="input" />
        </Field>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Size">
            <input placeholder="e.g. 2kg, serves 20" value={form.size} onChange={(e) => update("size", e.target.value)} className="input" />
          </Field>
          <Field label="Flavor">
            <input placeholder="e.g. Vanilla, Chocolate" value={form.flavor} onChange={(e) => update("flavor", e.target.value)} className="input" />
          </Field>
          <Field label="Quantity">
            <input type="number" min={1} value={form.quantity} onChange={(e) => update("quantity", Number(e.target.value))} className="input" />
          </Field>
        </div>

        <Field label="Design / theme">
          <input value={form.design_theme} onChange={(e) => update("design_theme", e.target.value)} className="input" />
        </Field>
        <Field label="Message on cake">
          <input value={form.message_on_cake} onChange={(e) => update("message_on_cake", e.target.value)} className="input" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Collection / delivery date">
            <input type="date" value={form.collection_date} onChange={(e) => update("collection_date", e.target.value)} className="input" />
          </Field>
          <Field label="Preferred time">
            <input value={form.preferred_time} onChange={(e) => update("preferred_time", e.target.value)} className="input" />
          </Field>
        </div>

        <Field label="Special instructions">
          <textarea rows={3} value={form.special_instructions} onChange={(e) => update("special_instructions", e.target.value)} className="input" />
        </Field>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
          {submitting ? "Submitting…" : "Submit Request"}
        </button>
      </form>

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-brown mb-1">
        {label} {required && <span className="text-caramel">*</span>}
      </span>
      {children}
    </label>
  );
}
