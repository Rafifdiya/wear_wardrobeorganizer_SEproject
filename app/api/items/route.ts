import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";
import { sanitize } from "@/lib/sanitize";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createServerClient();
  const { data: items, error } = await supabase
    .from("clothing_items").select("*").eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const name = sanitize(body.name);
    const category = sanitize(body.category);
    const color = sanitize(body.color);
    const season = sanitize(body.season);
    const occasion = sanitize(body.occasion);
    const styleTag = sanitize(body.styleTag ?? "");
    const imageUrl = body.imageUrl ?? null;
    if (!name || !category || !color || !season || !occasion)
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

    const supabase = createServerClient();
    const { data: item, error } = await supabase
      .from("clothing_items")
      .insert({ user_id: user.id, name, category, color, season, occasion, style_tag: styleTag, image_url: imageUrl })
      .select().single();
    if (error || !item) throw error;
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("[items POST]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
