import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ReviewForm } from "@/components/ReviewForm";

// Server-rendered with ISR: the review list is now fetched once per 60s
// window and served from cache to every visitor, instead of every visitor
// triggering their own client-side round trip to Supabase (the previous
// "use client" version). Only the submission form still runs on the client.
export const revalidate = 60;
export const metadata = { title: "Reviews — La Shefa Cafe" };

export default async function ReviewsPage() {
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  const reviews = data ?? [];

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
            {reviews.map((r: any) => (
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
        <ReviewForm />
      </div>
    </div>
  );
}
