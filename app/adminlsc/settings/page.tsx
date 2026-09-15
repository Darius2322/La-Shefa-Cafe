"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SubTabs } from "@/components/SubTabs";

type Contact = { phone: string; whatsapp: string; email: string; address: string; hours: string };
type Social = { facebook: string; instagram: string; tiktok: string; x: string; youtube: string; whatsapp: string };

const EMPTY_CONTACT: Contact = { phone: "", whatsapp: "", email: "", address: "", hours: "" };
const EMPTY_SOCIAL: Social = { facebook: "", instagram: "", tiktok: "", x: "", youtube: "", whatsapp: "" };

export default function AdminSettingsPage() {
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [social, setSocial] = useState<Social>(EMPTY_SOCIAL);
  const [loading, setLoading] = useState(true);
  const [savingContact, setSavingContact] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [terms, setTerms] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [termsVersion, setTermsVersion] = useState(0);
  const [privacyVersion, setPrivacyVersion] = useState(0);
  const [savingLegal, setSavingLegal] = useState<"terms" | "privacy" | null>(null);

  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [locating, setLocating] = useState(false);

  const [printMode, setPrintMode] = useState<"manual" | "automatic">("manual");
  const [receiptWidth, setReceiptWidth] = useState<"screen" | "58mm" | "80mm">("80mm");
  const [savingReceipt, setSavingReceipt] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: settings }, { data: legalDocs }] = await Promise.all([
      supabase.from("site_settings").select("*").in("key", ["contact", "feature_flags", "social_links", "location", "receipt_settings"]),
      supabase.from("legal_documents").select("*").eq("is_current", true)
    ]);

    const map = Object.fromEntries((settings ?? []).map((s: any) => [s.key, s.value]));
    setContact({ ...EMPTY_CONTACT, ...(map.contact ?? {}) });
    setSocial({ ...EMPTY_SOCIAL, ...(map.social_links ?? {}) });
    setLat(map.location?.lat != null ? String(map.location.lat) : "");
    setLng(map.location?.lng != null ? String(map.location.lng) : "");
    setPrintMode(map.receipt_settings?.print_mode ?? "manual");
    setReceiptWidth(map.receipt_settings?.width ?? "80mm");

    const termsDoc = (legalDocs ?? []).find((d: any) => d.doc_type === "terms");
    const privacyDoc = (legalDocs ?? []).find((d: any) => d.doc_type === "privacy");
    setTerms(termsDoc?.content ?? "");
    setTermsVersion(termsDoc?.version ?? 0);
    setPrivacy(privacyDoc?.content ?? "");
    setPrivacyVersion(privacyDoc?.version ?? 0);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setSavingContact(true);
    await supabase.from("site_settings").update({ value: contact }).eq("key", "contact");
    setSavingContact(false);
    flashSaved();
  }

  async function saveLegal(docType: "terms" | "privacy") {
    setSavingLegal(docType);
    const content = docType === "terms" ? terms : privacy;
    const currentVersion = docType === "terms" ? termsVersion : privacyVersion;

    await supabase.from("legal_documents").update({ is_current: false }).eq("doc_type", docType).eq("is_current", true);
    await supabase.from("legal_documents").insert({
      doc_type: docType,
      content,
      version: currentVersion + 1,
      is_current: true
    });

    if (docType === "terms") setTermsVersion(currentVersion + 1);
    else setPrivacyVersion(currentVersion + 1);

    setSavingLegal(null);
    flashSaved();
  }

  async function saveSocial(e: React.FormEvent) {
    e.preventDefault();
    setSavingSocial(true);
    await supabase.from("site_settings").update({ value: social }).eq("key", "social_links");
    setSavingSocial(false);
    flashSaved();
  }

  async function saveLocation(e: React.FormEvent) {
    e.preventDefault();
    setSavingLocation(true);
    await supabase
      .from("site_settings")
      .update({ value: { lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null } })
      .eq("key", "location");
    setSavingLocation(false);
    flashSaved();
  }

  async function saveReceiptSettings() {
    setSavingReceipt(true);
    // upsert (not update): "receipt_settings" is a new settings key that may
    // not have a row yet on projects created before this feature existed.
    await supabase
      .from("site_settings")
      .upsert({ key: "receipt_settings", value: { print_mode: printMode, width: receiptWidth } }, { onConflict: "key" });
    setSavingReceipt(false);
    flashSaved();
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function flashSaved() {
    setSavedMsg("Saved");
    setTimeout(() => setSavedMsg(null), 1500);
  }

  if (loading) return <p className="text-brown/50 text-sm">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-display-md text-brown mb-2">Site Settings</h1>
      {savedMsg && <p className="text-teal text-sm mb-4">{savedMsg}</p>}

      <SubTabs
        tabs={[
          {
            label: "General",
            content: (
              <div className="space-y-10">
                <section>
                  <h2 className="font-display text-xl text-brown mb-4">Contact Information</h2>
                  <form onSubmit={saveContact} className="bg-white border border-brown/10 rounded-sm p-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="block text-sm font-medium text-brown mb-1">Phone</span>
                        <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="input" />
                      </label>
                      <label className="block">
                        <span className="block text-sm font-medium text-brown mb-1">WhatsApp</span>
                        <input value={contact.whatsapp} onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })} className="input" />
                      </label>
                    </div>
                    <label className="block">
                      <span className="block text-sm font-medium text-brown mb-1">Email</span>
                      <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="input" />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium text-brown mb-1">Address</span>
                      <input value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} className="input" />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium text-brown mb-1">Opening Hours</span>
                      <textarea rows={2} value={contact.hours} onChange={(e) => setContact({ ...contact, hours: e.target.value })} className="input" placeholder="Mon-Sat 7am-8pm, Sun 8am-6pm" />
                    </label>
                    <button type="submit" disabled={savingContact} className="btn-primary disabled:opacity-50">
                      {savingContact ? "Saving…" : "Save Contact Info"}
                    </button>
                  </form>
                </section>
              </div>
            )
          },
          {
            label: "Location",
            content: (
              <section>
                <h2 className="font-display text-xl text-brown mb-4">Shop Location (Map Pin)</h2>
                <form onSubmit={saveLocation} className="bg-white border border-brown/10 rounded-sm p-5 space-y-4">
                  <p className="text-xs text-brown/50">
                    Customers never see these coordinates directly — they'll just get a "View on Google Maps" button that opens your exact pin.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-sm font-medium text-brown mb-1">Latitude</span>
                      <input value={lat} onChange={(e) => setLat(e.target.value)} className="input" placeholder="-1.2921" />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium text-brown mb-1">Longitude</span>
                      <input value={lng} onChange={(e) => setLng(e.target.value)} className="input" placeholder="36.8219" />
                    </label>
                  </div>
                  <button type="button" onClick={useCurrentLocation} disabled={locating} className="text-sm text-teal hover:underline disabled:opacity-50">
                    {locating ? "Getting location…" : "📍 Use my current location"}
                  </button>
                  {lat && lng && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-teal hover:underline"
                    >
                      Preview on Google Maps →
                    </a>
                  )}
                  <button type="submit" disabled={savingLocation} className="btn-primary disabled:opacity-50">
                    {savingLocation ? "Saving…" : "Save Location"}
                  </button>
                </form>
              </section>
            )
          },
          {
            label: "Social",
            content: (
              <section>
                <h2 className="font-display text-xl text-brown mb-4">Social Media</h2>
                <form onSubmit={saveSocial} className="bg-white border border-brown/10 rounded-sm p-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-sm font-medium text-brown mb-1">Facebook URL</span>
                      <input value={social.facebook} onChange={(e) => setSocial({ ...social, facebook: e.target.value })} className="input" placeholder="https://facebook.com/…" />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium text-brown mb-1">Instagram URL</span>
                      <input value={social.instagram} onChange={(e) => setSocial({ ...social, instagram: e.target.value })} className="input" placeholder="https://instagram.com/…" />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium text-brown mb-1">TikTok URL</span>
                      <input value={social.tiktok} onChange={(e) => setSocial({ ...social, tiktok: e.target.value })} className="input" placeholder="https://tiktok.com/@…" />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium text-brown mb-1">X (Twitter) URL</span>
                      <input value={social.x} onChange={(e) => setSocial({ ...social, x: e.target.value })} className="input" placeholder="https://x.com/…" />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium text-brown mb-1">YouTube URL</span>
                      <input value={social.youtube} onChange={(e) => setSocial({ ...social, youtube: e.target.value })} className="input" placeholder="https://youtube.com/@…" />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium text-brown mb-1">WhatsApp link</span>
                      <input value={social.whatsapp} onChange={(e) => setSocial({ ...social, whatsapp: e.target.value })} className="input" placeholder="https://wa.me/2547…" />
                    </label>
                  </div>
                  <button type="submit" disabled={savingSocial} className="btn-primary disabled:opacity-50">
                    {savingSocial ? "Saving…" : "Save Social Links"}
                  </button>
                </form>
              </section>
            )
          },
          {
            label: "Legal",
            content: (
              <div className="space-y-10">
                <section>
                  <h2 className="font-display text-xl text-brown mb-4">Terms &amp; Conditions</h2>
                  <div className="bg-white border border-brown/10 rounded-sm p-5 space-y-3">
                    <p className="text-xs text-brown/50">Current version: {termsVersion}</p>
                    <textarea rows={8} value={terms} onChange={(e) => setTerms(e.target.value)} className="input" />
                    <button onClick={() => saveLegal("terms")} disabled={savingLegal === "terms"} className="btn-primary disabled:opacity-50">
                      {savingLegal === "terms" ? "Publishing…" : "Publish New Version"}
                    </button>
                  </div>
                </section>

                <section>
                  <h2 className="font-display text-xl text-brown mb-4">Privacy Policy</h2>
                  <div className="bg-white border border-brown/10 rounded-sm p-5 space-y-3">
                    <p className="text-xs text-brown/50">Current version: {privacyVersion}</p>
                    <textarea rows={8} value={privacy} onChange={(e) => setPrivacy(e.target.value)} className="input" />
                    <button onClick={() => saveLegal("privacy")} disabled={savingLegal === "privacy"} className="btn-primary disabled:opacity-50">
                      {savingLegal === "privacy" ? "Publishing…" : "Publish New Version"}
                    </button>
                  </div>
                </section>
              </div>
            )
          },
          {
            label: "Receipts",
            content: (
              <section>
                <h2 className="font-display text-xl text-brown mb-4">Receipt Printing</h2>
                <div className="bg-white border border-brown/10 rounded-sm p-5 space-y-6 max-w-md">
                  <div>
                    <span className="block text-sm font-medium text-brown mb-2">Printing mode</span>
                    <div className="flex gap-2">
                      {(["manual", "automatic"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setPrintMode(m)}
                          className={`px-4 py-2 rounded-sm text-sm font-medium capitalize transition-colors ${
                            printMode === m ? "bg-teal text-cream" : "bg-brown/5 text-brown"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    {printMode === "automatic" && (
                      <p className="text-xs text-brown/50 mt-2">
                        The receipt will open and trigger your browser's print dialog right after a POS sale completes.
                        Browsers can't silently print without that dialog — the cashier still confirms the print.
                        For true silent printing, a local print-bridge/printer integration needs to be added on the till device.
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-brown mb-2">Default receipt width</span>
                    <div className="flex gap-2">
                      {(["screen", "58mm", "80mm"] as const).map((w) => (
                        <button
                          key={w}
                          onClick={() => setReceiptWidth(w)}
                          className={`px-4 py-2 rounded-sm text-sm font-medium capitalize transition-colors ${
                            receiptWidth === w ? "bg-teal text-cream" : "bg-brown/5 text-brown"
                          }`}
                        >
                          {w === "screen" ? "Screen" : w}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-brown/50 mt-2">
                      Staff can still switch the width on any individual receipt before printing — this is just the default.
                    </p>
                  </div>

                  <button onClick={saveReceiptSettings} disabled={savingReceipt} className="btn-primary disabled:opacity-50">
                    {savingReceipt ? "Saving…" : "Save Receipt Settings"}
                  </button>
                </div>
              </section>
            )
          }
        ]}
      />

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}
