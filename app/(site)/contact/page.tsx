import Image from "next/image";
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
      <div className="relative h-48 md:h-64">
        <Image
          src="https://source.unsplash.com/1600x600/?bakery,pastry"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-brown/50 flex items-end">
          <h1 className="container-lsc font-display text-4xl text-cream pb-6">Contact Us</h1>
        </div>
      </div>

      <div className="container-lsc py-16 max-w-2xl">
      {!hasContactInfo ? (
        <div className="border border-dashed border-brown/25 rounded-sm p-10 text-center">
          <p className="font-display text-xl text-brown mb-2">Contact details coming soon</p>
          <p className="text-brown/60 text-sm">
            This section will populate once contact information is added in the admin dashboard.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="space-y-3 text-brown/80">
            {contact.phone && <p>Phone: {contact.phone}</p>}
            {contact.whatsapp && <p>WhatsApp: {contact.whatsapp}</p>}
            {contact.email && <p>Email: {contact.email}</p>}
            {contact.address && <p>Address: {contact.address}</p>}
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-teal font-medium hover:underline">
                View on Google Maps →
              </a>
            )}
          </div>
          {contact.hours && (
            <div>
              <h2 className="font-display text-xl text-brown mb-3">Opening Hours</h2>
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
