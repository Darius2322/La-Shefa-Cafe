import { Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { OrderCta } from "@/components/OrderCta";

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
    <div className="container-lsc py-10 sm:py-14">
      <h1 className="font-display text-display-md sm:text-display-lg text-brown mb-8 sm:mb-10">Current Offers</h1>

      {offers.length === 0 ? (
        <div className="border border-dashed border-brown/25 rounded-sm p-10 text-center">
          <Tag size={28} strokeWidth={1.5} className="mx-auto mb-3 text-brown/30" />
          <p className="font-display text-xl text-brown mb-2">No active offers right now</p>
          <p className="text-brown/60 text-sm">Check back soon for new promotions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-8">
          {offers.map((o: any) => (
            <div key={o.id} className="border border-brown/15 rounded-sm p-4 sm:p-6 card-hover">
              <Tag size={16} strokeWidth={1.75} className="text-caramel mb-2" />
              <h2 className="font-display text-base sm:text-xl text-brown mb-2">{o.title}</h2>
              {o.description && <p className="text-brown/70 text-xs sm:text-sm mb-3">{o.description}</p>}
              {o.discount_text && <p className="text-teal font-semibold mb-1 text-sm">{o.discount_text}</p>}
              {o.promo_code && (
                <p className="text-xs text-brown/50">
                  Code: <span className="font-mono text-caramel">{o.promo_code}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      <OrderCta />
    </div>
  );
}
