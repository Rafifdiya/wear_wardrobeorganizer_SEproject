import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const buffer = await file.arrayBuffer();

    const supabase = createServerClient();
    const { error } = await supabase.storage
      .from("avatars").upload(path, buffer, { upsert: true, contentType: file.type });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = data.publicUrl;

    await supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", user.id);
    return NextResponse.json({ avatarUrl });
  } catch (e) {
    console.error("[avatar POST]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
