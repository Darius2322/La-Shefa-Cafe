"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StaffDashboardPage() {
  const [pendingOrders, setPendingOrders] = useState<number | null>(null);
  const [todaySales, setTodaySales] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [ordersRes, salesRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["received", "confirmed", "preparing"]),
        supabase.from("pos_sales").select("id", { count: "exact", head: true }).eq("status", "completed").gte("created_at", startOfDay.toISOString())
      ]);
      setPendingOrders(ordersRes.count ?? 0);
      setTodaySales(salesRes.count ?? 0);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-brown mb-8">Dashboard</h1>
      <div className="grid sm:grid-cols-2 gap-5">
        <Link href="/shefastaff/orders" className="bg-white border border-brown/10 rounded-sm p-5 hover:border-teal">
          <p className="text-sm text-brown/60 mb-1">Orders needing attention</p>
          <p className="font-display text-3xl text-brown">{pendingOrders ?? "…"}</p>
        </Link>
        <Link href="/shefastaff/pos" className="bg-white border border-brown/10 rounded-sm p-5 hover:border-teal">
          <p className="text-sm text-brown/60 mb-1">POS sales today</p>
          <p className="font-display text-3xl text-brown">{todaySales ?? "…"}</p>
        </Link>
      </div>
    </div>
  );
}
