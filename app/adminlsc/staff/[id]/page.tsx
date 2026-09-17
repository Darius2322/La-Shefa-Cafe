"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Shield, Clock3, Receipt as ReceiptIcon, TrendingUp, KeyRound, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { waLink } from "@/lib/whatsapp";

const ROLES = ["admin", "manager", "cashier", "staff"] as const;

type StaffMember = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  last_active_at?: string | null;
};

type Permission = { id: number; code: string; description: string | null };

const RANGES = ["today", "week", "month", "custom"] as const;
type Range = (typeof RANGES)[number];

function rangeStart(range: Range, customFrom: string): Date | null {
  const now = new Date();
  if (range === "today") {
    now.setHours(0, 0, 0, 0);
    return now;
  }
  if (range === "week") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }
  if (range === "month") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    return d;
  }
  return customFrom ? new Date(customFrom + "T00:00:00") : null;
}

function relativeTime(iso: string | null | undefined) {
  if (!iso) return "No activity recorded yet";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function StaffProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tab, setTab] = useState<"overview" | "sales" | "activity" | "permissions">("overview");
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [myPermIds, setMyPermIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [range, setRange] = useState<Range>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [sales, setSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [profit, setProfit] = useState<{ total: number; completeCount: number; totalCount: number } | null>(null);

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: s }, { data: permRows }, { data: spRows }] = await Promise.all([
        supabase.from("staff").select("*").eq("id", id).maybeSingle(),
        supabase.from("permissions").select("*").order("code"),
        supabase.from("staff_permissions").select("permission_id").eq("staff_id", id)
      ]);
      setStaffMember(s as StaffMember);
      setPermissions((permRows as Permission[]) ?? []);
      setMyPermIds((spRows ?? []).map((r: any) => r.permission_id));
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    async function loadSales() {
      setSalesLoading(true);
      const since = rangeStart(range, customFrom);
      const sinceIso = since ? since.toISOString() : "1970-01-01T00:00:00Z";
      const { data } = await supabase
        .from("pos_sales")
        .select("*")
        .eq("status", "completed")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false });

      // Best-effort: pos_sales doesn't have a confirmed cashier-attribution
      // column name visible from this codebase, so match against whichever
      // of these commonly-used names is actually present.
      const mine = (data ?? []).filter((s: any) => (s.cashier_id ?? s.staff_id ?? s.created_by) === id);
      setSales(mine);
      setSalesLoading(false);

      // Profit: only computable where every item in a sale has a known
      // product cost_price. Never invented — sales with any unknown cost
      // are simply excluded from the total and counted separately.
      if (mine.length > 0) {
        const { data: items } = await supabase
          .from("pos_sale_items")
          .select("sale_id, product_id, quantity, unit_price")
          .in("sale_id", mine.map((s: any) => s.id));
        const productIds = Array.from(new Set((items ?? []).map((it: any) => it.product_id).filter(Boolean)));
        const { data: products } = productIds.length
          ? await supabase.from("products").select("id, cost_price").in("id", productIds)
          : { data: [] as any[] };
        const costMap = Object.fromEntries((products ?? []).map((p: any) => [p.id, p.cost_price]));

        let total = 0;
        let completeCount = 0;
        const bySale: Record<string, any[]> = {};
        (items ?? []).forEach((it: any) => {
          bySale[it.sale_id] = [...(bySale[it.sale_id] ?? []), it];
        });
        mine.forEach((s: any) => {
          const saleItems = bySale[s.id] ?? [];
          const allKnown = saleItems.length > 0 && saleItems.every((it) => costMap[it.product_id] != null);
          if (allKnown) {
            completeCount++;
            saleItems.forEach((it) => {
              total += (Number(it.unit_price) - Number(costMap[it.product_id])) * Number(it.quantity);
            });
          }
        });
        setProfit({ total, completeCount, totalCount: mine.length });
      } else {
        setProfit({ total: 0, completeCount: 0, totalCount: 0 });
      }
    }
    loadSales();
  }, [id, range, customFrom]);

  useEffect(() => {
    async function loadActivity() {
      setActivityLoading(true);
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      const mine = (data ?? []).filter((l: any) => {
        const actorRef = l.actor_id ?? l.actor_user_id ?? l.created_by;
        return actorRef === id || actorRef === staffMember?.auth_user_id;
      });
      setActivityLogs(mine);
      setActivityLoading(false);
    }
    if (staffMember) loadActivity();
  }, [id, staffMember]);

  async function authHeader() {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token}` };
  }

  async function updateRole(role: string) {
    await supabase.from("staff").update({ role }).eq("id", id);
    setStaffMember((prev) => (prev ? { ...prev, role } : prev));
  }

  async function toggleActive() {
    if (!staffMember) return;
    await supabase.from("staff").update({ is_active: !staffMember.is_active }).eq("id", id);
    setStaffMember((prev) => (prev ? { ...prev, is_active: !prev.is_active } : prev));
  }

  async function resetPassword() {
    if (!staffMember || !confirm(`Reset ${staffMember.full_name}'s password to the default?`)) return;
    const res = await fetch("/api/admin/staff/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ staff_auth_user_id: staffMember.auth_user_id })
    });
    const json = await res.json();
    if (!res.ok) {
      setActionNotice(json.error || "Couldn't reset password.");
      return;
    }
    setActionNotice(`Password reset to default: ${json.defaultPassword}`);
    setTimeout(() => setActionNotice(null), 6000);
  }

  async function togglePermission(permId: number) {
    const has = myPermIds.includes(permId);
    if (has) {
      await supabase.from("staff_permissions").delete().eq("staff_id", id).eq("permission_id", permId);
      setMyPermIds((prev) => prev.filter((p) => p !== permId));
    } else {
      await supabase.from("staff_permissions").insert({ staff_id: id, permission_id: permId });
      setMyPermIds((prev) => [...prev, permId]);
    }
  }

  const salesCount = sales.length;
  const salesTotal = useMemo(() => sales.reduce((sum, s) => sum + Number(s.total), 0), [sales]);
  const lastSale = sales[0] ?? null;

  if (loading) return <p className="text-brown/50 text-sm">Loading…</p>;
  if (!staffMember) return <p className="text-brown/50 text-sm">Staff member not found.</p>;

  return (
    <div>
      <Link href="/adminlsc/staff" className="inline-flex items-center gap-1.5 text-sm text-brown/60 hover:text-brown mb-4">
        <ArrowLeft size={15} strokeWidth={2} />
        Back to Staff
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
        <h1 className="font-display text-display-md text-brown">{staffMember.full_name}</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${staffMember.is_active ? "bg-teal/10 text-teal" : "bg-red-50 text-red-700"}`}>
          {staffMember.is_active ? "Active" : "Deactivated"}
        </span>
      </div>
      <p className="text-sm text-brown/60 capitalize mb-4">{staffMember.role} · La Shefa Cafe</p>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={staffMember.role}
          onChange={(e) => updateRole(e.target.value)}
          className="border border-brown/20 rounded-sm text-xs px-3 py-1.5 bg-white capitalize"
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={resetPassword} className="btn-outline !text-brown !border-brown/30 !py-1.5 !px-3 text-xs">
          <KeyRound size={13} strokeWidth={1.75} />
          Reset Password
        </button>
        {staffMember.phone && (
          <a
            href={waLink(
              staffMember.phone,
              `Hi ${staffMember.full_name}, here's your La Shefa Cafe staff login link: ${typeof window !== "undefined" ? window.location.origin : ""}/shefastaff/login\n\nUse your work email and the default password (ask an admin if you haven't changed it yet).`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline !text-brown !border-brown/30 !py-1.5 !px-3 text-xs"
          >
            <MessageCircle size={13} strokeWidth={1.75} />
            Send Login Link
          </a>
        )}
        <button
          onClick={toggleActive}
          className={`!py-1.5 !px-3 text-xs rounded-sm font-medium ${staffMember.is_active ? "bg-red-50 text-red-700" : "bg-teal/10 text-teal"}`}
        >
          {staffMember.is_active ? "Deactivate" : "Reactivate"}
        </button>
        {actionNotice && <span className="text-xs text-teal">{actionNotice}</span>}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-brown/15 mb-6">
        {(["overview", "sales", "activity", "permissions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
              tab === t ? "border-teal text-teal" : "border-transparent text-brown/50 hover:text-brown"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          <div className="bg-white border border-brown/10 rounded-sm p-4">
            <p className="text-xs text-brown/50 flex items-center gap-1.5 mb-1"><Mail size={13} strokeWidth={1.75} />Email</p>
            <p className="text-sm text-brown">{staffMember.email}</p>
          </div>
          <div className="bg-white border border-brown/10 rounded-sm p-4">
            <p className="text-xs text-brown/50 flex items-center gap-1.5 mb-1"><Phone size={13} strokeWidth={1.75} />Phone</p>
            <p className="text-sm text-brown">{staffMember.phone || "—"}</p>
          </div>
          <div className="bg-white border border-brown/10 rounded-sm p-4">
            <p className="text-xs text-brown/50 flex items-center gap-1.5 mb-1"><Shield size={13} strokeWidth={1.75} />Role</p>
            <p className="text-sm text-brown capitalize">{staffMember.role}</p>
          </div>
          <div className="bg-white border border-brown/10 rounded-sm p-4">
            <p className="text-xs text-brown/50 flex items-center gap-1.5 mb-1"><Clock3 size={13} strokeWidth={1.75} />Last active</p>
            <p className="text-sm text-brown">{relativeTime(staffMember.last_active_at)}</p>
          </div>
          <div className="bg-white border border-brown/10 rounded-sm p-4">
            <p className="text-xs text-brown/50 mb-1">Date added</p>
            <p className="text-sm text-brown">{new Date(staffMember.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
          </div>
          <div className="bg-white border border-brown/10 rounded-sm p-4">
            <p className="text-xs text-brown/50 flex items-center gap-1.5 mb-1"><ReceiptIcon size={13} strokeWidth={1.75} />Last sale</p>
            {lastSale ? (
              <p className="text-sm text-brown">
                {lastSale.sale_number} · KSh {Number(lastSale.total).toLocaleString()}
                <span className="block text-xs text-brown/50">{relativeTime(lastSale.created_at)}</span>
              </p>
            ) : (
              <p className="text-sm text-brown/40">No sales yet</p>
            )}
          </div>
        </div>
      )}

      {tab === "sales" && (
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-full text-xs capitalize border transition-colors ${
                  range === r ? "bg-teal text-cream border-teal" : "border-brown/20 text-brown hover:border-teal"
                }`}
              >
                {r}
              </button>
            ))}
            {range === "custom" && (
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border border-brown/20 rounded-sm px-2 py-1.5 text-xs bg-white"
              />
            )}
          </div>

          {salesLoading ? (
            <p className="text-brown/50 text-sm">Loading…</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 max-w-2xl">
              <div className="bg-white border border-brown/10 rounded-sm p-4">
                <p className="text-xs text-brown/50 mb-1">Sales count</p>
                <p className="font-display text-xl text-brown">{salesCount}</p>
              </div>
              <div className="bg-white border border-brown/10 rounded-sm p-4">
                <p className="text-xs text-brown/50 mb-1">Total value</p>
                <p className="font-display text-xl text-brown">KSh {salesTotal.toLocaleString()}</p>
              </div>
              <div className="bg-white border border-brown/10 rounded-sm p-4">
                <p className="text-xs text-brown/50 mb-1 flex items-center gap-1"><TrendingUp size={12} strokeWidth={1.75} />Profit</p>
                {profit && profit.completeCount > 0 ? (
                  <>
                    <p className="font-display text-xl text-brown">KSh {profit.total.toLocaleString()}</p>
                    {profit.completeCount < profit.totalCount && (
                      <p className="text-[10px] text-brown/40 mt-0.5">{profit.completeCount} of {profit.totalCount} sales have cost data</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-brown/40 mt-1">Profit data unavailable</p>
                )}
              </div>
            </div>
          )}

          {!salesLoading && sales.length === 0 ? (
            <p className="text-brown/50 text-sm">No sales in this period.</p>
          ) : (
            <div className="space-y-2 max-w-2xl">
              {sales.map((s) => (
                <Link
                  key={s.id}
                  href={`/adminlsc/pos/receipt/${s.id}`}
                  target="_blank"
                  className="flex items-center justify-between bg-white border border-brown/10 rounded-sm p-3 text-sm hover:border-teal transition-colors"
                >
                  <span className="text-teal font-medium">{s.sale_number}</span>
                  <span className="text-brown/60">{relativeTime(s.created_at)}</span>
                  <span className="text-brown">KSh {Number(s.total).toLocaleString()}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "activity" && (
        <div>
          {activityLoading ? (
            <p className="text-brown/50 text-sm">Loading…</p>
          ) : activityLogs.length === 0 ? (
            <p className="text-brown/50 text-sm">No activity recorded for this staff member yet.</p>
          ) : (
            <div className="bg-white border border-brown/10 rounded-sm overflow-x-auto max-w-2xl">
              <table className="w-full text-sm">
                <thead className="bg-cream text-brown/60 text-left">
                  <tr>
                    <th className="p-3 font-medium">When</th>
                    <th className="p-3 font-medium">Action</th>
                    <th className="p-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((l) => (
                    <tr key={l.id} className="border-t border-brown/10">
                      <td className="p-3 text-brown/70 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="p-3 text-teal font-medium">{l.action}</td>
                      <td className="p-3 text-brown/80">{l.description ?? l.related_record ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "permissions" && (
        <div className="max-w-xl">
          {staffMember.role === "admin" ? (
            <p className="text-sm text-brown/60">Admins have full access to everything automatically.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2 bg-white border border-brown/10 rounded-sm p-4">
              {permissions.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-brown">
                  <input type="checkbox" checked={myPermIds.includes(p.id)} onChange={() => togglePermission(p.id)} />
                  {p.code}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
