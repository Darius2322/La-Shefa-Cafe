"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from "recharts";

type DayPoint = { date: string; revenue: number; orders: number };
type ProductStat = { name: string; quantity: number };

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [revenueByDay, setRevenueByDay] = useState<DayPoint[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [totals, setTotals] = useState({ orders: 0, revenue: 0, customers: 0, avgOrder: 0 });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - 13);
      since.setHours(0, 0, 0, 0);

      const [{ data: orders }, { data: items }, { data: customers }] = await Promise.all([
        supabase
          .from("orders")
          .select("created_at, total")
          .gte("created_at", since.toISOString())
          .neq("status", "cancelled"),
        supabase
          .from("order_items")
          .select("product_name, quantity, orders!inner(created_at, status)")
          .gte("orders.created_at", since.toISOString())
          .neq("orders.status", "cancelled"),
        supabase.from("customers").select("id", { count: "exact", head: true })
      ]);

      // Build a 14-day series with real zero-filled days (no fake data — just honest buckets).
      const dayMap = new Map<string, DayPoint>();
      for (let i = 0; i < 14; i++) {
        const d = new Date(since);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        dayMap.set(key, { date: key.slice(5), revenue: 0, orders: 0 });
      }
      (orders ?? []).forEach((o: any) => {
        const key = o.created_at.slice(0, 10);
        const bucket = dayMap.get(key);
        if (bucket) {
          bucket.revenue += Number(o.total);
          bucket.orders += 1;
        }
      });
      setRevenueByDay(Array.from(dayMap.values()));

      const productMap = new Map<string, number>();
      (items ?? []).forEach((it: any) => {
        productMap.set(it.product_name, (productMap.get(it.product_name) ?? 0) + it.quantity);
      });
      const sortedProducts = Array.from(productMap.entries())
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8);
      setTopProducts(sortedProducts);

      const totalOrders = (orders ?? []).length;
      const totalRevenue = (orders ?? []).reduce((s: number, o: any) => s + Number(o.total), 0);

      setTotals({
        orders: totalOrders,
        revenue: totalRevenue,
        customers: customers?.length ?? 0,
        avgOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0
      });

      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-brown/50 text-sm">Loading…</p>;

  const hasAnyOrders = totals.orders > 0;

  return (
    <div>
      <h1 className="font-display text-3xl text-brown mb-2">Analytics</h1>
      <p className="text-sm text-brown/50 mb-8">Last 14 days, based on actual orders in the database.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Orders (14d)" value={totals.orders} />
        <StatCard label="Revenue (14d)" value={`KSh ${totals.revenue.toLocaleString()}`} />
        <StatCard label="Avg. Order Value" value={`KSh ${Math.round(totals.avgOrder).toLocaleString()}`} />
        <StatCard label="Total Customers" value={totals.customers} />
      </div>

      {!hasAnyOrders ? (
        <div className="border border-dashed border-brown/25 rounded-sm p-10 text-center">
          <p className="font-display text-xl text-brown mb-2">No order data yet</p>
          <p className="text-brown/60 text-sm">Charts will populate as real orders come in.</p>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="bg-white border border-brown/10 rounded-sm p-5">
            <h2 className="font-display text-lg text-brown mb-4">Revenue by Day</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,29,13,0.1)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#2C1409" }} />
                <YAxis tick={{ fontSize: 12, fill: "#2C1409" }} />
                <Tooltip formatter={(v: number) => `KSh ${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#194850" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-brown/10 rounded-sm p-5">
            <h2 className="font-display text-lg text-brown mb-4">Orders by Day</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,29,13,0.1)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#2C1409" }} />
                <YAxis tick={{ fontSize: 12, fill: "#2C1409" }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="orders" fill="#CB9D6C" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {topProducts.length > 0 && (
            <div className="bg-white border border-brown/10 rounded-sm p-5">
              <h2 className="font-display text-lg text-brown mb-4">Top Products (by quantity sold)</h2>
              <ResponsiveContainer width="100%" height={Math.max(200, topProducts.length * 40)}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,29,13,0.1)" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#2C1409" }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#2C1409" }} width={120} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#194850" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-brown/10 rounded-sm p-5">
      <p className="text-sm text-brown/60 mb-1">{label}</p>
      <p className="font-display text-2xl text-brown">{value}</p>
    </div>
  );
}
