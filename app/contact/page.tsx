import { supabase } from "@/lib/supabase";

export const revalidate = 60;
export const metadata = { title: "Contact — La Shefa Cafe" };

export default async function ContactPage() {
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .in("key", ["contact", "opening_hours"]);

  const settingsMap = Object.fromEntries((data ?? []).map((s: any) => [s.key, s.value]));
  const contact = settingsMap.contact ?? null;
  const hours = settingsMap.opening_hours ?? null;

  return (
    <div className="container-lsc py-16 max-w-2xl">
      <h1 className="font-display text-4xl text-brown mb-10">Contact Us</h1>

      {!contact ? (
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
          </div>
          {hours && (
            <div>
              <h2 className="font-display text-xl text-brown mb-3">Opening Hours</h2>
              <ul className="text-brown/80 text-sm space-y-1">
                {Object.entries(hours).map(([day, time]) => (
                  <li key={day} className="flex justify-between max-w-xs">
                    <span className="capitalize">{day}</span>
                    <span>{String(time)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
