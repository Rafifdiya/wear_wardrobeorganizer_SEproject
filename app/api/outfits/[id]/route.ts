import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const outfitId = parseInt(id);
  if (isNaN(outfitId)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("outfits").delete().eq("id", outfitId).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
