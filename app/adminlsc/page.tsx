"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  Wallet,
  Hourglass,
  Star,
  CalendarCheck,
  CakeSlice,
  Search,
  Receipt,
  Users,
  Package,
  X as XIcon,
  type LucideIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Stats = {
  todayOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  pendingReviews: number;
  pendingBookings: number;
  pendingCakes: number;
};

type SearchResult = {
  id: string;
  type: "order" | "customer" | "product" | "booking";
  title: string;
  subtitle: string;
  href: string;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

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

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const [ordersRes, customersRes, productsRes, bookingsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, customer_name, total")
          .or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`)
          .limit(5),
        supabase
          .from("customers")
          .select("id, full_name, phone")
          .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
          .limit(5),
        supabase.from("products").select("id, name, price").ilike("name", `%${q}%`).limit(5),
        supabase
          .from("bookings")
          .select("id, booking_number, customer_name")
          .or(`booking_number.ilike.%${q}%,customer_name.ilike.%${q}%`)
          .limit(5)
      ]);

      const combined: SearchResult[] = [
        ...(ordersRes.data ?? []).map((o: any) => ({
          id: o.id,
          type: "order" as const,
          title: o.order_number,
          subtitle: `${o.customer_name} · KSh ${Number(o.total).toLocaleString()}`,
          href: "/adminlsc/orders"
        })),
        ...(customersRes.data ?? []).map((c: any) => ({
          id: c.id,
          type: "customer" as const,
          title: c.full_name,
          subtitle: c.phone,
          href: "/adminlsc/customers"
        })),
        ...(productsRes.data ?? []).map((p: any) => ({
          id: p.id,
          type: "product" as const,
          title: p.name,
          subtitle: `KSh ${Number(p.price).toLocaleString()}`,
          href: "/adminlsc/products"
        })),
        ...(bookingsRes.data ?? []).map((b: any) => ({
          id: b.id,
          type: "booking" as const,
          title: b.booking_number,
          subtitle: b.customer_name,
          href: "/adminlsc/bookings"
        }))
      ];
      setResults(combined);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const typeIcon: Record<SearchResult["type"], LucideIcon> = {
    order: Receipt,
    customer: Users,
    product: Package,
    booking: CalendarCheck
  };

  return (
    <div>
      <h1 className="font-display text-display-md text-brown mb-6">Dashboard</h1>

      <div className="relative max-w-xl mb-8">
        <Search size={16} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search orders, customers, products, bookings…"
          className="w-full border border-brown/20 rounded-sm pl-10 pr-9 py-3 text-sm bg-white focus:border-teal transition-colors shadow-soft"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brown/40 hover:text-brown"
          >
            <XIcon size={15} strokeWidth={2} />
          </button>
        )}

        {results !== null && (
          <div className="absolute z-10 mt-2 w-full bg-white border border-brown/10 rounded-sm shadow-soft-lg max-h-80 overflow-y-auto">
            {searching ? (
              <p className="p-4 text-sm text-brown/50">Searching…</p>
            ) : results.length === 0 ? (
              <p className="p-4 text-sm text-brown/50">No matches for "{query}".</p>
            ) : (
              results.map((r) => {
                const Icon = typeIcon[r.type];
                return (
                  <Link
                    key={`${r.type}-${r.id}`}
                    href={r.href}
                    className="flex items-center gap-3 p-3 hover:bg-cream/60 border-t border-brown/5 first:border-t-0 transition-colors"
                  >
                    <Icon size={15} strokeWidth={1.75} className="text-caramel flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-brown font-medium truncate">{r.title}</p>
                      <p className="text-xs text-brown/50 truncate">{r.subtitle}</p>
                    </div>
                    <span className="ml-auto text-[10px] uppercase tracking-wide text-brown/30 flex-shrink-0">{r.type}</span>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>

      {!stats ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          <StatCard icon={ClipboardList} label="Orders Today" value={stats.todayOrders} />
          <StatCard icon={Wallet} label="Revenue Today" value={`KSh ${stats.todayRevenue.toLocaleString()}`} />
          <StatCard icon={Hourglass} label="Pending Orders" value={stats.pendingOrders} href="/adminlsc/orders" />
          <StatCard icon={Star} label="Pending Reviews" value={stats.pendingReviews} href="/adminlsc/reviews" />
          <StatCard icon={CalendarCheck} label="Pending Bookings" value={stats.pendingBookings} href="/adminlsc/bookings" />
          <StatCard icon={CakeSlice} label="Pending Cake Requests" value={stats.pendingCakes} href="/adminlsc/orders?tab=cakes" />
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  href?: string;
}) {
  const content = (
    <div className="bg-white border border-brown/10 rounded-sm p-4 sm:p-5 hover:border-teal transition-colors card-hover h-full">
      <Icon size={18} strokeWidth={1.75} className="text-caramel mb-2" />
      <p className="text-xs sm:text-sm text-brown/60 mb-1">{label}</p>
      <p className="font-display text-xl sm:text-3xl text-brown">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
