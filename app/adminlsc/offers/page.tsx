"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Offer = {
  id: string;
  title: string;
  description: string | null;
  discount_text: string | null;
  promo_code: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

const EMPTY_FORM = {
  id: "",
  title: "",
  description: "",
  discount_text: "",
  promo_code: "",
  starts_at: "",
  ends_at: "",
  is_active: true
};

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
    setOffers((data as Offer[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startNew() {
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function startEdit(o: Offer) {
    setForm({
      id: o.id,
      title: o.title,
      description: o.description ?? "",
      discount_text: o.discount_text ?? "",
      promo_code: o.promo_code ?? "",
      starts_at: o.starts_at ? o.starts_at.slice(0, 16) : "",
      ends_at: o.ends_at ? o.ends_at.slice(0, 16) : "",
      is_active: o.is_active
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      discount_text: form.discount_text.trim() || null,
      promo_code: form.promo_code.trim() || null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      is_active: form.is_active
    };

    if (form.id) {
      await supabase.from("offers").update(payload).eq("id", form.id);
    } else {
      await supabase.from("offers").insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    load();
  }

  async function toggleActive(o: Offer) {
    await supabase.from("offers").update({ is_active: !o.is_active }).eq("id", o.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this offer permanently?")) return;
    await supabase.from("offers").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-brown">Offers</h1>
        <button onClick={startNew} className="btn-primary">Add Offer</button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white border border-brown/10 rounded-sm p-6 mb-8 space-y-4 max-w-xl">
          <h2 className="font-display text-xl text-brown">{form.id ? "Edit Offer" : "New Offer"}</h2>
          <label className="block">
            <span className="block text-sm font-medium text-brown mb-1">Title *</span>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brown mb-1">Description</span>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-brown mb-1">Discount text</span>
              <input value={form.discount_text} onChange={(e) => setForm({ ...form, discount_text: e.target.value })} className="input" placeholder="e.g. 20% off" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-brown mb-1">Promo code</span>
              <input value={form.promo_code} onChange={(e) => setForm({ ...form, promo_code: e.target.value })} className="input" />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-brown mb-1">Starts</span>
              <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="input" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-brown mb-1">Ends</span>
              <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="input" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-brown">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-brown/60 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : offers.length === 0 ? (
        <p className="text-brown/50 text-sm">No offers yet.</p>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <div key={o.id} className="bg-white border border-brown/10 rounded-sm p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-brown">{o.title} {!o.is_active && <span className="text-xs text-brown/40 ml-2">(inactive)</span>}</p>
                {o.discount_text && <p className="text-sm text-teal">{o.discount_text}</p>}
              </div>
              <div className="flex gap-3 text-sm whitespace-nowrap">
                <button onClick={() => toggleActive(o)} className="text-teal hover:underline">
                  {o.is_active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => startEdit(o)} className="text-teal hover:underline">Edit</button>
                <button onClick={() => remove(o.id)} className="text-red-700 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}
