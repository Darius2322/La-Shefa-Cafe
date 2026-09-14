import { supabase } from "@/lib/supabase";
import { ReviewsSection } from "@/components/ReviewsSection";

// Server-rendered with ISR for fast first paint across visitors; the client
// ReviewsSection component prepends a just-submitted review locally so its
// author sees it appear instantly without waiting for the cache to roll over.
export const revalidate = 60;
export const metadata = { title: "Reviews — La Shefa Cafe" };

export default async function ReviewsPage() {
  const { data } = await supabase
    .from("reviews")
    .select("id, customer_name, rating, review_text, created_at")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  return <ReviewsSection initialReviews={data ?? []} />;
}
