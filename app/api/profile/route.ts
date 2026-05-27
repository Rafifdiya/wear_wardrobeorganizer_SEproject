import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";
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
      },
    });
  } catch (e) {
    console.error("[profile PATCH]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
