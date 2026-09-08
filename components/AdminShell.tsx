"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/adminlsc", label: "Dashboard", icon: "grid", permission: null },
  { href: "/adminlsc/orders", label: "Orders", icon: "receipt", permission: "orders.view" },
  { href: "/adminlsc/pos", label: "Mini POS", icon: "cart", permission: "pos.use" },
  { href: "/adminlsc/products", label: "Products", icon: "box", permission: "products.manage" },
  { href: "/adminlsc/bookings", label: "Bookings", icon: "calendar", permission: "bookings.manage" },
  { href: "/adminlsc/cakes", label: "Cake Requests", icon: "cake", permission: "cakes.manage" },
  { href: "/adminlsc/offers", label: "Offers", icon: "tag", permission: "reviews.manage" },
  { href: "/adminlsc/reviews", label: "Reviews", icon: "star", permission: "reviews.manage" },
  { href: "/adminlsc/staff", label: "Staff", icon: "users", permission: "staff.manage" },
  { href: "/adminlsc/analytics", label: "Analytics", icon: "chart", permission: "reports.view" },
  { href: "/adminlsc/logs", label: "Activity Logs", icon: "list", permission: "staff.manage" },
  { href: "/adminlsc/settings", label: "Site Settings", icon: "settings", permission: "settings.manage" }
];

type StaffInfo = { full_name: string; role: string } | null;
type NotifCounts = { orders: number; reviews: number; bookings: number; cakes: number };

