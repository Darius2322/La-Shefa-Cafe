"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Stats = {
  todayOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  pendingReviews: number;
  pendingBookings: number;
  pendingCakes: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [todayOrdersRes, pendingOrdersRes, reviewsRes, bookingsRes, cakesRes] =
        await Promise.all([
          supabase.from("orders").select("total, created_at").gte("created_at", startOfDay.toISOString()),
          supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["received", "confirmed", "preparing"]),
          supabase.from("reviews").select("id", { count: "exact", head: true }).eq("is_approved", false),
          supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("cake_requests").select("id", { count: "exact", head: true }).eq("status", "pending")
        ]);

      const todayOrders = todayOrdersRes.data?.length ?? 0;
      const todayRevenue = (todayOrdersRes.data ?? []).reduce((sum, o: any) => sum + Number(o.total), 0);

      setStats({
        todayOrders,
        todayRevenue,
        pendingOrders: pendingOrdersRes.count ?? 0,
        pendingReviews: reviewsRes.count ?? 0,
        pendingBookings: bookingsRes.count ?? 0,
        pendingCakes: cakesRes.count ?? 0
      });
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-brown mb-8">Dashboard</h1>

      {!stats ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard label="Orders Today" value={stats.todayOrders} />
          <StatCard label="Revenue Today" value={`KSh ${stats.todayRevenue.toLocaleString()}`} />
          <StatCard label="Pending Orders" value={stats.pendingOrders} href="/adminlsc/orders" />
          <StatCard label="Pending Reviews" value={stats.pendingReviews} href="/adminlsc/reviews" />
          <StatCard label="Pending Bookings" value={stats.pendingBookings} href="/adminlsc/bookings" />
          <StatCard label="Pending Cake Requests" value={stats.pendingCakes} href="/adminlsc/cakes" />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const content = (
    <div className="bg-white border border-brown/10 rounded-sm p-5 hover:border-teal transition-colors">
      <p className="text-sm text-brown/60 mb-1">{label}</p>
      <p className="font-display text-3xl text-brown">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
