"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = { id: string; name: string; price: number; is_available: boolean; is_hidden: boolean };
type Line = { product_id: string; name: string; unit_price: number; quantity: number };

const PAYMENT_METHODS = ["cash", "mpesa", "card", "other"] as const;

export default function AdminPosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<{ sale_number: string; change: number } | null>(null);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, price, is_available, is_hidden")
      .eq("is_hidden", false)
      .order("name")
      .then(({ data }) => setProducts((data as Product[]) ?? []));
  }, []);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.unit_price * l.quantity, 0), [lines]);
  const total = Math.max(0, subtotal - discount);
  const paidNum = Number(amountPaid) || 0;
  const change = paymentMethod === "cash" ? Math.max(0, paidNum - total) : 0;

  function addProduct(p: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product_id === p.id);
      if (existing) {
        return prev.map((l) => (l.product_id === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { product_id: p.id, name: p.name, unit_price: Number(p.price), quantity: 1 }];
    });
  }

  function updateQty(id: string, qty: number) {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.product_id !== id) : prev.map((l) => (l.product_id === id ? { ...l, quantity: qty } : l))
    );
  }

  function clearSale() {
    setLines([]);
    setDiscount(0);
    setAmountPaid("");
    setLastSale(null);
    setError(null);
  }

  async function completeSale() {
    if (lines.length === 0) return;
    setCompleting(true);
    setError(null);

    const idempotencyKey = `pos_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const { data: sale, error: saleErr } = await supabase
      .from("pos_sales")
      .insert({
        subtotal,
        discount,
        total,
        amount_paid: paymentMethod === "cash" ? paidNum : total,
        change_due: change,
        payment_method: paymentMethod,
        status: "completed",
        idempotency_key: idempotencyKey
      })
      .select("sale_number")
      .single();

    if (saleErr || !sale) {
      setError("Couldn't complete the sale. Please try again.");
      setCompleting(false);
      return;
    }

    const { data: saleRow } = await supabase
      .from("pos_sales")
      .select("id")
      .eq("sale_number", sale.sale_number)
      .single();

    if (saleRow) {
      await supabase.from("pos_sale_items").insert(
        lines.map((l) => ({
          sale_id: saleRow.id,
          product_id: l.product_id,
          product_name: l.name,
          unit_price: l.unit_price,
          quantity: l.quantity,
          line_total: l.unit_price * l.quantity
        }))
      );
    }

    setLastSale({ sale_number: sale.sale_number, change });
    setLines([]);
    setDiscount(0);
    setAmountPaid("");
    setCompleting(false);
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-brown mb-6">Mini POS</h1>

      {lastSale && (
        <div className="bg-teal text-cream rounded-sm p-4 mb-6 flex items-center justify-between">
          <p>
            Sale <strong>{lastSale.sale_number}</strong> completed.
            {lastSale.change > 0 && ` Change due: KSh ${lastSale.change.toLocaleString()}`}
          </p>
          <button onClick={() => setLastSale(null)} className="text-caramel text-sm">Dismiss</button>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="input mb-4"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                disabled={!p.is_available}
                className="bg-white border border-brown/10 rounded-sm p-3 text-left hover:border-teal disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <p className="text-sm font-medium text-brown">{p.name}</p>
                <p className="text-xs text-teal">KSh {Number(p.price).toLocaleString()}</p>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-brown/50 text-sm col-span-full">No products found.</p>}
          </div>
        </div>

        <div className="bg-white border border-brown/10 rounded-sm p-5 h-fit">
          <h2 className="font-display text-lg text-brown mb-4">Current Sale</h2>
          {lines.length === 0 ? (
            <p className="text-brown/50 text-sm mb-4">No items added yet.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {lines.map((l) => (
                <div key={l.product_id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-brown flex-1">{l.name}</span>
                  <input
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) => updateQty(l.product_id, Number(e.target.value))}
                    className="w-12 border border-brown/20 rounded-sm text-center py-0.5"
                  />
                  <span className="text-brown w-20 text-right">KSh {(l.unit_price * l.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <label className="block mb-3">
            <span className="block text-xs font-medium text-brown mb-1">Discount (KSh)</span>
            <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="input" />
          </label>

          <div className="flex justify-between text-sm text-brown/70 mb-1">
            <span>Subtotal</span>
            <span>KSh {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-semibold text-brown mb-4">
            <span>Total</span>
            <span>KSh {total.toLocaleString()}</span>
          </div>

          <label className="block mb-3">
            <span className="block text-xs font-medium text-brown mb-1">Payment Method</span>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="input capitalize">
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          {paymentMethod === "cash" && (
            <label className="block mb-3">
              <span className="block text-xs font-medium text-brown mb-1">Amount Paid</span>
              <input type="number" min={0} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="input" />
              {paidNum > 0 && (
                <span className="block text-xs text-teal mt-1">Change: KSh {change.toLocaleString()}</span>
              )}
            </label>
          )}

          {error && <p className="text-sm text-red-700 mb-3">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={completeSale}
              disabled={lines.length === 0 || completing || (paymentMethod === "cash" && paidNum < total)}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {completing ? "Completing…" : "Complete Sale"}
            </button>
            <button onClick={clearSale} className="text-brown/60 text-sm">Clear</button>
          </div>
        </div>
      </div>

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}
