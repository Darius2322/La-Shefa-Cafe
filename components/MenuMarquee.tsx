import Image from "next/image";
import Link from "next/link";

type MarqueeItem = { id: string; name: string; price: number; image_url: string | null };

/**
 * CSS-only infinite marquee: the item list is rendered twice back to back
 * and the whole track animates left by exactly one list-width, so the loop
 * point is invisible. Pauses on hover/focus so it's readable, and collapses
 * to a static line under prefers-reduced-motion via the global override in
 * globals.css plus the explicit media query below (belt and suspenders,
 * since this is a plain CSS animation rather than the JS-driven Reveal
 * pattern used elsewhere).
 */
export function MenuMarquee({ items }: { items: MarqueeItem[] }) {
  if (items.length === 0) return null;
  const track = [...items, ...items];

  return (
    <div className="menu-marquee-viewport">
      <div className="menu-marquee-track">
        {track.map((p, i) => (
          <Link
            key={`${p.id}-${i}`}
            href="/menu"
            className="flex-shrink-0 w-40 sm:w-48 bg-white border border-brown/10 rounded-sm overflow-hidden card-hover"
          >
            <div className="relative w-full aspect-square bg-brown/5">
              {p.image_url && <Image src={p.image_url} alt={p.name} fill sizes="200px" className="object-cover" />}
            </div>
            <div className="p-3">
              <p className="font-display text-sm text-brown truncate">{p.name}</p>
              <p className="text-teal text-xs font-semibold mt-0.5">KSh {p.price.toLocaleString()}</p>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        .menu-marquee-viewport {
          overflow: hidden;
          width: 100%;
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
        .menu-marquee-track {
          display: flex;
          gap: 1rem;
          width: max-content;
          padding: 0 1.25rem;
          animation: menu-marquee-scroll 38s linear infinite;
        }
        .menu-marquee-viewport:hover .menu-marquee-track,
        .menu-marquee-viewport:focus-within .menu-marquee-track {
          animation-play-state: paused;
        }
        @keyframes menu-marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .menu-marquee-track { animation: none; }
          .menu-marquee-viewport { overflow-x: auto; }
        }
      `}</style>
    </div>
  );
}
