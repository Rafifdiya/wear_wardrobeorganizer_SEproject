import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase-server";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email: rawEmail, password } = await req.json();
    const email = rawEmail?.trim().toLowerCase();
    if (!name || !email || !password)
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });

    const supabase = createServerClient();

    const { data: existing } = await supabase
      .from("users").select("id").ilike("email", email).maybeSingle();
    if (existing)
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });

    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";
    const username = "@" + firstName.toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from("users")
      .insert({ first_name: firstName, last_name: lastName, email, username, password_hash: passwordHash })
      .select().single();
    if (error || !user) throw error;

    const { id: sessionId, expiresAt } = await createSession(user.id);

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
    res.cookies.set(setSessionCookie(sessionId, expiresAt));
    return res;
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
