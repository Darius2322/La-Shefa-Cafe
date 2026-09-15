"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";

export function SubTabs({
  tabs,
  initialIndex = 0
}: {
  tabs: { label: string; content: React.ReactNode; icon?: LucideIcon }[];
  initialIndex?: number;
}) {
  const [active, setActive] = useState(initialIndex);

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-brown/15 mb-8">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5 ${
              active === i
                ? "border-teal text-teal"
                : "border-transparent text-brown/50 hover:text-brown"
            }`}
          >
            {tab.icon && <tab.icon size={14} strokeWidth={1.75} />}
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active].content}</div>
    </div>
  );
}
