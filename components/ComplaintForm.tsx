"use client";

import { useState } from "react";
import { Flag, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function ComplaintForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("complaints")
      .insert({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        related_order_number: orderNumber.trim() || null,
        subject: subject.trim(),
        description: description.trim() || null
      })
      .select("complaint_number")
      .single();

    setSubmitting(false);
    if (err || !data) {
      setError(
        "We couldn't submit that just now. Please try again, or reach us directly using the contact details above."
      );
      return;
    }
    setSubmitted(data.complaint_number);
  }

  if (submitted) {
    return (
      <div className="border border-teal/20 bg-teal/5 rounded-sm p-6">
        <CheckCircle2 size={24} strokeWidth={1.5} className="text-teal mb-2" />
        <p className="font-display text-lg text-brown mb-1">We've got it</p>
        <p className="text-sm text-brown/70 mb-2">
          Your complaint has been logged as <span className="font-medium text-teal">{submitted}</span>. We'll follow
          up with you directly.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm text-brown/70 hover:text-brown border border-brown/20 rounded-sm px-4 py-2.5 transition-colors"
      >
        <Flag size={15} strokeWidth={1.75} />
        Have a complaint or issue with an order? Let us know
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-brown/15 rounded-sm p-5 space-y-4 max-w-lg">
      <p className="font-display text-lg text-brown flex items-center gap-2">
        <Flag size={16} strokeWidth={1.75} className="text-caramel" />
        Tell us what happened
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-brown mb-1">Your name *</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-brown mb-1">Phone *</span>
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className="input" />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-medium text-brown mb-1">Order number (optional)</span>
        <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className="input" placeholder="e.g. LSC-20260914-00007" />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-brown mb-1">Subject *</span>
        <input required value={subject} onChange={(e) => setSubject(e.target.value)} className="input" placeholder="Short summary" />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-brown mb-1">Details</span>
        <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
          {submitting ? "Submitting…" : "Submit Complaint"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-brown/60 text-sm">
          Cancel
        </button>
      </div>
      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </form>
  );
}
