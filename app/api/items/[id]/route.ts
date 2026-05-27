import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";
import { sanitize } from "@/lib/sanitize";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const itemId = parseInt(id);
  if (isNaN(itemId)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = sanitize(body.name);
    if (body.category !== undefined) updates.category = sanitize(body.category);
    if (body.color !== undefined) updates.color = sanitize(body.color);
    if (body.season !== undefined) updates.season = sanitize(body.season);
    if (body.occasion !== undefined) updates.occasion = sanitize(body.occasion);
    if (body.styleTag !== undefined) updates.style_tag = sanitize(body.styleTag);
    if (body.imageUrl !== undefined) updates.image_url = body.imageUrl;

    const supabase = createServerClient();
    const { data: item, error } = await supabase
      .from("clothing_items").update(updates)
      .eq("id", itemId).eq("user_id", user.id)
      .select().single();
    if (error || !item) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("[items PATCH]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const itemId = parseInt(id);
  if (isNaN(itemId)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("clothing_items").delete().eq("id", itemId).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
