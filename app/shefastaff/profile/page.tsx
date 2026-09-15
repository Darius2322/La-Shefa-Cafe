"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, Shield, Clock3, Receipt as ReceiptIcon, CalendarDays } from "lucide-react";
import { supabase } from "@/lib/supabase";

type StaffMember = {
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  last_active_at?: string | null;
};

function relativeTime(iso: string | null | undefined) {
  if (!iso) return "No activity recorded yet";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function StaffProfilePage() {
  const [me, setMe] = useState<StaffMember | null>(null);
  const [lastSale, setLastSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }
      const { data: s } = await supabase
        .from("staff")
        .select("id, full_name, email, phone, role, created_at, last_active_at")
        .eq("auth_user_id", auth.user.id)
        .maybeSingle();
      setMe(s);

      if (s) {
        // Best-effort, same caveat as elsewhere: exact cashier-column name
        // on pos_sales isn't confirmed from this codebase.
        const { data: sales } = await supabase
          .from("pos_sales")
          .select("*")
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(50);
        const mine = (sales ?? []).find((sale: any) => (sale.cashier_id ?? sale.staff_id ?? sale.created_by) === s.id);
        setLastSale(mine ?? null);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-brown/50 text-sm">Loading…</p>;
  if (!me) return <p className="text-brown/50 text-sm">Profile not found.</p>;

  return (
    <div>
      <h1 className="font-display text-display-md text-brown mb-2">My Profile</h1>
      <p className="text-sm text-brown/60 capitalize mb-6">{me.role} · La Shefa Cafe</p>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
        <div className="bg-white border border-brown/10 rounded-sm p-4">
          <p className="text-xs text-brown/50 flex items-center gap-1.5 mb-1"><Mail size={13} strokeWidth={1.75} />Email</p>
          <p className="text-sm text-brown">{me.email}</p>
        </div>
        <div className="bg-white border border-brown/10 rounded-sm p-4">
          <p className="text-xs text-brown/50 flex items-center gap-1.5 mb-1"><Phone size={13} strokeWidth={1.75} />Phone</p>
          <p className="text-sm text-brown">{me.phone || "—"}</p>
        </div>
        <div className="bg-white border border-brown/10 rounded-sm p-4">
          <p className="text-xs text-brown/50 flex items-center gap-1.5 mb-1"><Shield size={13} strokeWidth={1.75} />Role</p>
          <p className="text-sm text-brown capitalize">{me.role}</p>
        </div>
        <div className="bg-white border border-brown/10 rounded-sm p-4">
          <p className="text-xs text-brown/50 flex items-center gap-1.5 mb-1"><Clock3 size={13} strokeWidth={1.75} />Last active</p>
          <p className="text-sm text-brown">{relativeTime(me.last_active_at)}</p>
        </div>
        <div className="bg-white border border-brown/10 rounded-sm p-4">
          <p className="text-xs text-brown/50 flex items-center gap-1.5 mb-1"><CalendarDays size={13} strokeWidth={1.75} />Staff since</p>
          <p className="text-sm text-brown">{new Date(me.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
        </div>
        <div className="bg-white border border-brown/10 rounded-sm p-4">
          <p className="text-xs text-brown/50 flex items-center gap-1.5 mb-1"><ReceiptIcon size={13} strokeWidth={1.75} />Last sale</p>
          {lastSale ? (
            <p className="text-sm text-brown">
              {lastSale.sale_number} · KSh {Number(lastSale.total).toLocaleString()}
              <span className="block text-xs text-brown/50">{relativeTime(lastSale.created_at)}</span>
            </p>
          ) : (
            <p className="text-sm text-brown/40">No sales yet</p>
          )}
        </div>
      </div>

      <p className="text-xs text-brown/40 mt-6">
        Need to update your details or permissions? Ask an admin — staff can't edit their own role or permissions.
      </p>
    </div>
  );
}
