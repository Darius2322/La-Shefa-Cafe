"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type MenuCarouselItem = { id: string; name: string; price: number; image_url: string | null };

const ADVANCE_MS = 1500;

/** How many cards are visible at once, by viewport width. Recomputed on
 * resize so rotating a tablet or resizing a browser window updates the
 * layout immediately rather than waiting for a reload. */
function getVisibleCount(width: number) {
  if (width < 480) return 1;
  if (width < 768) return 2;
  if (width < 1024) return 3;
  return 4;
}

export function MenuCarousel({ items }: { items: MenuCarouselItem[] }) {
  const [visibleCount, setVisibleCount] = useState(1);
  const [startIndex, setStartIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function updateCount() {
      setVisibleCount(getVisibleCount(window.innerWidth));
    }
    updateCount();
    window.addEventListener("resize", updateCount);
    return () => window.removeEventListener("resize", updateCount);
  }, []);

  useEffect(() => {
    const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || prefersReduced || items.length <= visibleCount) return;

    timerRef.current = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % items.length);
    }, ADVANCE_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, items.length, visibleCount]);

  function goTo(direction: 1 | -1) {
    setStartIndex((prev) => (prev + direction + items.length) % items.length);
    // Manual nudge restarts the read-window on the timer rather than
    // fighting it — brief pause so the just-clicked card doesn't
    // immediately jump again.
    setPaused(true);
    setTimeout(() => setPaused(false), ADVANCE_MS);
  }

  // Windowed, wrapping slice — e.g. 4 visible starting near the end of the
  // list wraps back to the beginning, so the carousel always has a full
  // row instead of trailing off with empty space.
  const visibleItems = Array.from({ length: Math.min(visibleCount, items.length) }, (_, i) => items[(startIndex + i) % items.length]);

  return (
    <div
      className="container-lsc"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-stretch gap-3">
        <NavButton direction="prev" onClick={() => goTo(-1)} />
        <div className="flex-1 grid gap-3 sm:gap-4" style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}>
          {visibleItems.map((p, i) => (
            <Link
              key={`${p.id}-${startIndex}-${i}`}
              href="/menu"
              className="bg-white border border-brown/10 rounded-sm overflow-hidden card-hover animate-fade-in"
            >
              <div className="relative w-full aspect-square bg-brown/5">
                {p.image_url ? (
                  <Image src={p.image_url} alt={p.name} fill sizes="(max-width: 480px) 90vw, 240px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brown/25 text-xs">No image</div>
                )}
              </div>
              <div className="p-3">
                <p className="font-display text-sm text-brown truncate">{p.name}</p>
                <p className="text-teal text-xs font-semibold mt-0.5">KSh {p.price.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
        <NavButton direction="next" onClick={() => goTo(1)} />
      </div>

      <div className="flex justify-center mt-6">
        <Link href="/menu" className="btn-caramel">
          View Full Menu
        </Link>
      </div>
    </div>
  );
}

function NavButton({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous items" : "Next items"}
      className="flex-shrink-0 self-center h-9 w-9 rounded-full border border-brown/20 bg-white flex items-center justify-center text-brown hover:border-teal hover:text-teal transition-colors"
    >
      {direction === "prev" ? <ChevronLeft size={17} strokeWidth={2} /> : <ChevronRight size={17} strokeWidth={2} />}
    </button>
  );
}
