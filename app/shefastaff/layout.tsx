"use client";

import { usePathname } from "next/navigation";
import { StaffShell } from "@/components/StaffShell";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/shefastaff/login";

  if (isLoginPage) return <>{children}</>;
  return <StaffShell>{children}</StaffShell>;
}
