"use client";

import { useEffect, useState, Fragment } from "react";
import { supabase } from "@/lib/supabase";

type Category = { id: string; name: string };
type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  is_hidden: boolean;
  created_at: string;
  created_by: string | null;
};

const EMPTY_FORM = {
  id: "",
  category_id: "",
  name: "",
  description: "",
  price: "",
  image_url: "",
  is_available: true,
  is_featured: false,
  is_hidden: false
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffNames, setStaffNames] = useState<Record<string, string>>({});
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [soldCounts, setSoldCounts] = useState<Record<string, number>>({});

  async function loadAll() {
    setLoading(true);
    const [{ data: prods }, { data: cats }, { data: staffRows }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name").eq("kind", "menu").order("sort_order"),
      supabase.from("staff").select("id, full_name")
    ]);
    setProducts((prods as Product[]) ?? []);
    setCategories((cats as Category[]) ?? []);
    setStaffNames(Object.fromEntries((staffRows ?? []).map((s: any) => [s.id, s.full_name])));
    setLoading(false);

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      const { data: me } = await supabase
        .from("staff")
        .select("id")
        .eq("auth_user_id", sessionData.session.user.id)
        .maybeSingle();
      setCurrentStaffId(me?.id ?? null);
    }
  }

  async function loadSoldCount(productId: string) {
    if (soldCounts[productId] !== undefined) return;
    const { data } = await supabase.from("order_items").select("quantity").eq("product_id", productId);
    const total = (data ?? []).reduce((s: number, r: any) => s + r.quantity, 0);
    setSoldCounts((prev) => ({ ...prev, [productId]: total }));
  }

  useEffect(() => {
    loadAll();
  }, []);

  function startNew() {
    setForm(EMPTY_FORM);
    setUploadPreview(null);
    setShowForm(true);
  }

  function startEdit(p: Product) {
    setForm({
      id: p.id,
      category_id: p.category_id ?? "",
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      image_url: p.image_url ?? "",
      is_available: p.is_available,
      is_featured: p.is_featured,
      is_hidden: p.is_hidden
    });
    setUploadPreview(null);
    setShowForm(true);
  }

  const [uploadPreview, setUploadPreview] = useState<{ name: string; size: string } | null>(null);

  async function handleImageUpload(file: File) {
    setError(null);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError("That image is too large — please use a file under 5MB.");
      return;
    }

    // Show an instant local preview and file details before the network upload finishes.
    const localPreviewUrl = URL.createObjectURL(file);
    setForm((f) => ({ ...f, image_url: localPreviewUrl }));
    setUploadPreview({ name: file.name, size: `${Math.round(file.size / 1024)} KB` });
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `products/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("product-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

    if (uploadErr) {
      const reason = uploadErr.message?.toLowerCase().includes("permission") || uploadErr.message?.toLowerCase().includes("policy")
        ? "You don't have permission to upload product images. Ask an admin to grant you the products.manage permission."
        : "Couldn't upload the image — check your connection and try again.";
      setError(reason);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
  }

  function clearImage() {
    setForm((f) => ({ ...f, image_url: "" }));
    setUploadPreview(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      category_id: form.category_id || null,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      image_url: form.image_url.trim() || null,
      is_available: form.is_available,
      is_featured: form.is_featured,
      is_hidden: form.is_hidden
    };

    const result = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert({ ...payload, created_by: currentStaffId });

    if (result.error) {
      setError("Couldn't save the product. Please try again.");
      setSaving(false);
      return;
    }

    setShowForm(false);
    setSaving(false);
    loadAll();
  }

  async function toggleField(p: Product, field: "is_hidden" | "is_available" | "is_featured") {
    await supabase.from("products").update({ [field]: !p[field] }).eq("id", p.id);
    loadAll();
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product permanently?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadAll();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-brown">Products</h1>
        <button onClick={startNew} className="btn-primary">Add Product</button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white border border-brown/10 rounded-sm p-6 mb-8 space-y-4 max-w-xl">
          <h2 className="font-display text-xl text-brown">{form.id ? "Edit Product" : "New Product"}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-brown mb-1">Name *</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-brown mb-1">Price (KSh) *</span>
              <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" />
            </label>
          </div>
          <label className="block">
            <span className="block text-sm font-medium text-brown mb-1">Category</span>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input">
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brown mb-1">Description</span>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brown mb-1">Photo</span>
            {form.image_url && (
              <div className="mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image_url} alt="Product" className="w-32 h-32 object-cover rounded-sm border border-brown/10" />
                {uploadPreview && (
                  <p className="text-xs text-brown/50 mt-1">
                    {uploadPreview.name} · {uploadPreview.size}
                    {uploading && " · uploading…"}
                  </p>
                )}
                <button type="button" onClick={clearImage} className="text-xs text-teal hover:underline mt-1">
                  Change image
                </button>
              </div>
            )}
            {!form.image_url && (
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="text-sm"
              />
            )}
            <span className="block text-xs text-brown/40 mt-1">JPG, PNG or WebP, up to 5MB</span>
          </label>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-brown">
              <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
              Available
            </label>
            <label className="flex items-center gap-2 text-sm text-brown">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-brown">
              <input type="checkbox" checked={form.is_hidden} onChange={(e) => setForm({ ...form, is_hidden: e.target.checked })} />
              Hidden from menu
            </label>
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving || uploading} className="btn-primary disabled:opacity-50">
              {saving ? "Saving…" : uploading ? "Waiting for upload…" : "Save"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-brown/60 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-brown/50 text-sm">No products yet. Add your first one above.</p>
      ) : (
        <div className="bg-white border border-brown/10 rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream text-brown/60 text-left">
              <tr>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Price</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <Fragment key={p.id}>
                  <tr className="border-t border-brown/10">
                    <td className="p-3 text-brown">{p.name}</td>
                    <td className="p-3 text-brown">KSh {Number(p.price).toLocaleString()}</td>
                    <td className="p-3 space-x-2">
                      {p.is_hidden && <Badge label="Hidden" />}
                      {!p.is_available && <Badge label="Unavailable" />}
                      {p.is_featured && <Badge label="Featured" tone="caramel" />}
                      {!p.is_hidden && p.is_available && !p.is_featured && <Badge label="Live" tone="teal" />}
                    </td>
                    <td className="p-3 text-right space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => {
                          const next = expandedId === p.id ? null : p.id;
                          setExpandedId(next);
                          if (next) loadSoldCount(p.id);
                        }}
                        className="text-brown/60 hover:underline"
                      >
                        {expandedId === p.id ? "Hide" : "Details"}
                      </button>
                      <button onClick={() => toggleField(p, "is_hidden")} className="text-teal hover:underline">
                        {p.is_hidden ? "Show" : "Hide"}
                      </button>
                      <button onClick={() => startEdit(p)} className="text-teal hover:underline">Edit</button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-700 hover:underline">Delete</button>
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr className="bg-cream/50 border-t border-brown/5">
                      <td colSpan={4} className="p-4 text-xs text-brown/70">
                        <div className="grid sm:grid-cols-3 gap-3">
                          <p>Created: {new Date(p.created_at).toLocaleDateString()} at {new Date(p.created_at).toLocaleTimeString()}</p>
                          <p>Added by: {p.created_by ? staffNames[p.created_by] ?? "Unknown staff" : "Not recorded"}</p>
                          <p>Total units sold: {soldCounts[p.id] ?? "…"}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}

function Badge({ label, tone = "brown" }: { label: string; tone?: "brown" | "teal" | "caramel" }) {
  const colors = {
    brown: "bg-brown/10 text-brown",
    teal: "bg-teal/10 text-teal",
    caramel: "bg-caramel/20 text-brown"
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${colors[tone]}`}>{label}</span>;
}
