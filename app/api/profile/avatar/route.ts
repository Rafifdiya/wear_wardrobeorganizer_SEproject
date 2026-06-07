import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";

export async function DELETE() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const supabase = createServerClient();
    if (user.avatar_url) {
      const parts = (user.avatar_url as string).split("avatars/");
      const avatarPath = parts[1];
      if (avatarPath) await supabase.storage.from("avatars").remove([avatarPath]);
    }
    await supabase.from("users").update({ avatar_url: null }).eq("id", user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[avatar DELETE]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

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
