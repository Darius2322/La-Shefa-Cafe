"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wraps a section and fades/slides it up once it enters the viewport.
 * - No-ops instantly (no flash-then-animate) if the browser has already
 *   scrolled past the element on load, or if the user has requested
 *   reduced motion — the global `prefers-reduced-motion` CSS override in
 *   globals.css also collapses the animation duration to near-zero as a
 *   second safety net.
 * - `delay` lets sibling cards stagger slightly without needing separate
 *   keyframes per item.
 */
export function Reveal({
  children,
  delay = 0,
  className = ""
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} transition-all duration-500 ease-out ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
