import { getFeatureFlags } from "@/lib/settings";
import { BookingForm } from "@/components/BookingForm";

export const revalidate = 30;
export const metadata = { title: "Book a Table — La Shefa Cafe" };

export default async function BookingPage() {
  const flags = await getFeatureFlags();

  if (!flags.booking_enabled) {
    return (
      <div className="container-lsc py-16 max-w-lg text-center">
        <h1 className="font-display text-4xl text-brown mb-4">Booking Unavailable</h1>
        <p className="text-brown/70">
          Online table booking isn't available right now. Please check back soon, or
          contact us directly to arrange your visit.
        </p>
      </div>
    );
  }

  return <BookingForm />;
}
