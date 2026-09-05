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
    <div className="divider pt-5 flex flex-col">
      {product.image_url && (
        <div className="relative w-full aspect-[4/3] mb-4 overflow-hidden rounded-sm">
          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
        </div>
      )}
      <h3 className="font-display text-xl text-brown">{product.name}</h3>
      {product.description && (
        <p className="text-sm text-brown/70 mt-1 flex-1">{product.description}</p>
      )}
      <div className="flex items-center justify-between mt-3">
        <p className="text-teal font-semibold">KSh {Number(product.price).toLocaleString()}</p>
        {product.is_available ? (
          <button
            onClick={handleAdd}
            className="text-sm font-medium px-4 py-2 rounded-sm bg-caramel text-brown hover:bg-caramel-light transition-colors"
          >
            {added ? "Added" : "Add to cart"}
          </button>
        ) : (
          <span className="text-xs text-brown/50">Unavailable</span>
        )}
      </div>
    </div>
  );
}
