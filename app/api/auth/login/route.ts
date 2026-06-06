import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase-server";
import { createSession, setSessionCookie } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const { email, password, rememberDays } = await req.json();
    if (!email || !password)
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });

    const supabase = createServerClient();
    const { data: user } = await supabase
      .from("users").select("*").ilike("email", email).maybeSingle();

    if (!user)
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });

    resetRateLimit(ip);

    const days = typeof rememberDays === "number" ? rememberDays : 7;
    const { id: sessionId, expiresAt } = await createSession(user.id);
    const cookieExpiry = rememberDays ? new Date(Date.now() + days * 86400000) : expiresAt;

    const res = NextResponse.json({
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
    res.cookies.set(setSessionCookie(sessionId, cookieExpiry));
    return res;
  } catch (e) {
    console.error("[login]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
