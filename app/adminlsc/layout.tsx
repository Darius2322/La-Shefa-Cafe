"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/adminlsc/login";
  const isReceiptPage = pathname?.includes("/receipt/");

  if (isLoginPage || isReceiptPage) return <>{children}</>;
  return <AdminShell>{children}</AdminShell>;
}
