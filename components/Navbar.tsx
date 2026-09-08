"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

const BASE_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/cakes", label: "Cakes" },
  { href: "/booking", label: "Booking", requiresFlag: "booking" as const },
  { href: "/offers", label: "Offers" },
  { href: "/reviews", label: "Reviews" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export function Navbar({ bookingEnabled = true }: { bookingEnabled?: boolean }) {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  const LINKS = BASE_LINKS.filter(
    (l) => l.requiresFlag !== "booking" || bookingEnabled
  );

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-brown/10">
      <div className="container-lsc flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-3" aria-label="La Shefa Cafe home">
          <Image src="/logo.jpg" alt="La Shefa Cafe" width={44} height={44} className="rounded-sm" />
          <span className="font-display text-lg text-teal hidden sm:block">La Shefa Cafe</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 font-body text-[15px] text-brown">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-teal transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/track" className="hidden sm:inline-block font-body text-sm text-brown hover:text-teal">
            Track Order
          </Link>
          <Link href="/menu" className="hidden sm:inline-block btn-caramel !py-2 !px-4 text-sm">
            Order Now
          </Link>
          <Link href="/checkout" className="relative btn-primary !py-2 !px-4 text-sm" aria-label="View cart">
            Cart
            {itemCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-caramel text-brown text-xs font-semibold">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            className="md:hidden text-brown p-1"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Full-screen mobile menu overlay */}
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
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-cream font-display text-2xl py-3 border-b border-cream/10"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/track"
              onClick={() => setOpen(false)}
              className="text-cream font-display text-2xl py-3 border-b border-cream/10"
            >
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
    </header>
  );
}
