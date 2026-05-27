import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getSession, clearSessionCookie } from "@/lib/auth";
import { sanitize } from "@/lib/sanitize";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({
    user: {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`.trim(),
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      username: user.username,
      bio: user.bio ?? "",
      avatar: user.avatar_url ?? null,
      generatedCount: user.generated_count ?? 0,
      aiCount: user.ai_count ?? 0,
      offlineCount: user.offline_count ?? 0,
      prefOccasion: user.pref_occasion ?? "casual",
      prefSeason: user.pref_season ?? "all",
      prefMood: user.pref_mood ?? "balanced",
    },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.firstName !== undefined) updates.first_name = sanitize(body.firstName);
    if (body.lastName !== undefined) updates.last_name = sanitize(body.lastName);
    if (body.email !== undefined) updates.email = sanitize(body.email);
    if (body.bio !== undefined) updates.bio = sanitize(body.bio);
    if (body.prefOccasion !== undefined) updates.pref_occasion = sanitize(body.prefOccasion);
    if (body.prefSeason !== undefined) updates.pref_season = sanitize(body.prefSeason);
    if (body.prefMood !== undefined) updates.pref_mood = sanitize(body.prefMood);

    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });

    const supabase = createServerClient();
    const { data: updated, error } = await supabase
      .from("users").update(updates).eq("id", user.id).select().single();
    if (error || !updated) throw error;

    return NextResponse.json({
      user: {
        id: updated.id,
        name: `${updated.first_name} ${updated.last_name}`.trim(),
        firstName: updated.first_name,
        lastName: updated.last_name,
        email: updated.email,
        username: updated.username,
        bio: updated.bio ?? "",
        avatar: updated.avatar_url ?? null,
        generatedCount: updated.generated_count ?? 0,
        aiCount: updated.ai_count ?? 0,
        offlineCount: updated.offline_count ?? 0,
        prefOccasion: updated.pref_occasion ?? "casual",
        prefSeason: updated.pref_season ?? "all",
        prefMood: updated.pref_mood ?? "balanced",
      },
    });
  } catch (e) {
    console.error("[profile PATCH]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const supabase = createServerClient();

    // 1. Get all clothing images to clean up storage
    const { data: items } = await supabase
      .from("clothing_items")
      .select("image_url")
      .eq("user_id", user.id);

    if (items && items.length > 0) {
      const paths = items
        .filter((i: { image_url: string | null }) => i.image_url)
        .map((i: { image_url: string }) => {
          const parts = i.image_url.split("clothing-images/");
          return parts[1] ?? "";
        })
        .filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from("clothing-images").remove(paths);
      }
    }

    // 2. Delete avatar from storage
    if (user.avatar_url) {
      const parts = (user.avatar_url as string).split("avatars/");
      const avatarPath = parts[1];
      if (avatarPath) {
        await supabase.storage.from("avatars").remove([avatarPath]);
      }
    }

    // 3. Delete user — cascade handles sessions, clothing_items, outfits, outfit_items
    await supabase.from("users").delete().eq("id", user.id);

    // 4. Clear session cookie
    const res = NextResponse.json({ ok: true });
    res.cookies.set(clearSessionCookie());
    return res;
  } catch (e) {
    console.error("[profile DELETE]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
