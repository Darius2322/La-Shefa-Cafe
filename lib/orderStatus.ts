export const ORDER_STATUSES = [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled"
] as const;

export const PAYMENT_STATUSES = ["unpaid", "paid", "partial", "refunded"] as const;

// Muted, on-brand-adjacent colors — distinct enough to scan quickly, not
// loud. Every status is always paired with its text label wherever these
// are used, so color is a scanning aid, never the only signal.
export const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-50 text-blue-700 border-blue-200",
  confirmed: "bg-teal/10 text-teal border-teal/30",
  preparing: "bg-amber-50 text-amber-700 border-amber-200",
  ready: "bg-purple-50 text-purple-700 border-purple-200",
  out_for_delivery: "bg-cyan-50 text-cyan-700 border-cyan-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200"
};

export const STATUS_DOT_COLORS: Record<string, string> = {
  received: "bg-blue-500",
  confirmed: "bg-teal",
  preparing: "bg-amber-500",
  ready: "bg-purple-500",
  out_for_delivery: "bg-cyan-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500"
};

export const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "bg-red-50 text-red-700 border-red-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  refunded: "bg-brown/10 text-brown border-brown/20"
};

export function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}
