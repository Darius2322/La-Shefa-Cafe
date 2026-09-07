import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return { ok: false as const, status: 401, message: "Missing auth token" };

  const admin = getSupabaseAdmin();
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) {
    return { ok: false as const, status: 401, message: "Invalid session" };
  }

  const { data: staffRow } = await admin
    .from("staff")
    .select("id, role, is_active")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (!staffRow || !staffRow.is_active || staffRow.role !== "admin") {
    return { ok: false as const, status: 403, message: "Admin access required" };
  }

  return { ok: true as const, admin, userId: userData.user.id };
}
