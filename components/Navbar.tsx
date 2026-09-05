"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "./CartProvider";

const LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/cakes", label: "Cakes" },
  { href: "/booking", label: "Booking" },
  { href: "/offers", label: "Offers" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export function Navbar() {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-brown/10">
      <div className="container-lsc flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-3" aria-label="La Shefa Cafe home">
          <Image src="/logo.jpg" alt="La Shefa Cafe" width={44} height={44} className="rounded-sm" />
          <span className="font-display text-lg text-teal hidden sm:block">La Shefa Cafe</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 font-body text-[15px] text-brown">
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
          <Link href="/checkout" className="relative btn-primary !py-2 !px-4 text-sm" aria-label="View cart">
            Cart
            {itemCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-caramel text-brown text-xs font-semibold">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            className="md:hidden text-brown"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden container-lsc pb-4 flex flex-col gap-3 font-body text-brown">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-1">
              {l.label}
            </Link>
          ))}
          <Link href="/track" onClick={() => setOpen(false)} className="py-1">
            Track Order
          </Link>
        </nav>
      )}
    </header>
  );
}
