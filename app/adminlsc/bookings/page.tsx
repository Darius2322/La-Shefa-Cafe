"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STATUSES = ["pending", "confirmed", "cancelled", "completed"];

type Booking = {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_phone: string;
  party_size: number | null;
  booking_date: string;
  booking_time: string;
  notes: string | null;
  status: string;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: true })
      .limit(100);
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from("bookings").update({ status }).eq("id", id);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-brown mb-6">Bookings</h1>
      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="text-brown/50 text-sm">No bookings yet.</p>
      ) : (
        <div className="bg-white border border-brown/10 rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-cream text-brown/60 text-left">
              <tr>
                <th className="p-3 font-medium">Booking #</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Date / Time</th>
                <th className="p-3 font-medium">Party</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-brown/10">
                  <td className="p-3 text-teal font-medium whitespace-nowrap">{b.booking_number}</td>
                  <td className="p-3 text-brown">
                    <p>{b.customer_name}</p>
                    <p className="text-xs text-brown/50">{b.customer_phone}</p>
                  </td>
                  <td className="p-3 text-brown whitespace-nowrap">{b.booking_date} · {b.booking_time}</td>
                  <td className="p-3 text-brown">{b.party_size ?? "-"}</td>
                  <td className="p-3">
                    <select
                      value={b.status}
                      onChange={(e) => updateStatus(b.id, e.target.value)}
                      className="border border-brown/20 rounded-sm text-xs px-2 py-1 bg-white capitalize"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
