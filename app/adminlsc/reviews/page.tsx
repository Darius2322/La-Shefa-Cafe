"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string | null;
  contact: string | null;
  is_approved: boolean;
  created_at: string;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved">("pending");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setReviews((data as Review[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setApproved(id: string, is_approved: boolean) {
    await supabase.from("reviews").update({ is_approved }).eq("id", id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    load();
  }

  const filtered = reviews.filter((r) => (filter === "pending" ? !r.is_approved : r.is_approved));

  return (
    <div>
      <h1 className="font-display text-3xl text-brown mb-6">Reviews</h1>

      <div className="flex gap-2 mb-6">
        <FilterPill active={filter === "pending"} onClick={() => setFilter("pending")} label={`Pending (${reviews.filter((r) => !r.is_approved).length})`} />
        <FilterPill active={filter === "approved"} onClick={() => setFilter("approved")} label="Approved" />
      </div>

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-brown/50 text-sm">Nothing here.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white border border-brown/10 rounded-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-caramel mb-1">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                  {r.review_text && <p className="text-brown/80 text-sm mb-2">{r.review_text}</p>}
                  <p className="text-brown font-medium text-sm">{r.customer_name}</p>
                  {r.contact && <p className="text-xs text-brown/50">{r.contact}</p>}
                </div>
                <div className="flex flex-col gap-2 text-sm whitespace-nowrap">
                  {!r.is_approved ? (
                    <button onClick={() => setApproved(r.id, true)} className="text-teal hover:underline">Approve</button>
                  ) : (
                    <button onClick={() => setApproved(r.id, false)} className="text-brown/60 hover:underline">Unapprove</button>
                  )}
                  <button onClick={() => remove(r.id)} className="text-red-700 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border ${
        active ? "bg-teal text-cream border-teal" : "border-brown/20 text-brown"
      }`}
    >
      {label}
    </button>
  );
}
