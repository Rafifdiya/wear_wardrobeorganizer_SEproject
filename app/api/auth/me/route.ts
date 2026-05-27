import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email,
        username: user.username,
        bio: user.bio ?? "",
        avatar: user.avatar_url ?? null,
        generatedCount: user.generated_count ?? 0,
        aiCount: user.ai_count ?? 0,
        offlineCount: user.offline_count ?? 0,
      },
    });
  } catch (e) {
    console.error("[me]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
