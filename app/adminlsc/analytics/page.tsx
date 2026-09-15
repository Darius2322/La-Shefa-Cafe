"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const RANGES = ["today", "yesterday", "week", "month", "custom"] as const;
type Range = (typeof RANGES)[number];

function rangeBounds(range: Range, customFrom: string, customTo: string): { start: Date; end: Date } {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (range === "yesterday") {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (range === "week") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    return { start, end: now };
  }
  if (range === "month") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(1);
    return { start, end: now };
  }
  // custom
  const start = customFrom ? new Date(customFrom + "T00:00:00") : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = customTo ? new Date(customTo + "T23:59:59") : now;
  return { start, end };
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<Range>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [revenueByDay, setRevenueByDay] = useState<DayPoint[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [totals, setTotals] = useState({ orders: 0, revenue: 0, customers: 0, avgOrder: 0 });
  const [paymentBreakdown, setPaymentBreakdown] = useState<{ label: string; count: number; total: number }[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<{ id: string; name: string; count: number; total: number }[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { start, end } = rangeBounds(range, customFrom, customTo);

      const [{ data: orders }, { data: items }, { data: customers }, { data: posSales }, { data: staffRows }] = await Promise.all([
        supabase
          .from("orders")
          .select("created_at, total, payment_status")
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString())
          .neq("status", "cancelled"),
        supabase
          .from("order_items")
          .select("product_name, quantity, orders!inner(created_at, status)")
          .gte("orders.created_at", start.toISOString())
          .lte("orders.created_at", end.toISOString())
          .neq("orders.status", "cancelled"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase
          .from("pos_sales")
          .select("*")
          .eq("status", "completed")
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString()),
        supabase.from("staff").select("id, full_name")
      ]);

      // Day buckets across the selected range (inclusive), zero-filled —
      // real gaps, never fabricated data.
      const dayMap = new Map<string, DayPoint>();
      const cursor = new Date(start);
      cursor.setHours(0, 0, 0, 0);
      const endDay = new Date(end);
      endDay.setHours(0, 0, 0, 0);
      while (cursor <= endDay) {
        const key = cursor.toISOString().slice(0, 10);
        dayMap.set(key, { date: key.slice(5), revenue: 0, orders: 0 });
        cursor.setDate(cursor.getDate() + 1);
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
      setTopProducts(
        Array.from(productMap.entries())
          .map(([name, quantity]) => ({ name, quantity }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 8)
      );

      const totalOrders = (orders ?? []).length;
      const totalRevenue = (orders ?? []).reduce((s: number, o: any) => s + Number(o.total), 0);
      setTotals({
        orders: totalOrders,
        revenue: totalRevenue,
        customers: customers?.length ?? 0,
        avgOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0
      });

      // Payment breakdown: POS sales by their actual payment_method, plus
      // online orders grouped by payment_status (orders don't carry a
      // payment method field in this schema, so status is the honest thing
      // to show rather than inventing a method).
      const posByMethod = new Map<string, { count: number; total: number }>();
      (posSales ?? []).forEach((s: any) => {
        const key = s.payment_method || "unspecified";
        const cur = posByMethod.get(key) ?? { count: 0, total: 0 };
        cur.count++;
        cur.total += Number(s.total);
        posByMethod.set(key, cur);
      });
      const orderByStatus = new Map<string, { count: number; total: number }>();
      (orders ?? []).forEach((o: any) => {
        const key = `Online — ${o.payment_status || "unspecified"}`;
        const cur = orderByStatus.get(key) ?? { count: 0, total: 0 };
        cur.count++;
        cur.total += Number(o.total);
        orderByStatus.set(key, cur);
      });
      const breakdown = [
        ...Array.from(posByMethod.entries()).map(([label, v]) => ({ label: `POS — ${label}`, ...v })),
        ...Array.from(orderByStatus.entries()).map(([label, v]) => ({ label, ...v }))
      ].sort((a, b) => b.total - a.total);
      setPaymentBreakdown(breakdown);

      // Staff performance: best-effort attribution, same caveat as the
      // Sales page — pos_sales doesn't have a confirmed cashier-column name
      // visible from this codebase.
      const staffMap = Object.fromEntries((staffRows ?? []).map((s: any) => [s.id, s.full_name]));
      const perf = new Map<string, { count: number; total: number }>();
      (posSales ?? []).forEach((s: any) => {
        const staffId = s.cashier_id ?? s.staff_id ?? s.created_by;
        if (!staffId) return;
        const cur = perf.get(staffId) ?? { count: 0, total: 0 };
        cur.count++;
        cur.total += Number(s.total);
        perf.set(staffId, cur);
      });
      setStaffPerformance(
        Array.from(perf.entries())
          .map(([id, v]) => ({ id, name: staffMap[id] ?? "Unknown staff", ...v }))
          .sort((a, b) => b.total - a.total)
      );

      setLoading(false);
    }
    load();
  }, [range, customFrom, customTo]);

  const hasAnyOrders = totals.orders > 0;

  return (
    <div>
      <h1 className="font-display text-display-md text-brown mb-2">Analytics</h1>
      <p className="text-sm text-brown/50 mb-6">Based on actual orders and sales in the database.</p>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-full text-xs capitalize border transition-colors ${
              range === r ? "bg-teal text-cream border-teal" : "border-brown/20 text-brown hover:border-teal"
            }`}
          >
            {r === "week" ? "This week" : r === "month" ? "This month" : r}
          </button>
        ))}
        {range === "custom" && (
          <>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="border border-brown/20 rounded-sm px-2 py-1.5 text-xs bg-white" />
            <span className="text-brown/40 text-xs">to</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="border border-brown/20 rounded-sm px-2 py-1.5 text-xs bg-white" />
          </>
        )}
      </div>

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard label="Orders" value={totals.orders} />
            <StatCard label="Revenue" value={`KSh ${totals.revenue.toLocaleString()}`} />
            <StatCard label="Avg. Order Value" value={`KSh ${Math.round(totals.avgOrder).toLocaleString()}`} />
            <StatCard label="Total Customers" value={totals.customers} />
          </div>

          {!hasAnyOrders ? (
            <div className="border border-dashed border-brown/25 rounded-sm p-10 text-center">
              <p className="font-display text-xl text-brown mb-2">No order data in this period</p>
              <p className="text-brown/60 text-sm">Try a different date range, or check back as orders come in.</p>
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

              <div className="grid lg:grid-cols-2 gap-10">
                {topProducts.length > 0 && (
                  <div className="bg-white border border-brown/10 rounded-sm p-5">
                    <h2 className="font-display text-lg text-brown mb-4">Top Products</h2>
                    <ResponsiveContainer width="100%" height={Math.max(200, topProducts.length * 36)}>
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

                <div className="bg-white border border-brown/10 rounded-sm p-5">
                  <h2 className="font-display text-lg text-brown mb-4">Payment Breakdown</h2>
                  {paymentBreakdown.length === 0 ? (
                    <p className="text-brown/50 text-sm">No payment data in this period.</p>
                  ) : (
                    <div className="space-y-2">
                      {paymentBreakdown.map((p) => (
                        <div key={p.label} className="flex items-center justify-between text-sm border-b border-brown/5 pb-2">
                          <span className="text-brown capitalize">{p.label.replace(/_/g, " ")}</span>
                          <span className="text-brown/50 text-xs">{p.count} txns</span>
                          <span className="text-brown font-medium">KSh {p.total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-brown/10 rounded-sm p-5">
                <h2 className="font-display text-lg text-brown mb-4">Staff Performance (POS sales)</h2>
                {staffPerformance.length === 0 ? (
                  <p className="text-brown/50 text-sm">No attributable POS sales in this period.</p>
                ) : (
                  <div className="space-y-2">
                    {staffPerformance.map((s) => (
                      <Link
                        key={s.id}
                        href={`/adminlsc/staff/${s.id}`}
                        className="flex items-center justify-between text-sm border-b border-brown/5 pb-2 hover:text-teal transition-colors"
                      >
                        <span className="text-brown">{s.name}</span>
                        <span className="text-brown/50 text-xs">{s.count} sales</span>
                        <span className="font-medium">KSh {s.total.toLocaleString()}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
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
