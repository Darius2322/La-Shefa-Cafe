import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { DEFAULT_STAFF_PASSWORD } from "@/lib/staffDefaults";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { staff_auth_user_id } = (await req.json()) as { staff_auth_user_id: string };
  if (!staff_auth_user_id) {
    return NextResponse.json({ error: "Missing staff_auth_user_id" }, { status: 400 });
  }

  const { error } = await auth.admin.auth.admin.updateUserById(staff_auth_user_id, {
    password: DEFAULT_STAFF_PASSWORD
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, defaultPassword: DEFAULT_STAFF_PASSWORD });
}
