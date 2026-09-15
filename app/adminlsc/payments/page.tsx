"use client";

import { useEffect, useState } from "react";
import { CreditCard, Smartphone, Banknote, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PaymentMethod = {
  id: string;
  method: string;
  label: string;
  is_enabled: boolean;
  till_number: string | null;
  paybill_number: string | null;
  paybill_account: string | null;
  pochi_number: string | null;
  instructions: string | null;
  sort_order: number;
};

const ICONS: Record<string, any> = {
  mpesa_till: Smartphone,
  mpesa_paybill: Smartphone,
  mpesa_pochi: Smartphone,
  cash: Banknote,
  card: CreditCard,
  other: Wallet
};

export default function AdminPaymentsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("payment_methods").select("*").order("sort_order");
    if (error) {
      setTableMissing(true);
      setLoading(false);
      return;
    }
    setMethods((data as PaymentMethod[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function updateLocal(id: string, patch: Partial<PaymentMethod>) {
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  async function toggleEnabled(m: PaymentMethod) {
    await supabase.from("payment_methods").update({ is_enabled: !m.is_enabled, updated_at: new Date().toISOString() }).eq("id", m.id);
    updateLocal(m.id, { is_enabled: !m.is_enabled });
  }

  async function saveDetails(m: PaymentMethod) {
    setSavingId(m.id);
    await supabase
      .from("payment_methods")
      .update({
        till_number: m.till_number,
        paybill_number: m.paybill_number,
        paybill_account: m.paybill_account,
        pochi_number: m.pochi_number,
        instructions: m.instructions,
        updated_at: new Date().toISOString()
      })
      .eq("id", m.id);
    setSavingId(null);
    setSavedId(m.id);
    setTimeout(() => setSavedId(null), 1500);
  }

  if (tableMissing) {
    return (
      <div>
        <h1 className="font-display text-display-md text-brown mb-6">Payment Settings</h1>
        <div className="border border-dashed border-brown/25 rounded-sm p-8 max-w-lg">
          <Wallet size={24} strokeWidth={1.5} className="text-brown/30 mb-3" />
          <p className="font-display text-lg text-brown mb-2">Payment methods table not set up yet</p>
          <p className="text-sm text-brown/60">
            This feature needs a one-time database migration. Run{" "}
            <code className="bg-brown/5 px-1.5 py-0.5 rounded text-xs">migrations/002_operations_upgrade.sql</code>{" "}
            in your Supabase project's SQL editor, then reload this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-display-md text-brown mb-2">Payment Settings</h1>
      <p className="text-sm text-brown/50 mb-8">
        Enable the payment methods your customers can use. These same methods power both menu and cake orders — nothing is duplicated.
      </p>

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {methods.map((m) => {
            const Icon = ICONS[m.method] ?? Wallet;
            return (
              <div key={m.id} className="bg-white border border-brown/10 rounded-sm p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <Icon size={18} strokeWidth={1.75} className="text-caramel flex-shrink-0" />
                    <p className="font-display text-base text-brown">{m.label}</p>
                  </div>
                  <button
                    onClick={() => toggleEnabled(m)}
                    className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                      m.is_enabled ? "bg-teal text-cream" : "bg-brown/10 text-brown"
                    }`}
                  >
                    {m.is_enabled ? "Enabled" : "Disabled"}
                  </button>
                </div>

                {m.method === "mpesa_till" && (
                  <label className="block mb-3">
                    <span className="block text-xs font-medium text-brown/60 mb-1">Till Number</span>
                    <input
                      value={m.till_number ?? ""}
                      onChange={(e) => updateLocal(m.id, { till_number: e.target.value })}
                      className="input"
                      placeholder="e.g. 123456"
                    />
                  </label>
                )}

                {m.method === "mpesa_paybill" && (
                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    <label className="block">
                      <span className="block text-xs font-medium text-brown/60 mb-1">Paybill Number</span>
                      <input
                        value={m.paybill_number ?? ""}
                        onChange={(e) => updateLocal(m.id, { paybill_number: e.target.value })}
                        className="input"
                        placeholder="e.g. 400200"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-xs font-medium text-brown/60 mb-1">Account Number</span>
                      <input
                        value={m.paybill_account ?? ""}
                        onChange={(e) => updateLocal(m.id, { paybill_account: e.target.value })}
                        className="input"
                        placeholder="e.g. LASHEFA"
                      />
                    </label>
                  </div>
                )}

                {m.method === "mpesa_pochi" && (
                  <label className="block mb-3">
                    <span className="block text-xs font-medium text-brown/60 mb-1">Pochi la Biashara Number</span>
                    <input
                      value={m.pochi_number ?? ""}
                      onChange={(e) => updateLocal(m.id, { pochi_number: e.target.value })}
                      className="input"
                      placeholder="e.g. 0712 345 678"
                    />
                  </label>
                )}

                <label className="block mb-4">
                  <span className="block text-xs font-medium text-brown/60 mb-1">Customer instructions (optional)</span>
                  <textarea
                    value={m.instructions ?? ""}
                    onChange={(e) => updateLocal(m.id, { instructions: e.target.value })}
                    rows={2}
                    className="input"
                    placeholder="Shown to customers at checkout, e.g. 'Use your order number as the reference'"
                  />
                </label>

                <button onClick={() => saveDetails(m)} disabled={savingId === m.id} className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50">
                  {savingId === m.id ? "Saving…" : savedId === m.id ? "Saved" : "Save"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.55rem 0.75rem; background: white; color: #2C1409; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
