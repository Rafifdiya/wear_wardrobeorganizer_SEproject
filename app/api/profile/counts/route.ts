import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { mode } = await req.json();
    if (mode !== "ai" && mode !== "offline")
      return NextResponse.json({ error: "Invalid mode." }, { status: 400 });

    const supabase = createServerClient();
    await supabase.rpc("increment_counts", { uid: user.id, mode_input: mode });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[counts POST]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
