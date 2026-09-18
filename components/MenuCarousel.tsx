"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/CartProvider";

type MenuCarouselItem = { id: string; name: string; price: number; image_url: string | null };

const ADVANCE_MS = 3500;
const SLIDE_MS = 600;

function getVisibleCount(width: number) {
  if (width < 480) return 1;
  if (width < 768) return 2;
  if (width < 1024) return 3;
  return 4;
}

export function MenuCarousel({ items }: { items: MenuCarouselItem[] }) {
  const router = useRouter();
  const { addItem } = useCart();

  const [visibleCount, setVisibleCount] = useState(1);
  const [index, setIndex] = useState(0);
  const [instant, setInstant] = useState(false);
  const [paused, setPaused] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxIndex = Math.max(0, items.length - visibleCount);

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

    const timer = setInterval(() => step(1), ADVANCE_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, items.length, visibleCount, index]);

  function step(direction: 1 | -1) {
    setIndex((prev) => {
      const next = prev + direction;
      if (next > maxIndex) {
        // Real slide to the end, then an instant (unanimated) reset back to
        // the start once the slide finishes — the only point in the loop
        // that isn't a visible side-to-side motion, same trick most
        // production carousels use rather than an infinite duplicated track.
        setTimeout(() => {
          setInstant(true);
          setIndex(0);
          requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
        }, SLIDE_MS);
        return next;
      }
      if (next < 0) {
        setTimeout(() => {
          setInstant(true);
          setIndex(maxIndex);
          requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
        }, SLIDE_MS);
        return next;
      }
      return next;
    });
  }

  function manualStep(direction: 1 | -1) {
    step(direction);
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), ADVANCE_MS);
  }

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
    setJustAdded(false);
  }

  function handleOrderNow(e: React.MouseEvent, item: MenuCarouselItem) {
    e.preventDefault();
    e.stopPropagation();
    addItem({ product_id: item.id, product_name: item.name, unit_price: item.price }, 1);
    setJustAdded(true);
    setTimeout(() => router.push("/checkout"), 500);
  }

  const trackWidthPercent = (items.length / visibleCount) * 100;

  return (
    <div
      className="container-lsc"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-stretch gap-2 sm:gap-3">
        <NavButton direction="prev" onClick={() => manualStep(-1)} />

        <div className="flex-1 overflow-hidden">
          <div
            className={`flex ${instant ? "" : "transition-transform ease-out"}`}
            style={{
              width: `${trackWidthPercent}%`,
              transform: `translateX(-${index * (100 / items.length)}%)`,
              transitionDuration: instant ? "0ms" : `${SLIDE_MS}ms`
            }}
          >
            {items.map((p) => {
              const selected = selectedId === p.id;
              return (
                <div key={p.id} className="px-1.5 sm:px-2" style={{ width: `${100 / items.length}%` }}>
                  <button
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={`w-full text-left bg-white border rounded-sm overflow-hidden transition-colors ${
                      selected ? "border-teal shadow-soft-lg" : "border-brown/10 hover:border-brown/25"
                    }`}
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
                    {selected && (
                      <div className="p-3 pt-0">
                        <button
                          type="button"
                          onClick={(e) => handleOrderNow(e, p)}
                          className="btn-caramel w-full !py-2 text-sm justify-center"
                        >
                          <ShoppingBag size={14} strokeWidth={2} />
                          {justAdded ? "Added — going to checkout…" : "Order Now"}
                        </button>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <NavButton direction="next" onClick={() => manualStep(1)} />
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
