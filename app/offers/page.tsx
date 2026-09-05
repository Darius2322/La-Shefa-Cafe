import { supabase } from "@/lib/supabase";

export const revalidate = 60;
export const metadata = { title: "Offers — La Shefa Cafe" };

export default async function OffersPage() {
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("offers")
    .select("*")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("created_at", { ascending: false });

  const offers = data ?? [];

  return (
    <div className="container-lsc py-14">
      <h1 className="font-display text-4xl text-brown mb-10">Current Offers</h1>

      {offers.length === 0 ? (
        <div className="border border-dashed border-brown/25 rounded-sm p-10 text-center">
          <p className="font-display text-xl text-brown mb-2">No active offers right now</p>
          <p className="text-brown/60 text-sm">Check back soon for new promotions.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {offers.map((o: any) => (
            <div key={o.id} className="border border-brown/15 rounded-sm p-6">
              <h2 className="font-display text-xl text-brown mb-2">{o.title}</h2>
              {o.description && <p className="text-brown/70 text-sm mb-3">{o.description}</p>}
              {o.discount_text && <p className="text-teal font-semibold mb-1">{o.discount_text}</p>}
              {o.promo_code && (
                <p className="text-xs text-brown/50">
                  Code: <span className="font-mono text-caramel">{o.promo_code}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
