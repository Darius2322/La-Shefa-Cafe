"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Hourglass, ShoppingBag, ClipboardList } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function StaffDashboardPage() {
  const [pendingOrders, setPendingOrders] = useState<number | null>(null);
  const [todaySales, setTodaySales] = useState<number | null>(null);
  const [assignedOrders, setAssignedOrders] = useState<number | null>(null);
  const [me, setMe] = useState<{ id: string; full_name: string; role: string } | null>(null);

  useEffect(() => {
    async function load() {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: auth } = await supabase.auth.getUser();
      let staffRow: { id: string; full_name: string; role: string } | null = null;
      if (auth.user) {
        const { data: s } = await supabase
          .from("staff")
          .select("id, full_name, role")
          .eq("auth_user_id", auth.user.id)
          .maybeSingle();
        staffRow = s;
        setMe(s);
      }

      const [ordersRes, salesRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["received", "confirmed", "preparing"]),
        supabase.from("pos_sales").select("id", { count: "exact", head: true }).eq("status", "completed").gte("created_at", startOfDay.toISOString())
      ]);
      setPendingOrders(ordersRes.count ?? 0);
      setTodaySales(salesRes.count ?? 0);

      // Best-effort: assigned_staff_id only exists once migrations/002 has
      // been run. select("*") with a count avoids erroring pre-migration —
      // actually count needs a column filter, so this is wrapped instead.
      if (staffRow) {
        try {
          const { count, error } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("assigned_staff_id", staffRow.id)
            .in("status", ["received", "confirmed", "preparing", "ready"]);
          setAssignedOrders(error ? null : count ?? 0);
        } catch {
          setAssignedOrders(null);
        }
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-display-md text-brown mb-1">Dashboard</h1>
      {me && (
        <p className="text-sm text-brown/60 mb-8">
          Welcome back, {me.full_name.split(" ")[0]} · <span className="capitalize">{me.role}</span> · La Shefa Cafe
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <Link href="/shefastaff/orders" className="bg-white border border-brown/10 rounded-sm p-4 sm:p-5 hover:border-teal transition-colors card-hover">
          <Hourglass size={18} strokeWidth={1.75} className="text-caramel mb-2" />
          <p className="text-xs sm:text-sm text-brown/60 mb-1">Orders needing attention</p>
          <p className="font-display text-xl sm:text-3xl text-brown">{pendingOrders ?? "…"}</p>
        </Link>
        {assignedOrders != null && (
          <Link href="/shefastaff/orders" className="bg-white border border-brown/10 rounded-sm p-4 sm:p-5 hover:border-teal transition-colors card-hover">
            <ClipboardList size={18} strokeWidth={1.75} className="text-caramel mb-2" />
            <p className="text-xs sm:text-sm text-brown/60 mb-1">Assigned to me</p>
            <p className="font-display text-xl sm:text-3xl text-brown">{assignedOrders}</p>
          </Link>
        )}
        <Link href="/shefastaff/pos" className="bg-white border border-brown/10 rounded-sm p-4 sm:p-5 hover:border-teal transition-colors card-hover">
          <ShoppingBag size={18} strokeWidth={1.75} className="text-caramel mb-2" />
          <p className="text-xs sm:text-sm text-brown/60 mb-1">POS sales today</p>
          <p className="font-display text-xl sm:text-3xl text-brown">{todaySales ?? "…"}</p>
        </Link>
      </div>
    </div>
  );
}
