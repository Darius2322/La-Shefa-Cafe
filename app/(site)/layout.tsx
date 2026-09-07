import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";
import { getFeatureFlags, getSocialLinks } from "@/lib/settings";

export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [flags, social] = await Promise.all([getFeatureFlags(), getSocialLinks()]);

  return (
    <CartProvider>
      <Navbar bookingEnabled={flags.booking_enabled} />
      <main>{children}</main>
      <Footer bookingEnabled={flags.booking_enabled} socialLinks={social} />
    </CartProvider>
  );
}
