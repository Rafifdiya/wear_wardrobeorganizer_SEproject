import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";

export async function PATCH() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createServerClient();
  await supabase
    .from("users")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
