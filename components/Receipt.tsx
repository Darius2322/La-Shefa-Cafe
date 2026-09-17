"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Printer, Download, Share2 } from "lucide-react";
import { QrCode } from "./QrCode";

export type ReceiptItem = { name: string; quantity: number; unit_price: number; line_total: number };

export type ReceiptData = {
  title: string; // "La Shefa Cafe" always
  documentLabel: string; // "Receipt" / "Order Receipt"
  number: string;
  date: string;
  cashierOrStaff?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  items: ReceiptItem[];
  subtotal: number;
  discount?: number;
  total: number;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  amountPaid?: number | null;
  changeDue?: number | null;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  contactEmail?: string | null;
  contactAddress?: string | null;
  website?: string | null;
  /** Full tracking URL, if this receipt is for an online order with a
   * tracking_token — renders a scannable QR code. Omit for POS/walk-in
   * sales, which have no customer-facing tracking page. */
  trackingUrl?: string | null;
  /** When this receipt document was generated/printed — distinct from the
   * original sale/order date, which is `date` above. */
  generatedAt?: string | null;
  /** Configured payment methods to show when money is still owed (unpaid/
   * partial) — pulled from the same payment_methods table the admin
   * configures under Payment Settings, so this is never hardcoded. */
  paymentInstructions?: { label: string; detail: string }[];
};

export type ReceiptWidth = "screen" | "58mm" | "80mm";

const THERMAL_PAGE_CSS: Record<ReceiptWidth, string> = {
  screen: "",
  "58mm": "@page { size: 58mm auto; margin: 2mm; } @media print { .receipt-paper { width: 54mm !important; font-size: 10px; } }",
  "80mm": "@page { size: 80mm auto; margin: 3mm; } @media print { .receipt-paper { width: 74mm !important; font-size: 11px; } }"
};

