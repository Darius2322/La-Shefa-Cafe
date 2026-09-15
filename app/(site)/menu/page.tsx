import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { MenuBrowser } from "@/components/MenuBrowser";
import type { Category, Product } from "@/lib/types";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const metadata = { title: "Menu — La Shefa Cafe" };

async function getMenuData() {
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("kind", "menu")
      .order("sort_order"),
    supabase
      .from("products")
      .select("*")
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
  ]);
  return {
    categories: (categories as Category[]) ?? [],
    products: (products as Product[]) ?? []
  };
}

export default async function MenuPage() {
  const { categories, products } = await getMenuData();

  return (
    <div className="container-lsc py-10 sm:py-14">
      <h1 className="font-display text-display-md sm:text-display-lg text-brown mb-2">Our Menu</h1>
      <p className="text-brown/70 mb-8 sm:mb-10 max-w-prose text-sm sm:text-base">
        Everything below is prepared fresh daily. Add items to your cart, then check out —
        no account required.
      </p>
      <Suspense fallback={<p className="text-brown/50 text-sm">Loading menu…</p>}>
        <MenuBrowser categories={categories} products={products} />
      </Suspense>
    </div>
  );
}
