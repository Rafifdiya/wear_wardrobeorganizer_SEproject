import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid)
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

    if (newPassword.length < 5)
      return NextResponse.json({ error: "Password must be at least 5 characters." }, { status: 400 });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const supabase = createServerClient();
    await supabase.from("users").update({ password_hash: passwordHash }).eq("id", user.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[password PATCH]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
