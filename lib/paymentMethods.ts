import { supabase } from "./supabase";

export async function getFormattedPaymentMethods(): Promise<{ label: string; detail: string }[]> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("method, label, till_number, paybill_number, paybill_account, pochi_number")
    .eq("is_enabled", true)
    .order("sort_order");

  if (error || !data) return [];

  return data
    .map((m: any) => {
      if (m.method === "mpesa_till" && m.till_number) return { label: m.label, detail: `Till ${m.till_number}` };
      if (m.method === "mpesa_paybill" && m.paybill_number) {
        return {
          label: m.label,
          detail: `Paybill ${m.paybill_number}${m.paybill_account ? `, Account ${m.paybill_account}` : ""}`
        };
      }
      if (m.method === "mpesa_pochi" && m.pochi_number) return { label: m.label, detail: m.pochi_number };
      if (m.method === "cash") return { label: m.label, detail: "Pay on collection/delivery" };
      if (m.method === "card") return { label: m.label, detail: "Available at the till" };
      return null;
    })
    .filter((m): m is { label: string; detail: string } => m !== null);
}
