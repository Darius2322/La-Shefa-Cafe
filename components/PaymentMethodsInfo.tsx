"use client";

import { useEffect, useState } from "react";
import { Smartphone, Banknote, CreditCard, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PaymentMethod = {
  method: string;
  label: string;
  till_number: string | null;
  paybill_number: string | null;
  paybill_account: string | null;
  pochi_number: string | null;
  instructions: string | null;
};

const ICONS: Record<string, any> = {
  mpesa_till: Smartphone,
  mpesa_paybill: Smartphone,
  mpesa_pochi: Smartphone,
  cash: Banknote,
  card: CreditCard,
  other: Wallet
};

/**
 * Reads the same payment_methods rows the admin configures under
 * Payment Settings, so menu orders and cake orders never duplicate or
 * hardcode payment details — one source of truth. Renders nothing (not
 * even a heading) if the table doesn't exist yet or nothing is enabled,
 * so it degrades invisibly rather than showing a broken section.
 */
export function PaymentMethodsInfo({ title = "How to Pay" }: { title?: string }) {
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);

  useEffect(() => {
    supabase
      .from("payment_methods")
      .select("method, label, till_number, paybill_number, paybill_account, pochi_number, instructions")
      .eq("is_enabled", true)
      .order("sort_order")
      .then(({ data, error }) => {
        setMethods(error ? [] : (data as PaymentMethod[]) ?? []);
      });
  }, []);

  if (!methods || methods.length === 0) return null;

  return (
    <div className="border border-brown/15 rounded-sm p-5">
      <p className="font-display text-base sm:text-lg text-brown mb-3">{title}</p>
      <div className="space-y-3">
        {methods.map((m) => {
          const Icon = ICONS[m.method] ?? Wallet;
          return (
            <div key={m.method} className="flex items-start gap-2.5">
              <Icon size={16} strokeWidth={1.75} className="text-caramel flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-brown font-medium">{m.label}</p>
                {m.method === "mpesa_till" && m.till_number && (
                  <p className="text-brown/70">Till Number: <span className="font-medium">{m.till_number}</span></p>
                )}
                {m.method === "mpesa_paybill" && m.paybill_number && (
                  <p className="text-brown/70">
                    Paybill: <span className="font-medium">{m.paybill_number}</span>
                    {m.paybill_account && <> · Account: <span className="font-medium">{m.paybill_account}</span></>}
                  </p>
                )}
                {m.method === "mpesa_pochi" && m.pochi_number && (
                  <p className="text-brown/70">Send to: <span className="font-medium">{m.pochi_number}</span></p>
                )}
                {m.instructions && <p className="text-brown/50 text-xs mt-0.5">{m.instructions}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
