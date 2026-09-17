"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  ShoppingBag,
  MapPin,
  Home,
  UtensilsCrossed,
  CakeSlice,
  CalendarCheck,
  Tag,
  Star,
  HelpCircle,
  Info,
  Phone,
  Share2,
  Check
} from "lucide-react";
import { useCart } from "./CartProvider";

const BASE_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/cakes", label: "Cakes", icon: CakeSlice },
  { href: "/booking", label: "Booking", icon: CalendarCheck, requiresFlag: "booking" as const },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Phone }
];

// Still real pages, still linked from the Footer and from within the site
// (e.g. checkout confirmation links to reviews/offers) — just not
// competing for space in the top bar, which was wrapping to two lines on
// desktop with every link in it.
const MOBILE_ONLY_LINKS = [
  { href: "/offers", label: "Offers", icon: Tag },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/faq", label: "FAQ", icon: HelpCircle }
];

export function Navbar({ bookingEnabled = true }: { bookingEnabled?: boolean }) {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);
  const [shared, setShared] = useState(false);

  const LINKS = BASE_LINKS.filter(
    (l) => l.requiresFlag !== "booking" || bookingEnabled
  );

  async function handleShare() {
    const shareData = {
      title: "La Shefa Cafe",
      text: "Eat quality, stay healthy — check out La Shefa Cafe!",
      url: typeof window !== "undefined" ? window.location.origin : ""
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    }
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-brown/10">
        <div className="container-lsc flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-3" aria-label="La Shefa Cafe home">
            <Image src="/logo.jpg" alt="La Shefa Cafe" width={44} height={44} className="rounded-sm" />
            <span className="hidden sm:block">
              <span className="block font-display text-lg text-teal leading-tight">La Shefa Cafe</span>
              <span className="block text-[11px] text-brown/50 italic leading-tight">Eat quality, stay healthy</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 font-body text-[15px] text-brown">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center gap-1.5 hover:text-teal transition-colors">
                <l.icon size={14} strokeWidth={1.75} className="text-brown/40" />
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/track"
              className="hidden sm:inline-flex items-center gap-1.5 font-body text-sm text-brown hover:text-teal transition-colors"
            >
              <MapPin size={15} strokeWidth={2} />
              Track Order
            </Link>
            <Link href="/menu" className="hidden sm:inline-block btn-caramel !py-2 !px-4">
              Order Now
            </Link>
            <Link href="/checkout" className="relative btn-primary !py-2 !px-4" aria-label="View cart">
              <ShoppingBag size={16} strokeWidth={2} />
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full bg-caramel text-brown text-[11px] font-semibold leading-none">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-sm bg-teal text-cream flex-shrink-0"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen mobile menu overlay — rendered as a SIBLING of <header>, not nested inside
          it, because <header> has backdrop-blur which makes it a containing block for
          position:fixed descendants, breaking "fixed inset-0" so it only covered the header's
          own small bounding box instead of the full viewport. */}
      {open && (
        <div className="fixed inset-0 z-50 bg-teal flex flex-col md:hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cream/15">
            <div className="flex items-center gap-3">
              <Image src="/logo.jpg" alt="La Shefa Cafe" width={36} height={36} className="rounded-sm" />
              <span className="font-display text-lg text-cream">La Shefa Cafe</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="text-cream p-1"
            >
              <X size={24} strokeWidth={1.75} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 text-cream font-display text-xl py-3 border-b border-cream/10"
              >
                <l.icon size={17} strokeWidth={1.75} className="text-caramel flex-shrink-0" />
                {l.label}
              </Link>
            ))}
            {MOBILE_ONLY_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 text-cream font-display text-xl py-3 border-b border-cream/10"
              >
                <l.icon size={17} strokeWidth={1.75} className="text-caramel flex-shrink-0" />
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => {
                handleShare();
              }}
              className="flex items-center gap-3 text-cream font-display text-xl py-3 border-b border-cream/10 text-left"
            >
              <Share2 size={17} strokeWidth={1.75} className="text-caramel flex-shrink-0" />
              {shared ? "Link copied!" : "Share the Joy"}
            </button>
            <Link
              href="/track"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-cream font-display text-xl py-3 border-b border-cream/10"
            >
              <MapPin size={17} strokeWidth={2} className="text-caramel" />
              Track Order
            </Link>
          </nav>

          <div className="p-5 border-t border-cream/15">
            <Link
              href="/menu"
              onClick={() => setOpen(false)}
              className="btn-caramel w-full justify-center !py-3"
            >
              Order Now
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
