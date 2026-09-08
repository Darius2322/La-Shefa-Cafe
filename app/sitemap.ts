import type { MetadataRoute } from "next";

const BASE_URL = "https://la-shefa-cafe.vercel.app";

const PUBLIC_ROUTES = [
  "",
  "/menu",
  "/cakes",
  "/booking",
  "/track",
  "/offers",
  "/reviews",
  "/faq",
  "/about",
  "/contact",
  "/terms",
  "/privacy"
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7
  }));
}
