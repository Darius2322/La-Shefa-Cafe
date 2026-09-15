import { ORDER_STATUSES, STATUS_DOT_COLORS, statusLabel } from "@/lib/orderStatus";

export function StatusLegend({ statuses = ORDER_STATUSES as readonly string[] }: { statuses?: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {statuses.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5 text-xs text-brown/60">
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${STATUS_DOT_COLORS[s] ?? "bg-brown/30"}`} />
          <span className="capitalize">{statusLabel(s)}</span>
        </span>
      ))}
    </div>
  );
}
