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

// Bolder, more saturated than a typical muted badge — these need to be
// scannable at a glance across a busy list, so a light pastel tint reads as
// too subtle. Text is always paired with color (never color-only), and
// still readable on the corresponding tinted background.
export const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-100 text-blue-800 border-blue-300",
  confirmed: "bg-teal/20 text-teal-dark border-teal/50",
  preparing: "bg-amber-100 text-amber-800 border-amber-300",
  ready: "bg-purple-100 text-purple-800 border-purple-300",
  out_for_delivery: "bg-cyan-100 text-cyan-800 border-cyan-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300"
};

export const STATUS_DOT_COLORS: Record<string, string> = {
  received: "bg-blue-600",
  confirmed: "bg-teal",
  preparing: "bg-amber-600",
  ready: "bg-purple-600",
  out_for_delivery: "bg-cyan-600",
  completed: "bg-green-600",
  cancelled: "bg-red-600"
};

export const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "bg-red-100 text-red-800 border-red-300",
  paid: "bg-green-100 text-green-800 border-green-300",
  partial: "bg-amber-100 text-amber-800 border-amber-300",
  refunded: "bg-brown/15 text-brown border-brown/30"
};

export function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}
