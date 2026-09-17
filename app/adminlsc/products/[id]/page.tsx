"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Eye, EyeOff, Star, Trash2, ShoppingBag, Tag } from "lucide-react";
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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addedBy, setAddedBy] = useState<string | null>(null);
  const [soldCount, setSoldCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", category_id: "", price: "", description: "", image_url: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase.from("categories").select("id, name").eq("kind", "menu").order("sort_order")
    ]);
    if (!p) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setProduct(p as Product);
    setCategories((cats as Category[]) ?? []);
    setForm({
      name: p.name,
      category_id: p.category_id ?? "",
      price: String(p.price),
      description: p.description ?? "",
      image_url: p.image_url ?? ""
    });

    if (p.created_by) {
      const { data: staffRow } = await supabase.from("staff").select("full_name").eq("id", p.created_by).maybeSingle();
      setAddedBy(staffRow?.full_name ?? null);
    }
    const { data: itemRows } = await supabase.from("order_items").select("quantity").eq("product_id", id);
    setSoldCount((itemRows ?? []).reduce((s: number, r: any) => s + Number(r.quantity ?? 0), 0));

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleImageUpload(file: File) {
    setError(null);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("That image is too large — please use a file under 5MB.");
      return;
    }
    setForm((f) => ({ ...f, image_url: URL.createObjectURL(file) }));
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `products/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("product-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });
    if (uploadErr) {
      setError(
        uploadErr.message?.toLowerCase().includes("permission") || uploadErr.message?.toLowerCase().includes("policy")
          ? "You don't have permission to upload product images. Ask an admin to grant you the products.manage permission."
          : "Couldn't upload the image — check your connection and try again."
      );
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: err } = await supabase
      .from("products")
      .update({
        name: form.name.trim(),
        category_id: form.category_id || null,
        price: Number(form.price),
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null
      })
      .eq("id", id);

    if (err) {
      setError(`Couldn't save changes: ${err.message}`);
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditing(false);
    load();
  }

  async function toggleField(field: "is_hidden" | "is_available" | "is_featured") {
    if (!product) return;
    await supabase.from("products").update({ [field]: !product[field] }).eq("id", id);
    setProduct((prev) => (prev ? { ...prev, [field]: !prev[field] } : prev));
  }

  async function deleteProduct() {
    if (!confirm("Delete this product permanently? This cannot be undone.")) return;
    await supabase.from("products").delete().eq("id", id);
    router.push("/adminlsc/products");
  }

  if (loading) return <p className="text-brown/50 text-sm">Loading…</p>;
  if (notFound || !product) {
    return (
      <div>
        <Link href="/adminlsc/products" className="inline-flex items-center gap-1.5 text-sm text-brown/60 hover:text-brown mb-4">
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Menu
        </Link>
        <p className="text-brown/50 text-sm">Product not found.</p>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === product.category_id)?.name ?? "Uncategorized";

  return (
    <div>
      <Link href="/adminlsc/products" className="inline-flex items-center gap-1.5 text-sm text-brown/60 hover:text-brown mb-4">
        <ArrowLeft size={15} strokeWidth={2} />
        Back to Menu
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <h1 className="font-display text-display-md text-brown">{product.name}</h1>
        <div className="flex flex-wrap gap-2">
          {product.is_hidden && <Badge label="Hidden" />}
          {!product.is_available && <Badge label="Unavailable" />}
          {product.is_featured && <Badge label="Featured" tone="caramel" />}
          {!product.is_hidden && product.is_available && !product.is_featured && <Badge label="Live" tone="teal" />}
        </div>
      </div>
      <p className="text-sm text-brown/60 mb-6 flex items-center gap-1.5">
        <Tag size={13} strokeWidth={1.75} />
        {categoryName} · KSh {Number(product.price).toLocaleString()}
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        <button onClick={() => setEditing((v) => !v)} className="btn-primary !py-2 !px-4 text-sm">
          {editing ? "Cancel Edit" : "Edit Product"}
        </button>
        <button onClick={() => toggleField("is_hidden")} className="btn-outline !text-brown !border-brown/30 !py-2 !px-4 text-sm">
          {product.is_hidden ? <Eye size={15} strokeWidth={1.75} /> : <EyeOff size={15} strokeWidth={1.75} />}
          {product.is_hidden ? "Show on Menu" : "Hide from Menu"}
        </button>
        <button onClick={() => toggleField("is_featured")} className="btn-outline !text-brown !border-brown/30 !py-2 !px-4 text-sm">
          <Star size={15} strokeWidth={1.75} />
          {product.is_featured ? "Remove from Featured" : "Mark as Featured"}
        </button>
        <button onClick={() => toggleField("is_available")} className="btn-outline !text-brown !border-brown/30 !py-2 !px-4 text-sm">
          {product.is_available ? "Mark Out of Stock" : "Mark Available"}
        </button>
        <button onClick={deleteProduct} className="!py-2 !px-4 text-sm rounded-sm bg-red-50 text-red-700 inline-flex items-center gap-1.5">
          <Trash2 size={15} strokeWidth={1.75} />
          Delete
        </button>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="bg-white border border-brown/10 rounded-sm p-6 space-y-4 max-w-xl">
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
                <img src={form.image_url} alt={form.name} className="w-40 h-40 object-cover rounded-sm border border-brown/10" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, image_url: "" }))} className="text-xs text-teal hover:underline mt-1">
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
            {uploading && <span className="block text-xs text-brown/50 mt-1">Uploading…</span>}
          </label>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={saving || uploading} className="btn-primary disabled:opacity-50">
            {saving ? "Saving…" : uploading ? "Waiting for upload…" : "Save Changes"}
          </button>
        </form>
      ) : (
        <div className="grid sm:grid-cols-[220px_1fr] gap-6 max-w-3xl">
          <div className="relative w-full aspect-square rounded-sm overflow-hidden border border-brown/10 bg-brown/5">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brown/30 text-xs">No image</div>
            )}
          </div>
          <div className="space-y-4">
            <div className="bg-white border border-brown/10 rounded-sm p-5">
              <p className="text-xs font-semibold text-brown/60 mb-2 uppercase tracking-wide">Description</p>
              <p className="text-sm text-brown">{product.description || "No description added yet."}</p>
            </div>
            <div className="bg-white border border-brown/10 rounded-sm p-5 grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-brown/60 mb-1 uppercase tracking-wide flex items-center gap-1.5">
                  <ShoppingBag size={13} strokeWidth={1.75} />
                  Orders
                </p>
                <p className="text-sm text-brown">{soldCount ?? 0} sold in total</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-brown/60 mb-1 uppercase tracking-wide">Added</p>
                <p className="text-sm text-brown">
                  {new Date(product.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  {addedBy && ` by ${addedBy}`}
                </p>
              </div>
            </div>
          </div>
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
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${colors[tone]}`}>{label}</span>;
}
