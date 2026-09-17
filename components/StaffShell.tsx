"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/shefastaff", label: "Dashboard", permission: null },
  { href: "/shefastaff/orders", label: "Orders", permission: "orders.view" },
  { href: "/shefastaff/orders?assigned=me", label: "My Orders", permission: "orders.view" },
  { href: "/shefastaff/pos", label: "Mini POS", permission: "pos.use" },
  { href: "/shefastaff/sales", label: "Sales", permission: "reports.view" },
  { href: "/shefastaff/profile", label: "Profile", permission: null }
];

type StaffInfo = { full_name: string; role: string } | null;

export function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [staff, setStaff] = useState<StaffInfo>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCounts, setNotifCounts] = useState({ newOrders: 0, assignedToMe: 0 });
  const [myStaffId, setMyStaffId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function check() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        if (active) router.replace("/shefastaff/login");
        return;
      }
      const { data: staffRow } = await supabase
        .from("staff")
        .select("id, full_name, role, is_active")
        .eq("auth_user_id", sessionData.session.user.id)
        .maybeSingle();

      if (!staffRow || !staffRow.is_active) {
        await supabase.auth.signOut();
        if (active) router.replace("/shefastaff/login");
        return;
      }

      supabase.from("staff").update({ last_active_at: new Date().toISOString() }).eq("id", staffRow.id).then(
        () => {},
        () => {}
      );

      const admin = staffRow.role === "admin";

      // Reciprocal of the AdminShell rule: /shefastaff is for non-admin
      // staff. An admin who lands here (shared bookmark, muscle memory)
      // goes to the admin portal instead.
      if (admin) {
        if (active) router.replace("/adminlsc");
        return;
      }

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
        setMyStaffId(staffRow.id);

        const EXTRA_ROUTE_PERMISSIONS: Record<string, string> = {
          "/shefastaff/cakes": "orders.view"
        };
        const currentNavItem =
          NAV.find((n) => n.href === pathname) ??
          NAV.filter((n) => n.href !== "/shefastaff" && pathname?.startsWith(n.href + "/"))
            .sort((a, b) => b.href.length - a.href.length)[0];
        const extraPermission = Object.entries(EXTRA_ROUTE_PERMISSIONS).find(
          ([prefix]) => pathname === prefix || pathname?.startsWith(prefix + "/")
        )?.[1];
        const requiredPermission = currentNavItem?.permission ?? extraPermission;
        if (!admin && requiredPermission && !permSet.has(requiredPermission)) {
          router.replace("/shefastaff");
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
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (checking) return;
    async function loadCounts() {
      const newOrdersRes = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "received");

      let assignedToMe = 0;
      if (myStaffId) {
        try {
          const { count, error } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("assigned_staff_id", myStaffId)
            .in("status", ["received", "confirmed", "preparing", "ready"]);
          assignedToMe = error ? 0 : count ?? 0;
        } catch {
          assignedToMe = 0;
        }
      }
      setNotifCounts({ newOrders: newOrdersRes.count ?? 0, assignedToMe });
    }
    loadCounts();
    const interval = setInterval(loadCounts, 60000);
    return () => clearInterval(interval);
  }, [checking, myStaffId]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/shefastaff/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-brown/60 text-sm">Checking session…</p>
      </div>
    );
  }

  const visibleNav = NAV.filter((item) => isAdmin || !item.permission || permissions.has(item.permission));

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 bg-teal text-cream">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-cream p-1"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
            <Image src="/logo.jpg" alt="La Shefa Cafe" width={30} height={30} className="rounded-sm" />
            <span className="font-display text-lg">La Shefa Cafe · Staff</span>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "text-caramel font-medium" : "text-cream/80 hover:text-cream"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                className="relative p-1.5"
              >
                <Bell size={19} strokeWidth={1.75} />
                {notifCounts.newOrders + notifCounts.assignedToMe > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-caramel text-brown text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {notifCounts.newOrders + notifCounts.assignedToMe > 9 ? "9+" : notifCounts.newOrders + notifCounts.assignedToMe}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white text-brown rounded-sm shadow-lg border border-brown/10 overflow-hidden z-40">
                  {notifCounts.newOrders > 0 && (
                    <Link href="/shefastaff/orders" onClick={() => setNotifOpen(false)} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-cream border-b border-brown/5">
                      <span>New orders</span>
                      <span className="bg-caramel/20 text-brown rounded-full px-2 py-0.5 text-xs font-medium">{notifCounts.newOrders}</span>
                    </Link>
                  )}
                  {notifCounts.assignedToMe > 0 && (
                    <Link href="/shefastaff/orders?assigned=me" onClick={() => setNotifOpen(false)} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-cream">
                      <span>Assigned to me</span>
                      <span className="bg-caramel/20 text-brown rounded-full px-2 py-0.5 text-xs font-medium">{notifCounts.assignedToMe}</span>
                    </Link>
                  )}
                  {notifCounts.newOrders + notifCounts.assignedToMe === 0 && <p className="p-4 text-sm text-brown/50">Nothing pending.</p>}
                </div>
              )}
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="text-cream/60">{staff?.full_name}</span>
              <Link href="/shefastaff/change-password" className="text-cream/60 hover:text-cream">Change password</Link>
              <button onClick={handleLogout} className="text-caramel flex items-center gap-1.5">
                <LogOut size={14} strokeWidth={1.75} />
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-teal flex flex-col md:hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cream/15">
            <span className="font-display text-lg text-cream">Menu</span>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-cream p-1">
              <X size={22} strokeWidth={1.8} />
            </button>
          </div>
          <nav className="flex-1 px-5 py-6 flex flex-col gap-1">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-cream font-display text-xl py-3 border-b border-cream/10"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/shefastaff/change-password" onClick={() => setMobileOpen(false)} className="text-cream/70 text-sm py-3">
              Change password
            </Link>
          </nav>
          <div className="p-5 border-t border-cream/15">
            <button onClick={handleLogout} className="text-caramel text-sm flex items-center gap-1.5">
              <LogOut size={14} strokeWidth={1.75} />
              Log out
            </button>
          </div>
        </div>
      )}

      <main className="p-6 md:p-10 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
