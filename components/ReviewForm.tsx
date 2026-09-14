"use client";

import { useState } from "react";
import { Star, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function ReviewForm() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase.from("reviews").insert({
      customer_name: name.trim(),
      rating,
      review_text: text.trim() || null,
      contact: contact.trim() || null,
      is_approved: false
    });
    setSubmitting(false);
    if (err) {
      setError("We couldn't submit your review. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="text-teal text-sm">
        Thanks! Your review has been submitted and will appear once approved.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium text-brown mb-1 flex items-center gap-1.5">
          <UserIcon size={14} strokeWidth={1.75} className="text-caramel" />
          Name *
        </span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
      </label>
      <div>
        <span className="block text-sm font-medium text-brown mb-1">Rating</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              aria-label={`${n} stars`}
              className="p-0.5"
            >
              <Star
                size={22}
                strokeWidth={1.75}
                className={n <= rating ? "text-caramel fill-caramel" : "text-brown/20"}
              />
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="block text-sm font-medium text-brown mb-1">Review</span>
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} className="input" />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-brown mb-1">Email or phone (optional)</span>
        <input value={contact} onChange={(e) => setContact(e.target.value)} className="input" />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </form>
  );
}
