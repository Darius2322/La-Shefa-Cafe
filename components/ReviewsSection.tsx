"use client";

import { useState } from "react";
import { Star, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string | null;
  created_at: string;
};

/**
 * Reviews are auto-approved on submit (is_approved: true) so they're visible
 * to everyone right away — admin can hide an inappropriate one afterward
 * from /adminlsc/reviews rather than pre-approving every review.
 *
 * `initialReviews` comes from the server-rendered, ISR-cached page for fast
 * first paint. On a successful submit we prepend the new review to local
 * state immediately, so the person who just wrote it sees it appear without
 * waiting for the page's cache window to roll over. Other visitors will see
 * it once the ISR cache next revalidates.
 */
export function ReviewsSection({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
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
    const { data, error: err } = await supabase
      .from("reviews")
      .insert({
        customer_name: name.trim(),
        rating,
        review_text: text.trim() || null,
        contact: contact.trim() || null,
        is_approved: true
      })
      .select("id, customer_name, rating, review_text, created_at")
      .single();
    setSubmitting(false);
    if (err || !data) {
      setError("We couldn't submit your review. Please try again.");
      return;
    }
    setReviews((prev) => [data as Review, ...prev]);
    setSubmitted(true);
  }

  return (
    <div className="container-lsc py-10 sm:py-14 grid lg:grid-cols-[1fr_420px] gap-10 lg:gap-14">
      <div>
        <h1 className="font-display text-display-md sm:text-display-lg text-brown mb-8 sm:mb-10">Customer Reviews</h1>
        {reviews.length === 0 ? (
          <div className="border border-dashed border-brown/25 rounded-sm p-10 text-center">
            <p className="font-display text-xl text-brown mb-2">No reviews yet</p>
            <p className="text-brown/60 text-sm">Be the first to share your experience.</p>
          </div>
        ) : (
          <div className="scroll-rail gap-4 -mx-5 px-5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:gap-6">
            {reviews.map((r) => (
              <div key={r.id} className="divider pt-5 flex-shrink-0 w-[78vw] xs:w-72 sm:w-auto">
                <div className="flex gap-0.5 mb-2" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      strokeWidth={1.75}
                      className={i < r.rating ? "text-caramel fill-caramel" : "text-brown/20"}
                    />
                  ))}
                </div>
                {r.review_text && <p className="text-brown/80 text-sm mb-2">{r.review_text}</p>}
                <p className="text-brown font-medium text-sm">{r.customer_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="divider pt-8 lg:border-t-0 lg:pt-0 lg:pl-10 lg:border-l">
        <h2 className="font-display text-xl sm:text-2xl text-brown mb-4">Leave a Review</h2>
        {submitted ? (
          <p className="text-teal text-sm">Thanks! Your review is live on the page now.</p>
        ) : (
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
          </form>
        )}
      </div>

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}
