"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getQueuedSales, queueSale, removeQueuedSale, type QueuedSale } from "@/lib/offlineQueue";

type Product = { id: string; name: string; price: number; is_available: boolean; is_hidden: boolean };
type Line = { product_id: string; name: string; unit_price: number; quantity: number };
type HeldSale = { id: string; sale_number: string; note: string | null; total: number; created_at: string };

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
  const [lastSale, setLastSale] = useState<{ id: string; sale_number: string; change: number } | null>(null);

  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [showHeld, setShowHeld] = useState(false);
  const [holdNote, setHoldNote] = useState("");
  const [showHoldPrompt, setShowHoldPrompt] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundSaleNumber, setRefundSaleNumber] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundLookup, setRefundLookup] = useState<{ id: string; total: number; status: string } | "not_found" | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, price, is_available, is_hidden")
      .eq("is_hidden", false)
      .order("name")
      .then(({ data }) => setProducts((data as Product[]) ?? []));
    loadHeldSales();

    setIsOnline(navigator.onLine);
    setQueuedCount(getQueuedSales().length);

    function handleOnline() {
      setIsOnline(true);
      syncQueuedSales();
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function syncQueuedSales() {
    const queued = getQueuedSales();
    if (queued.length === 0) return;
    setSyncing(true);

    let syncedCount = 0;
    for (const q of queued) {
      // idempotency_key has a unique constraint at the DB level, so a retried
      // sync can never create a duplicate sale even if this runs twice.
      const { data: sale, error: saleErr } = await supabase
        .from("pos_sales")
        .insert({
          subtotal: q.subtotal,
          discount: q.discount,
          total: q.total,
          amount_paid: q.amountPaid,
          change_due: q.changeDue,
          payment_method: q.paymentMethod,
          status: "completed",
          idempotency_key: q.idempotencyKey,
          note: `Synced from offline queue (queued ${new Date(q.queuedAt).toLocaleString()})`
        })
        .select("id")
        .single();

      if (!saleErr && sale) {
        await supabase.from("pos_sale_items").insert(
          q.lines.map((l) => ({
            sale_id: sale.id,
            product_id: l.product_id,
            product_name: l.name,
            unit_price: l.unit_price,
            quantity: l.quantity,
            line_total: l.unit_price * l.quantity
          }))
        );
        removeQueuedSale(q.idempotencyKey);
        syncedCount++;
      } else if (saleErr?.message?.includes("duplicate") || saleErr?.code === "23505") {
        // Already synced previously under this idempotency key — safe to drop from the queue.
        removeQueuedSale(q.idempotencyKey);
      }
    }

    setQueuedCount(getQueuedSales().length);
    setSyncing(false);
    if (syncedCount > 0) {
      setSyncMessage(`Synced ${syncedCount} offline sale${syncedCount === 1 ? "" : "s"}.`);
      setTimeout(() => setSyncMessage(null), 4000);
    }
    loadHeldSales();
  }

  async function loadHeldSales() {
    const { data } = await supabase
      .from("pos_sales")
      .select("id, sale_number, note, total, created_at")
      .eq("status", "held")
      .order("created_at", { ascending: false });
    setHeldSales((data as HeldSale[]) ?? []);
  }

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

  async function holdSale() {
    if (lines.length === 0) return;
    setError(null);
    const idempotencyKey = `pos_hold_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const { data: sale, error: saleErr } = await supabase
      .from("pos_sales")
      .insert({
        subtotal,
        discount,
        total,
        status: "held",
        note: holdNote.trim() || null,
        idempotency_key: idempotencyKey
      })
      .select("id, sale_number")
      .single();

    if (saleErr || !sale) {
      setError("Couldn't hold the sale. Please try again.");
      return;
    }

    await supabase.from("pos_sale_items").insert(
      lines.map((l) => ({
        sale_id: sale.id,
        product_id: l.product_id,
        product_name: l.name,
        unit_price: l.unit_price,
        quantity: l.quantity,
        line_total: l.unit_price * l.quantity
      }))
    );

    clearSale();
    setShowHoldPrompt(false);
    setHoldNote("");
    loadHeldSales();
  }

  async function resumeSale(saleId: string) {
    const { data: items } = await supabase
      .from("pos_sale_items")
      .select("product_id, product_name, unit_price, quantity")
      .eq("sale_id", saleId);

    if (items) {
      setLines(
        items.map((it: any) => ({
          product_id: it.product_id,
          name: it.product_name,
          unit_price: Number(it.unit_price),
          quantity: it.quantity
        }))
      );
    }

    await supabase.from("pos_sale_items").delete().eq("sale_id", saleId);
    await supabase.from("pos_sales").delete().eq("id", saleId);
    setShowHeld(false);
    loadHeldSales();
  }

  async function deleteHeldSale(saleId: string) {
    if (!confirm("Delete this held sale permanently?")) return;
    await supabase.from("pos_sale_items").delete().eq("sale_id", saleId);
    await supabase.from("pos_sales").delete().eq("id", saleId);
    loadHeldSales();
  }

  async function completeSale() {
    if (lines.length === 0) return;
    setCompleting(true);
    setError(null);

    const idempotencyKey = `pos_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    if (!navigator.onLine) {
      const queued: QueuedSale = {
        idempotencyKey,
        subtotal,
        discount,
        total,
        amountPaid: paymentMethod === "cash" ? paidNum : total,
        changeDue: change,
        paymentMethod,
        queuedAt: new Date().toISOString(),
        lines
      };
      queueSale(queued);
      setQueuedCount(getQueuedSales().length);
      setLines([]);
      setDiscount(0);
      setAmountPaid("");
      setCompleting(false);
      setSyncMessage("You're offline — sale saved and will sync automatically once you're back online.");
      setTimeout(() => setSyncMessage(null), 5000);
      return;
    }

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
      .select("id, sale_number")
      .single();

    if (saleErr || !sale) {
      setError("Couldn't complete the sale. Please try again.");
      setCompleting(false);
      return;
    }

    await supabase.from("pos_sale_items").insert(
      lines.map((l) => ({
        sale_id: sale.id,
        product_id: l.product_id,
        product_name: l.name,
        unit_price: l.unit_price,
        quantity: l.quantity,
        line_total: l.unit_price * l.quantity
      }))
    );

    setLastSale({ id: sale.id, sale_number: sale.sale_number, change });
    setLines([]);
    setDiscount(0);
    setAmountPaid("");
    setCompleting(false);
  }

  function printReceipt(saleId: string) {
    window.open(`/adminlsc/pos/receipt/${saleId}`, "_blank");
  }

  async function lookupRefundSale() {
    setRefundError(null);
    const { data } = await supabase
      .from("pos_sales")
      .select("id, total, status")
      .eq("sale_number", refundSaleNumber.trim())
      .maybeSingle();

    if (!data || data.status !== "completed") {
      setRefundLookup("not_found");
      return;
    }
    setRefundLookup(data);
  }

  async function confirmRefund() {
    if (!refundLookup || refundLookup === "not_found") return;
    setRefunding(true);
    setRefundError(null);

    const { error: refundErr } = await supabase
      .from("pos_sales")
      .update({ status: "refunded", refund_reason: refundReason.trim() || null })
      .eq("id", refundLookup.id);

    setRefunding(false);
    if (refundErr) {
      setRefundError(
        refundErr.message.includes("Refund permission")
          ? "You don't have permission to process refunds."
          : "Couldn't process the refund. Please try again."
      );
      return;
    }

    setShowRefund(false);
    setRefundSaleNumber("");
    setRefundReason("");
    setRefundLookup(null);
  }

  function closeRefundModal() {
    setShowRefund(false);
    setRefundSaleNumber("");
    setRefundReason("");
    setRefundLookup(null);
    setRefundError(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-brown">Mini POS</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCalculator(true)} className="text-sm text-brown/60 border border-brown/20 rounded-sm px-3 py-1.5 hover:border-brown/40">
            Calculator
          </button>
          <button onClick={() => setShowHeld(true)} className="text-sm text-brown/60 border border-brown/20 rounded-sm px-3 py-1.5 hover:border-brown/40">
            Held Sales {heldSales.length > 0 && `(${heldSales.length})`}
          </button>
          <button onClick={() => setShowRefund(true)} className="text-sm text-brown/60 border border-brown/20 rounded-sm px-3 py-1.5 hover:border-brown/40">
            Refund
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isOnline ? "bg-teal/10 text-teal" : "bg-red-50 text-red-700"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-teal" : "bg-red-600"}`} />
          {isOnline ? "Online" : "Offline"}
        </span>
        {queuedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-caramel/20 text-brown">
            {syncing ? "Syncing…" : `${queuedCount} sale${queuedCount === 1 ? "" : "s"} waiting to sync`}
          </span>
        )}
      </div>

      {syncMessage && (
        <div className="bg-teal/10 text-teal text-sm rounded-sm p-3 mb-4">{syncMessage}</div>
      )}

      {lastSale && (
        <div className="bg-teal text-cream rounded-sm p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <p>
            Sale <strong>{lastSale.sale_number}</strong> completed.
            {lastSale.change > 0 && ` Change due: KSh ${lastSale.change.toLocaleString()}`}
          </p>
          <div className="flex gap-3">
            <button onClick={() => printReceipt(lastSale.id)} className="text-caramel text-sm underline">Print Receipt</button>
            <button onClick={() => setLastSale(null)} className="text-caramel text-sm">Dismiss</button>
          </div>
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

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={completeSale}
              disabled={lines.length === 0 || completing || (paymentMethod === "cash" && paidNum < total)}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {completing ? "Completing…" : "Complete Sale"}
            </button>
            <button
              onClick={() => setShowHoldPrompt(true)}
              disabled={lines.length === 0}
              className="text-sm border border-brown/20 rounded-sm px-3 py-2 text-brown disabled:opacity-40"
            >
              Hold
            </button>
            <button onClick={clearSale} className="text-brown/60 text-sm">Clear</button>
          </div>
        </div>
      </div>

      {showHoldPrompt && (
        <div className="fixed inset-0 bg-brown/40 flex items-center justify-center z-50 p-4" onClick={() => setShowHoldPrompt(false)}>
          <div className="bg-white rounded-sm p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg text-brown mb-3">Hold this sale</h3>
            <label className="block mb-4">
              <span className="block text-xs font-medium text-brown mb-1">Label (e.g. customer name/table)</span>
              <input value={holdNote} onChange={(e) => setHoldNote(e.target.value)} className="input" autoFocus />
            </label>
            <div className="flex gap-3">
              <button onClick={holdSale} className="btn-primary">Hold Sale</button>
              <button onClick={() => setShowHoldPrompt(false)} className="text-brown/60 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showHeld && (
        <div className="fixed inset-0 bg-brown/40 flex items-center justify-center z-50 p-4" onClick={() => setShowHeld(false)}>
          <div className="bg-white rounded-sm p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-brown">Held Sales</h3>
              <button onClick={() => setShowHeld(false)} className="text-brown/50">✕</button>
            </div>
            {heldSales.length === 0 ? (
              <p className="text-brown/50 text-sm">No held sales.</p>
            ) : (
              <div className="space-y-3">
                {heldSales.map((h) => (
                  <div key={h.id} className="border border-brown/10 rounded-sm p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-brown">{h.note || h.sale_number}</p>
                      <p className="text-xs text-brown/50">KSh {Number(h.total).toLocaleString()} · {new Date(h.created_at).toLocaleTimeString()}</p>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <button onClick={() => resumeSale(h.id)} className="text-teal hover:underline">Resume</button>
                      <button onClick={() => deleteHeldSale(h.id)} className="text-red-700 hover:underline">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}

      {showRefund && (
        <div className="fixed inset-0 bg-brown/40 flex items-center justify-center z-50 p-4" onClick={closeRefundModal}>
          <div className="bg-white rounded-sm p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg text-brown mb-3">Refund a Sale</h3>
            <label className="block mb-3">
              <span className="block text-xs font-medium text-brown mb-1">Sale number</span>
              <div className="flex gap-2">
                <input
                  value={refundSaleNumber}
                  onChange={(e) => { setRefundSaleNumber(e.target.value); setRefundLookup(null); }}
                  className="input"
                  placeholder="POS-20260908-00001"
                />
                <button onClick={lookupRefundSale} className="text-sm text-teal whitespace-nowrap px-2">Find</button>
              </div>
            </label>

            {refundLookup === "not_found" && (
              <p className="text-sm text-red-700 mb-3">No completed sale found with that number.</p>
            )}

            {refundLookup && refundLookup !== "not_found" && (
              <>
                <p className="text-sm text-brown mb-3">Total: KSh {Number(refundLookup.total).toLocaleString()}</p>
                <label className="block mb-4">
                  <span className="block text-xs font-medium text-brown mb-1">Reason (optional)</span>
                  <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={2} className="input" />
                </label>
                {refundError && <p className="text-sm text-red-700 mb-3">{refundError}</p>}
                <div className="flex gap-3">
                  <button onClick={confirmRefund} disabled={refunding} className="btn-primary disabled:opacity-50">
                    {refunding ? "Processing…" : "Confirm Refund"}
                  </button>
                  <button onClick={closeRefundModal} className="text-brown/60 text-sm">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}

function Calculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);

  function inputDigit(d: string) {
    if (justEvaluated) {
      setDisplay(d === "." ? "0." : d);
      setJustEvaluated(false);
      return;
    }
    if (d === "." && display.includes(".")) return;
    setDisplay(display === "0" && d !== "." ? d : display + d);
  }

  function clearAll() {
    setDisplay("0");
    setStored(null);
    setPendingOp(null);
    setJustEvaluated(false);
  }

  function backspace() {
    setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
  }

  function applyOp(op: string) {
    const current = parseFloat(display);
    if (stored === null) {
      setStored(current);
    } else if (pendingOp) {
      setStored(compute(stored, current, pendingOp));
    }
    setPendingOp(op);
    setJustEvaluated(true);
  }

  function compute(a: number, b: number, op: string) {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? 0 : a / b;
      default: return b;
    }
  }

  function equals() {
    if (stored === null || !pendingOp) return;
    const result = compute(stored, parseFloat(display), pendingOp);
    setDisplay(String(result));
    setStored(null);
    setPendingOp(null);
    setJustEvaluated(true);
  }

  function percent() {
    setDisplay(String(parseFloat(display) / 100));
  }

  const keys = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "%", "+"];

  return (
    <div className="fixed inset-0 bg-brown/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-sm p-5 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-brown">Calculator</h3>
          <button onClick={onClose} className="text-brown/50">✕</button>
        </div>
        <div className="bg-cream rounded-sm p-4 text-right font-display text-3xl text-brown mb-3 truncate">
          {display}
        </div>
        <div className="grid grid-cols-4 gap-2 mb-2">
          <button onClick={clearAll} className="col-span-2 py-2.5 rounded-sm bg-brown/10 text-brown text-sm font-medium">C</button>
          <button onClick={backspace} className="py-2.5 rounded-sm bg-brown/10 text-brown text-sm font-medium">⌫</button>
          <button onClick={percent} className="py-2.5 rounded-sm bg-brown/10 text-brown text-sm font-medium">%</button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {keys.map((k) => {
            const isOp = ["÷", "×", "-", "+"].includes(k);
            return (
              <button
                key={k}
                onClick={() => (isOp ? applyOp(k) : k === "%" ? percent() : inputDigit(k))}
                className={`py-2.5 rounded-sm text-sm font-medium ${
                  isOp ? "bg-teal text-cream" : "bg-cream text-brown"
                }`}
              >
                {k}
              </button>
            );
          })}
          <button onClick={equals} className="col-span-4 py-2.5 rounded-sm bg-caramel text-brown text-sm font-semibold mt-1">
            =
          </button>
        </div>
      </div>
    </div>
  );
}
