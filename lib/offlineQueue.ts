export type QueuedSale = {
  idempotencyKey: string;
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number | null;
  changeDue: number;
  paymentMethod: string;
  queuedAt: string;
  lines: { product_id: string; name: string; unit_price: number; quantity: number }[];
};

const STORAGE_KEY = "lsc_pos_offline_queue_v1";

export function getQueuedSales(): QueuedSale[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function queueSale(sale: QueuedSale) {
  const current = getQueuedSales();
  current.push(sale);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function removeQueuedSale(idempotencyKey: string) {
  const current = getQueuedSales().filter((s) => s.idempotencyKey !== idempotencyKey);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}
