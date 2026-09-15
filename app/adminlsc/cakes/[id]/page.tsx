"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft, MessageCircle, CakeSlice, User, Image as ImageIcon, CalendarClock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SubTabs } from "@/components/SubTabs";
import { waLink } from "@/lib/whatsapp";
import { CAKE_STATUSES, CAKE_STATUS_COLORS } from "@/lib/cakeStatus";

type CakeRequest = {
  id: string;
  request_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  cake_type: string;
  size: string | null;
  flavor: string | null;
  design_theme: string | null;
  message_on_cake: string | null;
  quantity: number;
  collection_date: string | null;
  preferred_time: string | null;
  special_instructions: string | null;
  reference_image_url: string | null;
  status: string;
  created_at: string;
};

export default function CakeRequestDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/shefastaff") ? "/shefastaff" : "/adminlsc";
  const id = params.id as string;

  const [request, setRequest] = useState<CakeRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("cake_requests").select("*").eq("id", id).maybeSingle();
    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setRequest(data as CakeRequest);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status: string) {
    await supabase.from("cake_requests").update({ status }).eq("id", id);
    setRequest((prev) => (prev ? { ...prev, status } : prev));
  }

  if (loading) return <p className="text-brown/50 text-sm">Loading…</p>;
  if (notFound || !request) {
    return (
      <div>
        <Link href={`${basePath}/orders?tab=cakes`} className="inline-flex items-center gap-1.5 text-sm text-brown/60 hover:text-brown mb-4">
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Cake Requests
        </Link>
        <p className="text-brown/50 text-sm">Cake request not found.</p>
      </div>
    );
  }

  const r = request;

  return (
    <div>
      <Link href={`${basePath}/orders?tab=cakes`} className="inline-flex items-center gap-1.5 text-sm text-brown/60 hover:text-brown mb-4">
        <ArrowLeft size={15} strokeWidth={2} />
        Back to Cake Requests
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-brown/50">Cake Request</p>
          <h1 className="font-display text-display-md text-teal">{r.request_number}</h1>
          <p className="text-sm text-brown/60 mt-1">{r.customer_name} · {r.customer_phone}</p>
        </div>
        <select
          value={r.status}
          onChange={(e) => updateStatus(e.target.value)}
          className={`rounded-full text-xs px-3 py-1.5 capitalize border font-medium ${CAKE_STATUS_COLORS[r.status] ?? "bg-brown/5 text-brown border-brown/20"}`}
        >
          {CAKE_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <a
          href={waLink(r.customer_phone, `Hi ${r.customer_name}, this is La Shefa Cafe. Your cake request number is ${r.request_number}. Let us know if you need anything!`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary !py-2 !px-4 text-sm"
        >
          <MessageCircle size={15} strokeWidth={1.75} />
          Message on WhatsApp
        </a>
      </div>

      <SubTabs
        tabs={[
          {
            label: "Cake Details",
            icon: CakeSlice,
            content: (
              <div className="grid sm:grid-cols-2 gap-6 max-w-3xl">
                <div className="bg-white border border-brown/10 rounded-sm p-5">
                  <p className="text-xs font-semibold text-brown/60 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                    <CakeSlice size={14} strokeWidth={1.75} />
                    Cake
                  </p>
                  <p className="text-sm text-brown mb-1">{r.cake_type} · ×{r.quantity}</p>
                  {(r.size || r.flavor) && (
                    <p className="text-sm text-brown/70">{[r.size, r.flavor].filter(Boolean).join(" · ")}</p>
                  )}
                  {r.design_theme && (
                    <p className="text-sm text-brown/70 mt-2">Design/theme: <span className="text-brown">{r.design_theme}</span></p>
                  )}
                  {r.message_on_cake && (
                    <p className="text-sm text-brown/70 mt-1">Message on cake: <span className="text-brown">"{r.message_on_cake}"</span></p>
                  )}
                </div>

                <div className="bg-white border border-brown/10 rounded-sm p-5">
                  <p className="text-xs font-semibold text-brown/60 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                    <CalendarClock size={14} strokeWidth={1.75} />
                    Collection
                  </p>
                  <p className="text-sm text-brown mb-1">{r.collection_date || "No date specified"}</p>
                  {r.preferred_time && <p className="text-sm text-brown/70">Preferred time: {r.preferred_time}</p>}
                  <p className="text-xs text-brown/40 mt-2">Requested {new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>

                <div className="bg-white border border-brown/10 rounded-sm p-5">
                  <p className="text-xs font-semibold text-brown/60 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                    <User size={14} strokeWidth={1.75} />
                    Customer
                  </p>
                  <p className="text-sm text-brown mb-1">{r.customer_name}</p>
                  <p className="text-sm text-brown/70">{r.customer_phone}</p>
                  {r.customer_email && <p className="text-sm text-brown/70">{r.customer_email}</p>}
                </div>

                {r.special_instructions && (
                  <div className="bg-white border border-brown/10 rounded-sm p-5">
                    <p className="text-xs font-semibold text-brown/60 mb-3 uppercase tracking-wide">Special Instructions</p>
                    <p className="text-sm text-brown">{r.special_instructions}</p>
                  </div>
                )}
              </div>
            )
          },
          ...(r.reference_image_url
            ? [
                {
                  label: "Reference Image",
                  icon: ImageIcon,
                  content: (
                    <div className="max-w-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.reference_image_url!}
                        alt="Cake reference"
                        onClick={() => setZoomImage(true)}
                        className="w-full rounded-sm border border-brown/10 cursor-zoom-in"
                      />
                      <p className="text-xs text-brown/40 mt-2">Tap the image to view it full size.</p>
                    </div>
                  )
                }
              ]
            : [])
        ]}
      />

      {zoomImage && r.reference_image_url && (
        <div
          className="fixed inset-0 bg-brown/80 flex items-center justify-center z-50 p-4"
          onClick={() => setZoomImage(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.reference_image_url} alt="Cake reference full size" className="max-w-full max-h-full rounded-sm" />
        </div>
      )}
    </div>
  );
}
