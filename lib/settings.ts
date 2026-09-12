import { supabase } from "@/lib/supabase";

export type FeatureFlags = {
  booking_enabled: boolean;
};

export type SocialLinks = {
  facebook: string;
  instagram: string;
  tiktok: string;
  x: string;
  youtube: string;
  whatsapp: string;
};

const DEFAULT_FLAGS: FeatureFlags = {
  booking_enabled: true
};

export type ShopLocation = { lat: number | null; lng: number | null };

const DEFAULT_SOCIAL: SocialLinks = {
  facebook: "",
  instagram: "",
  tiktok: "",
  x: "",
  youtube: "",
  whatsapp: ""
};

export function mapsUrlFromLocation(loc: ShopLocation, fallbackAddress?: string | null): string | null {
  if (loc.lat != null && loc.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
  }
  if (fallbackAddress) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackAddress)}`;
  }
  return null;
}

export async function getShopLocation(): Promise<ShopLocation> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "location")
    .maybeSingle();

  if (!data?.value) return { lat: null, lng: null };
  return { lat: data.value.lat ?? null, lng: data.value.lng ?? null };
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "feature_flags")
    .maybeSingle();

  if (!data?.value) return DEFAULT_FLAGS;
  return { ...DEFAULT_FLAGS, ...data.value };
}

export async function getSocialLinks(): Promise<SocialLinks> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "social_links")
    .maybeSingle();

  if (!data?.value) return DEFAULT_SOCIAL;
  return { ...DEFAULT_SOCIAL, ...data.value };
}
