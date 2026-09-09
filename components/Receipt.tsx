"use client";

import { useEffect } from "react";
import Image from "next/image";

export type ReceiptItem = { name: string; quantity: number; unit_price: number; line_total: number };

export type ReceiptData = {
  title: string; // "La Shefa Cafe" always
  documentLabel: string; // "Receipt" / "Order Receipt"
  number: string;
  date: string;
  cashierOrStaff?: string | null;
  customerName?: string | null;
  items: ReceiptItem[];
  subtotal: number;
  discount?: number;
  total: number;
  paymentMethod?: string | null;
  amountPaid?: number | null;
  changeDue?: number | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
};

export function Receipt({ data, autoPrint = false }: { data: ReceiptData; autoPrint?: boolean }) {
  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  return (
    <div className="min-h-screen bg-brown/5 py-8 print:bg-white print:py-0">
      <div className="max-w-sm mx-auto bg-white p-6 print:p-4 print:max-w-none print:mx-0 print:shadow-none shadow-sm">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <Image src="/logo.jpg" alt="" width={48} height={48} className="rounded-sm" />
          </div>
          <p className="font-display text-lg text-brown">{data.title}</p>
          {data.contactAddress && <p className="text-xs text-brown/60">{data.contactAddress}</p>}
          {data.contactPhone && <p className="text-xs text-brown/60">{data.contactPhone}</p>}
        </div>

        <div className="border-t border-b border-dashed border-brown/30 py-2 my-3 text-xs text-brown/70 space-y-0.5">
          <p>{data.documentLabel}: <span className="text-brown font-medium">{data.number}</span></p>
          <p>Date: {data.date}</p>
          {data.cashierOrStaff && <p>Served by: {data.cashierOrStaff}</p>}
          {data.customerName && <p>Customer: {data.customerName}</p>}
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

        <p className="text-center text-xs text-brown/50 mt-4">Thank you — eat quality, stay healthy.</p>

        <button
          onClick={() => window.print()}
          className="print:hidden mt-6 w-full bg-teal text-cream rounded-sm py-2 text-sm font-medium"
        >
          Print Receipt
        </button>
      </div>
    </div>
  );
}
