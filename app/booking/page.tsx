"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BookingPage() {
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    party_size: 2,
    booking_date: "",
    booking_time: "",
    notes: ""
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
      .from("bookings")
      .insert(form)
      .select("booking_number")
      .single();
    setSubmitting(false);
    if (err) {
      setError("We couldn't submit your booking. Please try again.");
      return;
    }
    setConfirmation(data.booking_number);
  }

  if (confirmation) {
    return (
      <div className="container-lsc py-16 max-w-xl">
        <p className="text-caramel font-medium mb-2">Booking received</p>
        <h1 className="font-display text-4xl text-brown mb-6">See you soon!</h1>
        <div className="border border-brown/15 rounded-sm p-6">
          <p className="text-sm text-brown/60 mb-1">Booking number</p>
          <p className="font-display text-2xl text-teal">{confirmation}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-lsc py-14 max-w-lg">
      <h1 className="font-display text-4xl text-brown mb-3">Book a Table</h1>
      <p className="text-brown/70 mb-10">Reserve your table and we'll confirm shortly.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" required>
          <input required value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} className="input" />
        </Field>
        <Field label="Phone number" required>
          <input required type="tel" value={form.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} className="input" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Date" required>
            <input required type="date" value={form.booking_date} onChange={(e) => update("booking_date", e.target.value)} className="input" />
          </Field>
          <Field label="Time" required>
            <input required type="time" value={form.booking_time} onChange={(e) => update("booking_time", e.target.value)} className="input" />
          </Field>
        </div>
        <Field label="Party size">
          <input type="number" min={1} value={form.party_size} onChange={(e) => update("party_size", Number(e.target.value))} className="input" />
        </Field>
        <Field label="Notes (optional)">
          <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} className="input" />
        </Field>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
          {submitting ? "Booking…" : "Book Now"}
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
