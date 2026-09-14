"use client";

// Cake Requests now lives as a tab inside Orders (see /adminlsc/orders).
// This route is kept working as a direct link/bookmark, redirecting there.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminCakesRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/adminlsc/orders?tab=cakes");
  }, [router]);
  return <p className="text-brown/50 text-sm">Redirecting to Orders…</p>;
}
