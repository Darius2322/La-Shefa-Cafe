import { supabase } from "@/lib/supabase";

export const revalidate = 60;
export const metadata = { title: "FAQ — La Shefa Cafe" };

export default async function FaqPage() {
  const { data } = await supabase
    .from("faqs")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const faqs = data ?? [];
  const categories = Array.from(new Set(faqs.map((f: any) => f.category || "general")));

  return (
    <div className="container-lsc py-14 max-w-2xl">
      <h1 className="font-display text-4xl text-brown mb-10">Frequently Asked Questions</h1>

      {faqs.length === 0 ? (
        <div className="border border-dashed border-brown/25 rounded-sm p-10 text-center">
          <p className="font-display text-xl text-brown mb-2">No questions published yet</p>
          <p className="text-brown/60 text-sm">Check back soon, or contact us directly.</p>
        </div>
      ) : (
        categories.map((cat) => (
          <div key={cat} className="mb-10">
            <h2 className="font-display text-xl text-teal capitalize mb-4">{cat}</h2>
            <div className="space-y-6">
              {faqs
                .filter((f: any) => (f.category || "general") === cat)
                .map((f: any) => (
                  <div key={f.id} className="divider pt-4">
                    <p className="font-medium text-brown mb-1">{f.question}</p>
                    <p className="text-brown/70 text-sm">{f.answer}</p>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
