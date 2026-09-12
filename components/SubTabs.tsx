"use client";

import { useState } from "react";

export function SubTabs({
  tabs
}: {
  tabs: { label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-brown/15 mb-8">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active === i
                ? "border-teal text-teal"
                : "border-transparent text-brown/50 hover:text-brown"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active].content}</div>
    </div>
  );
}
