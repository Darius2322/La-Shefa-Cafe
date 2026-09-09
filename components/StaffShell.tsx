"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/shefastaff", label: "Dashboard", permission: null },
  { href: "/shefastaff/orders", label: "Orders", permission: "orders.view" },
  { href: "/shefastaff/pos", label: "Mini POS", permission: "pos.use" },
  { href: "/shefastaff/sales", label: "Sales", permission: "reports.view" }
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

        const currentNavItem = NAV.find((n) => n.href === pathname);
        if (!admin && currentNavItem?.permission && !permSet.has(currentNavItem.permission)) {
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
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
          <div className="hidden md:flex items-center gap-4 text-sm">
            <span className="text-cream/60">{staff?.full_name}</span>
            <Link href="/shefastaff/change-password" className="text-cream/60 hover:text-cream">Change password</Link>
            <button onClick={handleLogout} className="text-caramel">Log out</button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-teal flex flex-col md:hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cream/15">
            <span className="font-display text-lg text-cream">Menu</span>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-cream p-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
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
            <button onClick={handleLogout} className="text-caramel text-sm">Log out</button>
          </div>
        </div>
      )}

      <main className="p-6 md:p-10 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
