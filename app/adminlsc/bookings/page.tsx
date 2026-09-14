"use client";

import { useEffect, useState, Fragment } from "react";
import { Search, ChevronDown, ChevronUp, CalendarCheck } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [savingFlag, setSavingFlag] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data }, { data: flagRow }] = await Promise.all([
      supabase.from("bookings").select("*").order("booking_date", { ascending: true }).limit(100),
      supabase.from("site_settings").select("value").eq("key", "feature_flags").maybeSingle()
    ]);
    setBookings((data as Booking[]) ?? []);
    setBookingEnabled(flagRow?.value?.booking_enabled ?? true);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from("bookings").update({ status }).eq("id", id);
    load();
  }

  async function toggleBooking() {
    setSavingFlag(true);
    const next = !bookingEnabled;
    await supabase.from("site_settings").update({ value: { booking_enabled: next } }).eq("key", "feature_flags");
    setBookingEnabled(next);
    setSavingFlag(false);
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? bookings.filter((b) => [b.booking_number, b.customer_name, b.customer_phone].some((f) => f.toLowerCase().includes(q)))
    : bookings;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-display-md text-brown">Bookings</h1>
      </div>

      <div className="bg-white border border-brown/10 rounded-sm p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarCheck size={18} strokeWidth={1.75} className="text-caramel" />
          <div>
            <p className="text-brown font-medium text-sm">Online table booking</p>
            <p className="text-xs text-brown/60">{bookingEnabled ? "Visible to customers" : "Hidden from customers"}</p>
          </div>
        </div>
        <button
          onClick={toggleBooking}
          disabled={savingFlag}
          className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors disabled:opacity-50 ${
            bookingEnabled ? "bg-teal text-cream" : "bg-brown/10 text-brown"
          }`}
        >
          {bookingEnabled ? "Enabled" : "Disabled"}
        </button>
      </div>

      <div className="relative w-full sm:w-64 mb-6">
        <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search booking #, name, phone"
          className="border border-brown/20 rounded-sm pl-9 pr-3 py-2 text-sm bg-white w-full focus:border-teal transition-colors"
        />
      </div>

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-brown/50 text-sm">No bookings in this view.</p>
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
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <Fragment key={b.id}>
                  <tr
                    className="border-t border-brown/10 cursor-pointer hover:bg-cream/40 transition-colors"
                    onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                  >
                    <td className="p-3 text-teal font-medium whitespace-nowrap">{b.booking_number}</td>
                    <td className="p-3 text-brown">
                      <p>{b.customer_name}</p>
                      <p className="text-xs text-brown/50">{b.customer_phone}</p>
                    </td>
                    <td className="p-3 text-brown whitespace-nowrap">{b.booking_date} · {b.booking_time}</td>
                    <td className="p-3 text-brown">{b.party_size ?? "-"}</td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
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
                    <td className="p-3 text-right text-brown/40">
                      {expandedId === b.id ? <ChevronUp size={16} strokeWidth={1.75} /> : <ChevronDown size={16} strokeWidth={1.75} />}
                    </td>
                  </tr>
                  {expandedId === b.id && (
                    <tr className="bg-cream/50 border-t border-brown/5">
                      <td colSpan={6} className="p-4 text-sm text-brown/80">
                        {b.notes ? b.notes : <span className="text-brown/40 text-xs">No notes for this booking.</span>}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
