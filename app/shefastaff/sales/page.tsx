"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Totals = { count: number; revenue: number };

function emptyTotals(): Totals {
  return { count: 0, revenue: 0 };
}

export default function StaffSalesPage() {
  const [today, setToday] = useState<Totals>(emptyTotals());
  const [thisWeek, setThisWeek] = useState<Totals>(emptyTotals());
  const [byMethod, setByMethod] = useState<Record<string, Totals>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      const [{ data: todaySales }, { data: weekSales }] = await Promise.all([
        supabase.from("pos_sales").select("total, payment_method").eq("status", "completed").gte("created_at", startOfDay.toISOString()),
        supabase.from("pos_sales").select("total, payment_method").eq("status", "completed").gte("created_at", startOfWeek.toISOString())
      ]);

      const sumTotals = (rows: any[]): Totals => ({
        count: rows.length,
        revenue: rows.reduce((s, r) => s + Number(r.total), 0)
      });

      setToday(sumTotals(todaySales ?? []));
      setThisWeek(sumTotals(weekSales ?? []));

      const methodMap: Record<string, Totals> = {};
      (weekSales ?? []).forEach((r: any) => {
        const key = r.payment_method || "other";
        if (!methodMap[key]) methodMap[key] = emptyTotals();
        methodMap[key].count += 1;
        methodMap[key].revenue += Number(r.total);
      });
      setByMethod(methodMap);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-brown/50 text-sm">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl text-brown mb-2">Sales</h1>
      <p className="text-sm text-brown/50 mb-8">POS sales, based on actual completed transactions.</p>

      <div className="grid sm:grid-cols-2 gap-5 mb-10">
        <div className="bg-white border border-brown/10 rounded-sm p-5">
          <p className="text-sm text-brown/60 mb-1">Today</p>
          <p className="font-display text-2xl text-brown">KSh {today.revenue.toLocaleString()}</p>
          <p className="text-xs text-brown/50">{today.count} sale{today.count === 1 ? "" : "s"}</p>
        </div>
        <div className="bg-white border border-brown/10 rounded-sm p-5">
          <p className="text-sm text-brown/60 mb-1">This Week</p>
          <p className="font-display text-2xl text-brown">KSh {thisWeek.revenue.toLocaleString()}</p>
          <p className="text-xs text-brown/50">{thisWeek.count} sale{thisWeek.count === 1 ? "" : "s"}</p>
        </div>
      </div>

      {Object.keys(byMethod).length > 0 && (
        <div className="bg-white border border-brown/10 rounded-sm p-5">
          <p className="text-sm font-medium text-brown mb-3">This week by payment method</p>
          <div className="space-y-2">
            {Object.entries(byMethod).map(([method, t]) => (
              <div key={method} className="flex justify-between text-sm text-brown/80 capitalize">
                <span>{method} ({t.count})</span>
                <span>KSh {t.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