export function Receipt({
  data,
  autoPrint = false,
  width: initialWidth = "screen"
}: {
  data: ReceiptData;
  autoPrint?: boolean;
  width?: ReceiptWidth;
}) {
  const [width, setWidth] = useState<ReceiptWidth>(initialWidth);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  async function handleShare() {
    const text = `${data.title} — ${data.documentLabel} ${data.number}\nTotal: KSh ${data.total.toLocaleString()}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${data.documentLabel} ${data.number}`, text, url: window.location.href });
      } catch {
        // cancelled — nothing to do
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      setSharing(true);
      setTimeout(() => setSharing(false), 1800);
    }
  }

  function handleDownload() {
    // No extra PDF/image library — printing to "Save as PDF" is the
    // universally supported, dependency-free way to get a downloadable copy
    // from any browser, on desktop or mobile.
    window.print();
  }

  return (
    <div className="min-h-screen bg-brown/5 py-8 print:bg-white print:py-0">
      {THERMAL_PAGE_CSS[width] && <style>{THERMAL_PAGE_CSS[width]}</style>}

      <div className="print:hidden max-w-sm mx-auto mb-3 flex items-center justify-center gap-1.5">
        {(["screen", "58mm", "80mm"] as const).map((w) => (
          <button
            key={w}
            onClick={() => setWidth(w)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
              width === w ? "bg-teal text-cream border-teal" : "border-brown/20 text-brown/60"
            }`}
          >
            {w === "screen" ? "Screen" : w}
          </button>
        ))}
      </div>

      <div className="receipt-paper max-w-sm mx-auto bg-white p-6 print:p-4 print:max-w-none print:mx-0 print:shadow-none shadow-sm">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <Image src="/logo.jpg" alt="" width={48} height={48} className="rounded-sm" />
          </div>
          <p className="font-display text-lg text-brown">{data.title}</p>
          {data.contactAddress && <p className="text-xs text-brown/60">{data.contactAddress}</p>}
          {data.contactPhone && <p className="text-xs text-brown/60">Tel: {data.contactPhone}</p>}
          {data.contactWhatsapp && <p className="text-xs text-brown/60">WhatsApp: {data.contactWhatsapp}</p>}
          {data.contactEmail && <p className="text-xs text-brown/60">{data.contactEmail}</p>}
          {data.website && <p className="text-xs text-brown/60">{data.website}</p>}
        </div>

        <div className="border-t border-b border-dashed border-brown/30 py-2 my-3 text-xs text-brown/70 space-y-0.5">
          <p>{data.documentLabel}: <span className="text-brown font-medium">{data.number}</span></p>
          <p>Date: {data.date}</p>
          {data.cashierOrStaff && <p>Served by: {data.cashierOrStaff}</p>}
          {data.customerName && <p>Customer: {data.customerName}</p>}
          {data.customerPhone && <p>Phone: {data.customerPhone}</p>}
        </div>

        <table className="w-full text-xs mb-3">
          <thead>
            <tr className="text-brown/60 text-left">
              <th className="pb-1 font-medium">Item</th>
              <th className="pb-1 font-medium text-center">Qty</th>
              <th className="pb-1 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it, i) => (
              <tr key={i} className="text-brown">
                <td className="py-0.5">{it.name}</td>
                <td className="py-0.5 text-center">{it.quantity}</td>
                <td className="py-0.5 text-right">{it.line_total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-brown/30 pt-2 text-xs space-y-1">
          <div className="flex justify-between text-brown/70">
            <span>Subtotal</span>
            <span>KSh {data.subtotal.toLocaleString()}</span>
          </div>
          {!!data.discount && (
            <div className="flex justify-between text-brown/70">
              <span>Discount</span>
              <span>-KSh {data.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-brown font-semibold text-sm">
            <span>Total</span>
            <span>KSh {data.total.toLocaleString()}</span>
          </div>
          {data.paymentMethod && (
            <div className="flex justify-between text-brown/70 capitalize">
              <span>Payment</span>
              <span>{data.paymentMethod}</span>
            </div>
          )}
          {data.paymentReference && (
            <div className="flex justify-between text-brown/70">
              <span>Ref</span>
              <span>{data.paymentReference}</span>
            </div>
          )}
          {data.amountPaid != null && (
            <div className="flex justify-between text-brown/70">
              <span>Paid</span>
              <span>KSh {data.amountPaid.toLocaleString()}</span>
            </div>
          )}
          {!!data.changeDue && (
            <div className="flex justify-between text-brown/70">
              <span>Change</span>
              <span>KSh {data.changeDue.toLocaleString()}</span>
            </div>
          )}
        </div>

        {data.paymentInstructions && data.paymentInstructions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-dashed border-brown/30 print:break-inside-avoid">
            <p className="text-xs font-semibold text-brown/60 mb-1.5 uppercase tracking-wide">Complete Your Payment</p>
            {data.paymentInstructions.map((m, i) => (
              <p key={i} className="text-xs text-brown/70">
                <span className="font-medium text-brown">{m.label}:</span> {m.detail}
              </p>
            ))}
          </div>
        )}

        {data.trackingUrl && (
          <div className="flex flex-col items-center gap-1 mt-4 pt-4 border-t border-dashed border-brown/30 print:break-inside-avoid">
            <QrCode value={data.trackingUrl} size={88} />
            <p className="text-[10px] text-brown/50">Scan to track this order</p>
          </div>
        )}

        <p className="text-center text-xs text-brown/50 mt-4">Thank you — eat quality, stay healthy.</p>
        {data.generatedAt && (
          <p className="text-center text-[10px] text-brown/35 mt-1">Receipt generated on {data.generatedAt}</p>
        )}

        <div className="print:hidden mt-6 grid grid-cols-3 gap-2">
          <button
            onClick={() => window.print()}
            className="bg-teal text-cream rounded-sm py-2 text-xs font-medium inline-flex items-center justify-center gap-1.5"
          >
            <Printer size={14} strokeWidth={1.75} />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="border border-brown/20 text-brown rounded-sm py-2 text-xs font-medium inline-flex items-center justify-center gap-1.5"
          >
            <Download size={14} strokeWidth={1.75} />
            Download
          </button>
          <button
            onClick={handleShare}
            className="border border-brown/20 text-brown rounded-sm py-2 text-xs font-medium inline-flex items-center justify-center gap-1.5"
          >
            <Share2 size={14} strokeWidth={1.75} />
            {sharing ? "Copied" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
