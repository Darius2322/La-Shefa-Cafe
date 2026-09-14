"use client";

import { useEffect, useState } from "react";
import { Star, Eye, EyeOff, Trash2, Search } from "lucide-react";
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
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const [search, setSearch] = useState("");

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

  const statusFiltered = reviews.filter((r) =>
    filter === "all" ? true : filter === "visible" ? r.is_approved : !r.is_approved
  );
  const q = search.trim().toLowerCase();
  const filtered = q
    ? statusFiltered.filter((r) => [r.customer_name, r.review_text ?? ""].some((f) => f.toLowerCase().includes(q)))
    : statusFiltered;

  return (
    <div>
      <h1 className="font-display text-display-md text-brown mb-2">Reviews</h1>
      <p className="text-sm text-brown/50 mb-6">
        Reviews go live on the site as soon as customers submit them. Hide any that shouldn't be public.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex gap-2">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")} label={`All (${reviews.length})`} />
          <FilterPill active={filter === "visible"} onClick={() => setFilter("visible")} label={`Visible (${reviews.filter((r) => r.is_approved).length})`} />
          <FilterPill active={filter === "hidden"} onClick={() => setFilter("hidden")} label={`Hidden (${reviews.filter((r) => !r.is_approved).length})`} />
        </div>
        <div className="relative sm:ml-auto w-full sm:w-64">
          <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or text"
            className="border border-brown/20 rounded-sm pl-9 pr-3 py-2 text-sm bg-white w-full focus:border-teal transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-brown/50 text-sm">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className={`bg-white border rounded-sm p-5 ${r.is_approved ? "border-brown/10" : "border-red-200 bg-red-50/30"}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex gap-0.5 mb-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} strokeWidth={1.75} className={i < r.rating ? "text-caramel fill-caramel" : "text-brown/20"} />
                    ))}
                  </div>
                  {r.review_text && <p className="text-brown/80 text-sm mb-2">{r.review_text}</p>}
                  <p className="text-brown font-medium text-sm">{r.customer_name}</p>
                  {r.contact && <p className="text-xs text-brown/50">{r.contact}</p>}
                  {!r.is_approved && <p className="text-xs text-red-700 mt-1">Hidden from the public site</p>}
                </div>
                <div className="flex items-center gap-3 text-sm flex-shrink-0">
                  {r.is_approved ? (
                    <button onClick={() => setApproved(r.id, false)} className="text-brown/60 hover:text-brown inline-flex items-center gap-1.5" title="Hide from site">
                      <EyeOff size={14} strokeWidth={1.75} />
                      Hide
                    </button>
                  ) : (
                    <button onClick={() => setApproved(r.id, true)} className="text-teal hover:underline inline-flex items-center gap-1.5" title="Show on site">
                      <Eye size={14} strokeWidth={1.75} />
                      Show
                    </button>
                  )}
                  <button onClick={() => remove(r.id)} className="text-red-700 hover:underline inline-flex items-center gap-1.5">
                    <Trash2 size={14} strokeWidth={1.75} />
                    Delete
                  </button>
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
      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
        active ? "bg-teal text-cream border-teal" : "border-brown/20 text-brown"
      }`}
    >
      {label}
    </button>
  );
}
