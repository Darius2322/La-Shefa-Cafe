"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ImagePlus, Eye, EyeOff, Star } from "lucide-react";
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
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [soldCounts, setSoldCounts] = useState<Record<string, number>>({});
  const [uploadPreview, setUploadPreview] = useState<{ name: string; size: string } | null>(null);

  async function loadAll() {
    setLoading(true);
    const [{ data: prods }, { data: cats }, { data: itemRows }] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("categories").select("id, name").eq("kind", "menu").order("sort_order"),
      supabase.from("order_items").select("product_id, quantity")
    ]);
    setProducts((prods as Product[]) ?? []);
    setCategories((cats as Category[]) ?? []);
    const counts: Record<string, number> = {};
    (itemRows ?? []).forEach((r: any) => {
      counts[r.product_id] = (counts[r.product_id] ?? 0) + Number(r.quantity ?? 0);
    });
    setSoldCounts(counts);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: me } = await supabase.from("staff").select("id").eq("auth_user_id", data.user.id).maybeSingle();
      if (me) setCurrentStaffId(me.id);
    });
  }, []);

  function startNew() {
    setForm(EMPTY_FORM);
    setUploadPreview(null);
    setShowForm(true);
  }

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

    const { error: err } = await supabase.from("products").insert({ ...payload, created_by: currentStaffId });

    if (err) {
      setError(`Couldn't save the product: ${err.message}`);
      setSaving(false);
      return;
    }

    setShowForm(false);
    setSaving(false);
    loadAll();
  }

  async function toggleField(e: React.MouseEvent, p: Product, field: "is_hidden" | "is_available" | "is_featured") {
    e.stopPropagation();
    await supabase.from("products").update({ [field]: !p[field] }).eq("id", p.id);
    loadAll();
  }

  const grouped = categories
    .map((c) => ({ category: c, items: products.filter((p) => p.category_id === c.id) }))
    .filter((g) => g.items.length > 0);
  const uncategorized = products.filter((p) => !p.category_id || !categories.some((c) => c.id === p.category_id));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-display-md text-brown">Menu</h1>
        <button onClick={startNew} className="btn-primary">
          <Plus size={16} strokeWidth={2} />
          Add Product
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white border border-brown/10 rounded-sm p-6 mb-8 space-y-4 max-w-xl">
          <h2 className="font-display text-xl text-brown">New Product</h2>
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
              <label className="flex items-center gap-2 border border-dashed border-brown/25 rounded-sm px-4 py-3 text-sm text-brown/60 cursor-pointer hover:border-teal transition-colors w-fit">
                <ImagePlus size={16} strokeWidth={1.75} />
                Choose an image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="hidden"
                />
              </label>
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
        <div className="space-y-8">
          {grouped.map(({ category, items }) => (
            <div key={category.id}>
              <h2 className="font-display text-lg text-brown mb-3">{category.name}</h2>
              <ProductTable items={items} soldCounts={soldCounts} onRowClick={(id) => router.push(`/adminlsc/products/${id}`)} onToggle={toggleField} />
            </div>
          ))}
          {uncategorized.length > 0 && (
            <div>
              <h2 className="font-display text-lg text-brown mb-3">Uncategorized</h2>
              <ProductTable items={uncategorized} soldCounts={soldCounts} onRowClick={(id) => router.push(`/adminlsc/products/${id}`)} onToggle={toggleField} />
            </div>
          )}
        </div>
      )}

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}

function ProductTable({
  items,
  soldCounts,
  onRowClick,
  onToggle
}: {
  items: Product[];
  soldCounts: Record<string, number>;
  onRowClick: (id: string) => void;
  onToggle: (e: React.MouseEvent, p: Product, field: "is_hidden" | "is_available" | "is_featured") => void;
}) {
  return (
    <div className="bg-white border border-brown/10 rounded-sm overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-cream text-brown/60 text-left">
          <tr>
            <th className="p-3 font-medium">Product</th>
            <th className="p-3 font-medium">Price</th>
            <th className="p-3 font-medium">Orders</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium text-right">Quick Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr
              key={p.id}
              onClick={() => onRowClick(p.id)}
              className="border-t border-brown/10 cursor-pointer hover:bg-cream/40 transition-colors"
            >
              <td className="p-3 text-brown">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-sm overflow-hidden bg-brown/5 flex-shrink-0">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brown/20 text-[9px]">No image</div>
                    )}
                  </div>
                  {p.name}
                </div>
              </td>
              <td className="p-3 text-brown whitespace-nowrap">KSh {Number(p.price).toLocaleString()}</td>
              <td className="p-3 text-brown/70 whitespace-nowrap">{soldCounts[p.id] ?? 0} sold</td>
              <td className="p-3 space-x-2">
                {p.is_hidden && <Badge label="Hidden" />}
                {!p.is_available && <Badge label="Unavailable" />}
                {p.is_featured && <Badge label="Featured" tone="caramel" />}
                {!p.is_hidden && p.is_available && !p.is_featured && <Badge label="Live" tone="teal" />}
              </td>
              <td className="p-3 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={(e) => onToggle(e, p, "is_hidden")}
                    className="p-1.5 text-teal hover:text-teal-dark"
                    aria-label={p.is_hidden ? "Show on menu" : "Hide from menu"}
                    title={p.is_hidden ? "Show on menu" : "Hide from menu"}
                  >
                    {p.is_hidden ? <Eye size={15} strokeWidth={1.75} /> : <EyeOff size={15} strokeWidth={1.75} />}
                  </button>
                  <button
                    onClick={(e) => onToggle(e, p, "is_featured")}
                    className={`p-1.5 ${p.is_featured ? "text-caramel" : "text-brown/40 hover:text-caramel"}`}
                    aria-label={p.is_featured ? "Remove from featured" : "Mark as featured"}
                    title={p.is_featured ? "Remove from featured" : "Mark as featured"}
                  >
                    <Star size={15} strokeWidth={1.75} fill={p.is_featured ? "currentColor" : "none"} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
