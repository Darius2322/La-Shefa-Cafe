import { Phone, MessageCircle, Mail, MapPin, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { OrderCta } from "@/components/OrderCta";
import { getShopLocation, mapsUrlFromLocation } from "@/lib/settings";

export const revalidate = 60;
export const metadata = { title: "Contact — La Shefa Cafe" };

export default async function ContactPage() {
  const [{ data }, location] = await Promise.all([
    supabase.from("site_settings").select("*").eq("key", "contact").maybeSingle(),
    getShopLocation()
  ]);

  const contact = data?.value ?? null;
  const hasContactInfo = contact && Object.values(contact).some((v) => typeof v === "string" && v.trim());
  const mapsUrl = mapsUrlFromLocation(location, contact?.address ?? null);

  return (
    <div>
      <div className="relative bg-teal text-cream overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #F8F4EE 1px, transparent 0)",
            backgroundSize: "28px 28px"
          }}
          aria-hidden
        />
        <div className="container-lsc py-14 sm:py-20 relative">
          <p className="font-body text-caramel text-xs sm:text-sm tracking-[0.15em] uppercase mb-3">Get in touch</p>
          <h1 className="font-display text-display-lg text-cream">Contact Us</h1>
        </div>
      </div>

      <div className="container-lsc py-12 sm:py-16 max-w-2xl">
      {!hasContactInfo ? (
        <div className="border border-dashed border-brown/25 rounded-sm p-10 text-center">
          <p className="font-display text-xl text-brown mb-2">Contact details coming soon</p>
          <p className="text-brown/60 text-sm">
            This section will populate once contact information is added in the admin dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-8">
          <div className="col-span-2 sm:col-span-1 space-y-3 text-brown/80 text-sm sm:text-base">
            {contact.phone && (
              <p className="flex items-center gap-2">
                <Phone size={16} strokeWidth={1.75} className="text-caramel flex-shrink-0" />
                {contact.phone}
              </p>
            )}
            {contact.whatsapp && (
              <p className="flex items-center gap-2">
                <MessageCircle size={16} strokeWidth={1.75} className="text-caramel flex-shrink-0" />
                {contact.whatsapp}
              </p>
            )}
            {contact.email && (
              <p className="flex items-center gap-2">
                <Mail size={16} strokeWidth={1.75} className="text-caramel flex-shrink-0" />
                {contact.email}
              </p>
            )}
            {contact.address && (
              <p className="flex items-center gap-2">
                <MapPin size={16} strokeWidth={1.75} className="text-caramel flex-shrink-0" />
                {contact.address}
              </p>
            )}
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-teal font-medium hover:underline text-sm">
                View on Google Maps →
              </a>
            )}
          </div>
          {contact.hours && (
            <div className="col-span-2 sm:col-span-1">
              <h2 className="font-display text-lg sm:text-xl text-brown mb-3 flex items-center gap-2">
                <Clock size={17} strokeWidth={1.75} className="text-caramel" />
                Opening Hours
              </h2>
              <p className="text-brown/80 text-sm whitespace-pre-line">{contact.hours}</p>
            </div>
          )}
        </div>
      )}
      <OrderCta />
      </div>
    </div>
  );
}
