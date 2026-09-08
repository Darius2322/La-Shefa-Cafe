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

const DEFAULT_SOCIAL: SocialLinks = {
  facebook: "",
  instagram: "",
  tiktok: "",
  x: "",
  youtube: "",
  whatsapp: ""
};

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
