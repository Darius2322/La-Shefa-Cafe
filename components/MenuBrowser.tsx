"use client";

import { useMemo, useState } from "react";
import { Search, UtensilsCrossed } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Category, Product } from "@/lib/types";

export function MenuBrowser({
  categories,
  products
}: {
  categories: Category[];
  products: Product[];
}) {
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = activeCategory === "all" || p.category_id === activeCategory;
      const matchesQuery = query.trim()
        ? p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.description ?? "").toLowerCase().includes(query.toLowerCase())
        : true;
      return matchesCategory && matchesQuery;
    });
  }, [products, activeCategory, query]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 sm:mb-8">
        <div className="scroll-rail gap-2 -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap">
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex-shrink-0 px-3.5 py-2 rounded-sm text-sm font-medium border transition-colors ${
              activeCategory === "all"
                ? "bg-teal text-cream border-teal"
                : "border-brown/20 text-brown hover:border-teal"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-sm text-sm font-medium border transition-colors ${
                activeCategory === c.id
                  ? "bg-teal text-cream border-teal"
                  : "border-brown/20 text-brown hover:border-teal"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto w-full sm:w-64 flex-shrink-0">
          <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the menu"
            aria-label="Search the menu"
            className="border border-brown/20 rounded-sm pl-9 pr-4 py-2 text-sm bg-white text-brown w-full focus:border-teal transition-colors"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-brown/25 rounded-sm p-10 text-center">
          <UtensilsCrossed size={28} strokeWidth={1.5} className="mx-auto mb-3 text-brown/30" />
          <p className="font-display text-xl text-brown mb-2">Nothing matches yet</p>
          <p className="text-brown/60 text-sm">Try a different search term or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
