import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display"
});

const body = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://la-shefa-cafe.vercel.app"),
  title: {
    default: "La Shefa Cafe — Eat Quality, Stay Healthy",
    template: "%s"
  },
  description:
    "La Shefa Cafe: fresh café food, coffee, and made-to-order cakes. Order online, book a table, or track your order.",
  openGraph: {
    type: "website",
    siteName: "La Shefa Cafe",
    title: "La Shefa Cafe — Eat Quality, Stay Healthy",
    description:
      "Fresh café food, coffee, and made-to-order cakes. Order online, book a table, or track your order.",
    images: ["/logo.jpg"]
  },
  twitter: {
    card: "summary",
    title: "La Shefa Cafe",
    description: "Eat quality, stay healthy.",
    images: ["/logo.jpg"]
  },
  manifest: "/manifest.json"
};

export const viewport = {
  themeColor: "#194850"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  );
}
