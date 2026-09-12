"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { DatePicker, TimePicker } from "@/components/DateTimePicker";

type Step = "when" | "details";

export function BookingForm() {
  const [step, setStep] = useState<Step>("when");
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

  const canContinue = form.booking_date && form.booking_time && form.party_size > 0;
  const canSubmit = form.customer_name.trim() && form.customer_phone.trim() && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
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
      <p className="text-brown/70 mb-8">Reserve your table and we'll confirm shortly.</p>

      <div className="flex items-center gap-3 mb-10 text-sm">
        <StepPill active={step === "when"} done={step === "details"} label="1. Date & Party" />
        <span className="h-px w-8 bg-brown/20" />
        <StepPill active={step === "details"} done={false} label="2. Your details" />
      </div>

      {step === "when" ? (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <DatePicker
              label="Date *"
              value={form.booking_date}
              onChange={(v) => update("booking_date", v)}
              minDate={new Date()}
            />
            <TimePicker
              label="Time *"
              value={form.booking_time}
              onChange={(v) => update("booking_time", v)}
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-brown mb-2">Party size</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => update("party_size", Math.max(1, form.party_size - 1))}
                className="w-10 h-10 rounded-sm border border-brown/20 text-brown text-lg"
              >
                −
              </button>
              <span className="font-display text-2xl text-brown w-10 text-center">{form.party_size}</span>
              <button
                type="button"
                onClick={() => update("party_size", form.party_size + 1)}
                className="w-10 h-10 rounded-sm border border-brown/20 text-brown text-lg"
              >
                +
              </button>
            </div>
          </div>

          <Field label="Notes (optional)">
            <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} className="input" />
          </Field>

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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="divider pt-4 mb-2 flex justify-between text-sm text-brown/70">
            <span>{form.booking_date} · {form.booking_time}</span>
            <span>{form.party_size} guest{form.party_size === 1 ? "" : "s"}</span>
          </div>

          <Field label="Full name" required>
            <input required value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} className="input" />
          </Field>
          <Field label="Phone number" required>
            <input required type="tel" value={form.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} className="input" />
          </Field>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex gap-4">
            <button type="button" onClick={() => setStep("when")} className="btn-outline !text-brown !border-brown/30">
              Back
            </button>
            <button type="submit" disabled={!canSubmit} className="btn-primary disabled:opacity-50">
              {submitting ? "Booking…" : "Confirm Booking"}
            </button>
          </div>
        </form>
      )}

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span
      className={`px-3 py-1 rounded-full font-medium ${
        active ? "bg-teal text-cream" : done ? "bg-caramel/30 text-brown" : "bg-brown/10 text-brown/50"
      }`}
    >
      {label}
    </span>
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
