"use client";

import { useEffect, useState } from "react";
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
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [staffPerms, setStaffPerms] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingPermsFor, setEditingPermsFor] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: staffRows }, { data: permRows }, { data: spRows }] = await Promise.all([
      supabase.from("staff").select("*").order("created_at", { ascending: false }),
      supabase.from("permissions").select("*").order("code"),
      supabase.from("staff_permissions").select("staff_id, permission_id")
    ]);
    setStaff((staffRows as StaffMember[]) ?? []);
    setPermissions((permRows as Permission[]) ?? []);
    const map: Record<string, number[]> = {};
    (spRows ?? []).forEach((r: any) => {
      map[r.staff_id] = [...(map[r.staff_id] ?? []), r.permission_id];
    });
    setStaffPerms(map);
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

  async function toggleActive(s: StaffMember) {
    await supabase.from("staff").update({ is_active: !s.is_active }).eq("id", s.id);
    load();
  }

  async function updateRole(s: StaffMember, role: StaffMember["role"]) {
    await supabase.from("staff").update({ role }).eq("id", s.id);
    load();
  }

  async function resetPassword(s: StaffMember) {
    if (!confirm(`Reset ${s.full_name}'s password to the default?`)) return;
    const res = await fetch("/api/admin/staff/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ staff_auth_user_id: s.auth_user_id })
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Couldn't reset password.");
      return;
    }
    alert(`Password reset to default: ${json.defaultPassword}`);
  }

  async function togglePermission(staffId: string, permId: number) {
    const current = staffPerms[staffId] ?? [];
    const has = current.includes(permId);
    if (has) {
      await supabase.from("staff_permissions").delete().eq("staff_id", staffId).eq("permission_id", permId);
    } else {
      await supabase.from("staff_permissions").insert({ staff_id: staffId, permission_id: permId });
    }
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-brown mb-2">Staff</h1>
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
        <div className="space-y-3">
          {staff.map((s) => (
            <div key={s.id} className="bg-white border border-brown/10 rounded-sm p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-brown">
                    {s.full_name}{" "}
                    {!s.is_active && <span className="text-xs text-red-700 ml-1">(deactivated)</span>}
                  </p>
                  <p className="text-xs text-brown/50">{s.email} {s.phone && `· ${s.phone}`}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <select
                    value={s.role}
                    onChange={(e) => updateRole(s, e.target.value as StaffMember["role"])}
                    className="border border-brown/20 rounded-sm text-xs px-2 py-1 bg-white capitalize"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={() => setEditingPermsFor(editingPermsFor === s.id ? null : s.id)} className="text-teal hover:underline">
                    Permissions
                  </button>
                  <button onClick={() => resetPassword(s)} className="text-teal hover:underline">Reset Password</button>
                  <button onClick={() => toggleActive(s)} className={s.is_active ? "text-red-700 hover:underline" : "text-teal hover:underline"}>
                    {s.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </div>

              {editingPermsFor === s.id && s.role !== "admin" && (
                <div className="grid sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-brown/10">
                  {permissions.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm text-brown">
                      <input
                        type="checkbox"
                        checked={(staffPerms[s.id] ?? []).includes(p.id)}
                        onChange={() => togglePermission(s.id, p.id)}
                      />
                      {p.code}
                    </label>
                  ))}
                </div>
              )}
              {editingPermsFor === s.id && s.role === "admin" && (
                <p className="text-xs text-brown/50 mt-4 pt-4 border-t border-brown/10">
                  Admins have full access to everything automatically.
                </p>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}