function NavIcon({ name, className }: { name: string; className?: string }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, className };
  switch (name) {
    case "grid":
      return <svg {...common}><rect x="3.5" y="3.5" width="7" height="7" rx="1.2" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.2" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.2" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.2" /></svg>;
    case "receipt":
      return <svg {...common}><path d="M6 3.5h12v17l-2.5-1.5L13 20.5 10.5 19 8 20.5 5.5 19V3.5z" /><line x1="8.5" y1="8" x2="15.5" y2="8" /><line x1="8.5" y1="12" x2="15.5" y2="12" /></svg>;
    case "cart":
      return <svg {...common}><circle cx="9" cy="20" r="1.3" fill="currentColor" stroke="none" /><circle cx="17" cy="20" r="1.3" fill="currentColor" stroke="none" /><path d="M3.5 4h2l2 12h10l2-8H6.5" /></svg>;
    case "box":
      return <svg {...common}><path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4z" /><path d="M3.5 7.5 12 11.5l8.5-4" /><line x1="12" y1="11.5" x2="12" y2="20.5" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><line x1="3.5" y1="9.5" x2="20.5" y2="9.5" /><line x1="8" y1="3" x2="8" y2="6.5" /><line x1="16" y1="3" x2="16" y2="6.5" /></svg>;
    case "cake":
      return <svg {...common}><rect x="4" y="12" width="16" height="7.5" rx="1.5" /><path d="M4 15.5h16" /><path d="M12 12V8" /><path d="M9 8c0-1.5 1.2-1.8 1.2-3S9 3 9 3M15 8c0-1.5-1.2-1.8-1.2-3S15 3 15 3" /></svg>;
    case "tag":
      return <svg {...common}><path d="M11 3.5H5v6l9.5 9.5 6-6z" /><circle cx="8" cy="7" r="1" fill="currentColor" stroke="none" /></svg>;
    case "star":
      return <svg {...common} fill="currentColor" stroke="none"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9-4.3-4.1 5.9-.8z" /></svg>;
    case "users":
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" /><circle cx="17" cy="8.5" r="2.3" /><path d="M15.5 14.7c2.5.3 4.5 2.3 4.5 5.3" /></svg>;
    case "chart":
      return <svg {...common}><line x1="4" y1="20" x2="20" y2="20" /><rect x="6" y="13" width="3" height="6" /><rect x="11" y="9" width="3" height="10" /><rect x="16" y="5" width="3" height="14" /></svg>;
    case "list":
      return <svg {...common}><line x1="8" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="8" y1="18" x2="20" y2="18" /><circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" /></svg>;
    case "settings":
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V19.5a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4.5a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.6V4.5a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [staff, setStaff] = useState<StaffInfo>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [counts, setCounts] = useState<NotifCounts>({ orders: 0, reviews: 0, bookings: 0, cakes: 0 });

  useEffect(() => {
    let active = true;

    async function check() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        if (active) router.replace("/adminlsc/login");
        return;
      }
      const { data: staffRow } = await supabase
        .from("staff")
        .select("id, full_name, role, is_active")
        .eq("auth_user_id", sessionData.session.user.id)
        .maybeSingle();

      if (!staffRow || !staffRow.is_active) {
        await supabase.auth.signOut();
        if (active) router.replace("/adminlsc/login");
        return;
      }

      const admin = staffRow.role === "admin";
      let permSet = new Set<string>();
      if (!admin) {
        const { data: permRows } = await supabase
          .from("staff_permissions")
          .select("permissions(code)")
          .eq("staff_id", staffRow.id);
        permSet = new Set((permRows ?? []).map((r: any) => r.permissions?.code).filter(Boolean));
      }

      if (active) {
        setStaff({ full_name: staffRow.full_name, role: staffRow.role });
        setIsAdmin(admin);
        setPermissions(permSet);

        // Block direct URL access to pages this staff member isn't authorized for.
        // (Real enforcement is server-side via RLS — this just prevents a confusing
        // blank/broken page rather than acting as the actual security boundary.)
        const currentNavItem = NAV.find((n) => n.href === pathname);
        if (!admin && currentNavItem?.permission && !permSet.has(currentNavItem.permission)) {
          router.replace("/adminlsc");
          return;
        }

        setChecking(false);
      }
    }
    check();

    return () => {
      active = false;
    };
  }, [router, pathname]);

  useEffect(() => {
    if (checking) return;
    async function loadCounts() {
      const [ordersRes, reviewsRes, bookingsRes, cakesRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["received", "confirmed"]),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("cake_requests").select("id", { count: "exact", head: true }).eq("status", "pending")
      ]);
      setCounts({
        orders: ordersRes.count ?? 0,
        reviews: reviewsRes.count ?? 0,
        bookings: bookingsRes.count ?? 0,
        cakes: cakesRes.count ?? 0
      });
    }
    loadCounts();
    const interval = setInterval(loadCounts, 60000);
    return () => clearInterval(interval);
  }, [checking]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/adminlsc/login");
  }

  const totalNotifs = counts.orders + counts.reviews + counts.bookings + counts.cakes;

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-brown/60 text-sm">Checking session…</p>
      </div>
    );
  }

  const sidebarContent = (isMobile: boolean) => (
    <>
      <div className={`flex items-center gap-3 p-5 border-b border-cream/15 ${collapsed && !isMobile ? "justify-center px-2" : ""}`}>
        <Image src="/logo.jpg" alt="La Shefa Cafe" width={32} height={32} className="rounded-sm flex-shrink-0" />
        {(!collapsed || isMobile) && (
          <div>
            <p className="font-display text-base leading-tight">La Shefa Cafe</p>
            <p className="text-xs text-cream/60">Admin</p>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.filter((item) => isAdmin || !item.permission || permissions.has(item.permission)).map((item) => {
          const active = pathname === item.href;
          const badge =
            item.href === "/adminlsc/orders" ? counts.orders :
            item.href === "/adminlsc/reviews" ? counts.reviews :
            item.href === "/adminlsc/bookings" ? counts.bookings :
            item.href === "/adminlsc/cakes" ? counts.cakes : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed && !isMobile ? item.label : undefined}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm ${
                collapsed && !isMobile ? "justify-center px-0" : ""
              } ${
                active
                  ? "bg-cream/10 text-cream font-medium border-l-2 border-caramel"
                  : "text-cream/75 hover:bg-cream/5"
              }`}
            >
              <span className="relative flex-shrink-0">
                <NavIcon name={item.icon} className="w-[18px] h-[18px]" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-caramel text-brown text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className={`p-5 border-t border-cream/15 ${collapsed && !isMobile ? "px-2 text-center" : ""}`}>
        {(!collapsed || isMobile) && (
          <p className="text-xs text-cream/60 mb-2 truncate">
            {staff?.full_name} · <span className="capitalize">{staff?.role}</span>
          </p>
        )}
        <button onClick={handleLogout} className="text-sm text-caramel hover:underline">
          {collapsed && !isMobile ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-5 h-5 mx-auto">
              <path d="M15 4H6.5a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6.5 20H15" />
              <line x1="20" y1="12" x2="10" y2="12" />
              <path d="M16 8l4 4-4 4" />
            </svg>
          ) : (
            "Log out"
          )}
        </button>
        {(!collapsed || isMobile) && (
          <Link
            href="/adminlsc/change-password"
            onClick={() => setMobileOpen(false)}
            className="block text-xs text-cream/60 hover:text-cream mt-2"
          >
            Change password
          </Link>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Desktop sidebar - independent scroll, sticky full height */}
      <aside
        className={`bg-teal text-cream flex-shrink-0 hidden md:flex md:flex-col sticky top-0 h-screen transition-all ${
          collapsed ? "w-[72px]" : "w-56"
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile off-canvas sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-64 bg-teal text-cream flex flex-col h-full relative">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-4 text-cream/80 hover:text-cream p-1 z-10"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>
            {sidebarContent(true)}
          </div>
          <button
            aria-label="Close sidebar"
            className="flex-1 bg-brown/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar - fixed on mobile, doesn't move with content scroll */}
        <header className="sticky top-0 z-30 bg-teal text-cream md:bg-white md:text-brown md:border-b md:border-brown/10 flex items-center justify-between px-4 md:px-8 py-3">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-cream p-1"
              aria-label="Open sidebar"
              onClick={() => setMobileOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <button
              className="hidden md:inline-flex text-brown/60 hover:text-brown p-1"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <p className="font-display text-lg md:hidden">La Shefa Cafe</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifications"
              className="relative p-1.5"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M6 9a6 6 0 0 1 12 0v5l1.8 2.5H4.2L6 14z" />
                <path d="M10 20a2 2 0 0 0 4 0" />
              </svg>
              {totalNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-caramel text-brown text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {totalNotifs > 9 ? "9+" : totalNotifs}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-brown rounded-sm shadow-lg border border-brown/10 overflow-hidden z-40">
                <NotifRow href="/adminlsc/orders" label="New/confirmed orders" count={counts.orders} onClick={() => setNotifOpen(false)} />
                <NotifRow href="/adminlsc/reviews" label="Reviews awaiting approval" count={counts.reviews} onClick={() => setNotifOpen(false)} />
                <NotifRow href="/adminlsc/bookings" label="Pending bookings" count={counts.bookings} onClick={() => setNotifOpen(false)} />
                <NotifRow href="/adminlsc/cakes" label="Pending cake requests" count={counts.cakes} onClick={() => setNotifOpen(false)} />
                {totalNotifs === 0 && <p className="p-4 text-sm text-brown/50">Nothing pending.</p>}
              </div>
            )}
          </div>
        </header>

        <main className="p-6 md:p-10 max-w-5xl flex-1">{children}</main>
      </div>
    </div>
  );
}

function NotifRow({ href, label, count, onClick }: { href: string; label: string; count: number; onClick: () => void }) {
  if (count === 0) return null;
  return (
    <Link href={href} onClick={onClick} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-cream border-b border-brown/5 last:border-0">
      <span>{label}</span>
      <span className="bg-caramel/20 text-brown rounded-full px-2 py-0.5 text-xs font-medium">{count}</span>
    </Link>
  );
}
