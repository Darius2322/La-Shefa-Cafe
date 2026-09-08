"use client";

import { useMemo, useState } from "react";
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
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-sm text-sm font-medium border ${
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
            className={`px-4 py-2 rounded-sm text-sm font-medium border ${
              activeCategory === c.id
                ? "bg-teal text-cream border-teal"
                : "border-brown/20 text-brown hover:border-teal"
            }`}
          >
            {c.name}
          </button>
        ))}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the menu"
          aria-label="Search the menu"
          className="ml-auto border border-brown/20 rounded-sm px-4 py-2 text-sm bg-white text-brown w-full sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-brown/25 rounded-sm p-10 text-center">
          <p className="font-display text-xl text-brown mb-2">Nothing matches yet</p>
          <p className="text-brown/60 text-sm">Try a different search term or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
