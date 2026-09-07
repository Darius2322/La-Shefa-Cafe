import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";

export const DEFAULT_STAFF_PASSWORD = "Staff@lsc321";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const body = await req.json();
  const { full_name, email, phone, role, permission_ids } = body as {
    full_name: string;
    email: string;
    phone?: string;
    role: "admin" | "manager" | "cashier" | "staff";
    permission_ids?: number[];
  };

  if (!full_name?.trim() || !email?.trim() || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { admin } = auth;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: email.trim(),
    password: DEFAULT_STAFF_PASSWORD,
    email_confirm: true
  });

  if (createErr || !created.user) {
    return NextResponse.json(
      { error: createErr?.message || "Could not create the account" },
      { status: 400 }
    );
  }

  const { data: staffRow, error: staffErr } = await admin
    .from("staff")
    .insert({
      auth_user_id: created.user.id,
      full_name: full_name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      role,
      is_active: true
    })
    .select("id")
    .single();

  if (staffErr || !staffRow) {
    // Roll back the auth user if the staff row failed, to avoid an orphaned account.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Could not create the staff record" }, { status: 400 });
  }

  if (permission_ids && permission_ids.length > 0) {
    await admin
      .from("staff_permissions")
      .insert(permission_ids.map((permission_id) => ({ staff_id: staffRow.id, permission_id })));
  }

  return NextResponse.json({ success: true, defaultPassword: DEFAULT_STAFF_PASSWORD });
}
