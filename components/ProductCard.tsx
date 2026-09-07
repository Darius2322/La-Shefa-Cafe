"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "./CartProvider";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      unit_price: Number(product.price)
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="divider pt-3 sm:pt-5 flex flex-col">
      <div className="relative w-full aspect-square sm:aspect-[4/3] mb-2 sm:mb-4 overflow-hidden rounded-sm bg-brown/5">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-brown/20 text-xs">No photo</span>
          </div>
        )}
      </div>
      <h3 className="font-display text-base sm:text-xl text-brown leading-tight">{product.name}</h3>
      {product.description && (
        <p className="text-xs sm:text-sm text-brown/70 mt-1 flex-1 hidden sm:block">{product.description}</p>
      )}
      <div className="flex items-center justify-between mt-2 sm:mt-3 gap-2">
        <p className="text-teal font-semibold text-sm sm:text-base">KSh {Number(product.price).toLocaleString()}</p>
        {product.is_available ? (
          <button
            onClick={handleAdd}
            className="text-xs sm:text-sm font-medium px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-sm bg-caramel text-brown hover:bg-caramel-light transition-colors whitespace-nowrap"
          >
            {added ? "Added" : "Add"}
          </button>
        ) : (
          <span className="text-xs text-brown/50">Unavailable</span>
        )}
      </div>
    </div>
  );
}
