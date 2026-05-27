import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createServerClient();
  const { data: outfits, error } = await supabase
    .from("outfits").select("*, outfit_items(clothing_items(*))").eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (outfits ?? []).map(o => ({
    ...o,
    pieces: (o.outfit_items ?? []).map((oi: { clothing_items: unknown }) => oi.clothing_items),
    outfit_items: undefined,
  }));

  return NextResponse.json({ outfits: result });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { name, occasion, season, mode, pieceIds } = await req.json();
    if (!name || !occasion || !season || !mode || !Array.isArray(pieceIds))
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

    const supabase = createServerClient();
    const { data: outfit, error } = await supabase
      .from("outfits").insert({ user_id: user.id, name, occasion, season, mode })
      .select().single();
    if (error || !outfit) throw error;

    if (pieceIds.length > 0) {
      await supabase.from("outfit_items").insert(
        pieceIds.map((id: number) => ({ outfit_id: outfit.id, clothing_item_id: id }))
      );
    }

    return NextResponse.json({ outfit }, { status: 201 });
  } catch (e) {
    console.error("[outfits POST]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
