export const CAKE_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "collected",
  "delivered",
  "completed",
  "cancelled"
] as const;

export const CAKE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-100 text-blue-800 border-blue-300",
  confirmed: "bg-teal/20 text-teal-dark border-teal/50",
  preparing: "bg-amber-100 text-amber-800 border-amber-300",
  ready: "bg-purple-100 text-purple-800 border-purple-300",
  collected: "bg-cyan-100 text-cyan-800 border-cyan-300",
  delivered: "bg-cyan-100 text-cyan-800 border-cyan-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300"
};
