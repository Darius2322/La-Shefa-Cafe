"use client";

import { useEffect, useState, Fragment } from "react";
import { Search, ChevronDown, ChevronUp, Plus, Flag } from "lucide-react";
import { supabase } from "@/lib/supabase";

const STATUSES = ["open", "investigating", "resolved", "dismissed"];

type Complaint = {
  id: string;
  complaint_number: string;
  customer_name: string;
  customer_phone: string;
  related_order_number: string | null;
  subject: string;
  description: string | null;
  status: string;
  resolution_notes: string | null;
  created_at: string;
};

const EMPTY_FORM = { customer_name: "", customer_phone: "", related_order_number: "", subject: "", description: "" };

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      // Most likely cause: the migrations/001_complaints_table.sql migration
      // hasn't been run against this Supabase project yet.
      setTableMissing(true);
      setLoading(false);
      return;
    }
    setComplaints((data as Complaint[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from("complaints").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("complaints").insert({
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      related_order_number: form.related_order_number.trim() || null,
      subject: form.subject.trim(),
      description: form.description.trim() || null
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
    load();
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? complaints.filter((c) =>
        [c.complaint_number, c.customer_name, c.customer_phone, c.subject].some((f) => f.toLowerCase().includes(q))
      )
    : complaints;

  if (tableMissing) {
    return (
      <div>
        <h1 className="font-display text-display-md text-brown mb-6">Complaints</h1>
        <div className="border border-dashed border-brown/25 rounded-sm p-8 max-w-lg">
          <Flag size={24} strokeWidth={1.5} className="text-brown/30 mb-3" />
          <p className="font-display text-lg text-brown mb-2">Complaints table not set up yet</p>
          <p className="text-sm text-brown/60 mb-3">
            This feature needs a one-time database migration. Run{" "}
            <code className="bg-brown/5 px-1.5 py-0.5 rounded text-xs">migrations/001_complaints_table.sql</code>{" "}
            in your Supabase project's SQL editor, then reload this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-display-md text-brown">Complaints</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          <Plus size={16} strokeWidth={2} />
          Log Complaint
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-brown/10 rounded-sm p-6 mb-8 space-y-4 max-w-xl">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-brown mb-1">Customer name *</span>
              <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="input" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-brown mb-1">Phone *</span>
              <input required value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className="input" />
            </label>
          </div>
          <label className="block">
            <span className="block text-sm font-medium text-brown mb-1">Related order # (optional)</span>
            <input value={form.related_order_number} onChange={(e) => setForm({ ...form, related_order_number: e.target.value })} className="input" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brown mb-1">Subject *</span>
            <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brown mb-1">Details</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input" />
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? "Saving…" : "Save Complaint"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-brown/60 text-sm">Cancel</button>
          </div>
          <style>{`.input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }`}</style>
        </form>
      )}

      <div className="relative w-full sm:w-64 mb-6">
        <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search complaint #, name, subject"
          className="border border-brown/20 rounded-sm pl-9 pr-3 py-2 text-sm bg-white w-full focus:border-teal transition-colors"
        />
      </div>

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-brown/50 text-sm">No complaints in this view.</p>
      ) : (
        <div className="bg-white border border-brown/10 rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-cream text-brown/60 text-left">
              <tr>
                <th className="p-3 font-medium">Complaint #</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Subject</th>
                <th className="p-3 font-medium">Logged</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <Fragment key={c.id}>
                  <tr
                    className="border-t border-brown/10 cursor-pointer hover:bg-cream/40 transition-colors"
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    <td className="p-3 text-teal font-medium whitespace-nowrap">{c.complaint_number}</td>
                    <td className="p-3 text-brown">
                      <p>{c.customer_name}</p>
                      <p className="text-xs text-brown/50">{c.customer_phone}</p>
                    </td>
                    <td className="p-3 text-brown">{c.subject}</td>
                    <td className="p-3 text-brown/70 text-xs whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={c.status}
                        onChange={(e) => updateStatus(c.id, e.target.value)}
                        className="border border-brown/20 rounded-sm text-xs px-2 py-1 bg-white capitalize"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-right text-brown/40">
                      {expandedId === c.id ? <ChevronUp size={16} strokeWidth={1.75} /> : <ChevronDown size={16} strokeWidth={1.75} />}
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr className="bg-cream/50 border-t border-brown/5">
                      <td colSpan={6} className="p-5" onClick={(e) => e.stopPropagation()}>
                        {c.related_order_number && (
                          <p className="text-xs text-brown/60 mb-2">Related order: <span className="text-teal">{c.related_order_number}</span></p>
                        )}
                        {c.description && <p className="text-sm text-brown/80">{c.description}</p>}
                        {c.resolution_notes && (
                          <p className="text-xs text-brown/60 mt-2">Resolution: {c.resolution_notes}</p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
