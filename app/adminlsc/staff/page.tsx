"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Permission = { id: number; code: string; description: string | null };
type StaffMember = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "admin" | "manager" | "cashier" | "staff";
  is_active: boolean;
};

const ROLES = ["admin", "manager", "cashier", "staff"] as const;

const EMPTY_FORM = { full_name: "", email: "", phone: "", role: "cashier" as StaffMember["role"] };

export default function AdminStaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const [{ data: staffRows }, { data: permRows }, { data: spRows }] = await Promise.all([
      supabase.from("staff").select("*").order("created_at", { ascending: false }),
      supabase.from("permissions").select("*").order("code"),
      supabase.from("staff_permissions").select("staff_id, permission_id")
    ]);
    setStaff((staffRows as StaffMember[]) ?? []);
    setPermissions((permRows as Permission[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function authHeader() {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token}` };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/staff/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ ...form, permission_ids: selectedPerms })
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Couldn't create staff member.");
      setSaving(false);
      return;
    }

    setNotice(`Staff created. Default password: ${json.defaultPassword}`);
    setForm(EMPTY_FORM);
    setSelectedPerms([]);
    setShowForm(false);
    setSaving(false);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-display-md text-brown mb-2">Staff</h1>
      <p className="text-xs text-brown/50 mb-6">
        Default password for new staff and resets: <code className="bg-brown/5 px-1.5 py-0.5 rounded">Staff@lsc321</code> — staff should change it after first login.
      </p>

      <div className="flex flex-wrap gap-1 border-b border-brown/15 mb-8">
        <button
          onClick={() => setShowForm(false)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            !showForm ? "border-teal text-teal" : "border-transparent text-brown/50 hover:text-brown"
          }`}
        >
          Team
        </button>
        <button
          onClick={() => setShowForm(true)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            showForm ? "border-teal text-teal" : "border-transparent text-brown/50 hover:text-brown"
          }`}
        >
          Add Staff
        </button>
      </div>

      {notice && (
        <div className="bg-teal text-cream rounded-sm p-4 mb-6 flex items-center justify-between">
          <p className="text-sm">{notice}</p>
          <button onClick={() => setNotice(null)} className="text-caramel text-sm">Dismiss</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-brown/10 rounded-sm p-6 mb-8 space-y-4 max-w-xl">
          <h2 className="font-display text-xl text-brown">New Staff Member</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-brown mb-1">Full name *</span>
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-brown mb-1">Email *</span>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-brown mb-1">Phone</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-brown mb-1">Role</span>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffMember["role"] })} className="input capitalize">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          </div>

          <div>
            <span className="block text-sm font-medium text-brown mb-2">Permissions (admins get everything automatically)</span>
            <div className="grid sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto border border-brown/10 rounded-sm p-3">
              {permissions.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-brown">
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(p.id)}
                    onChange={(e) =>
                      setSelectedPerms((prev) =>
                        e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                      )
                    }
                  />
                  {p.code}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? "Creating…" : "Create Staff"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-brown/60 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : !showForm ? (
        <div>
          <div className="relative w-full sm:w-64 mb-4">
            <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff name, email, role"
              className="border border-brown/20 rounded-sm pl-9 pr-3 py-2 text-sm bg-white w-full focus:border-teal transition-colors"
            />
          </div>
          <div className="space-y-2">
          {staff
            .filter((s) => {
              const q = search.trim().toLowerCase();
              if (!q) return true;
              return [s.full_name, s.email, s.role, s.phone ?? ""].some((f) => f.toLowerCase().includes(q));
            })
            .map((s) => (
            <div
              key={s.id}
              onClick={() => router.push(`/adminlsc/staff/${s.id}`)}
              className="bg-white border border-brown/10 rounded-sm p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-teal transition-colors card-hover"
            >
              <div className="min-w-0">
                <p className="font-medium text-brown truncate">
                  {s.full_name}{" "}
                  {!s.is_active && <span className="text-xs text-red-700 ml-1">(deactivated)</span>}
                </p>
                <p className="text-xs text-brown/50 truncate">{s.email} {s.phone && `· ${s.phone}`}</p>
              </div>
              <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-teal/10 text-teal capitalize font-medium">
                {s.role}
              </span>
            </div>
          ))}
          </div>
        </div>
      ) : null}

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}
