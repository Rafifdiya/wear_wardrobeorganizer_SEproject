import { cookies } from "next/headers";
import { createServerClient } from "./supabase-server";

const SESSION_COOKIE = "wear_session";
const SESSION_DAYS = 7;

export async function createSession(userId: number) {
  const supabase = createServerClient();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await supabase.from("sessions").insert({ id, user_id: userId, expires_at: expiresAt.toISOString() });
  return { id, expiresAt };
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const supabase = createServerClient();
  const { data } = await supabase
    .from("sessions")
    .select("*, users(*)")
    .eq("id", sessionId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return data?.users ?? null;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    const supabase = createServerClient();
    await supabase.from("sessions").delete().eq("id", sessionId);
  }
}

export function setSessionCookie(sessionId: string, expiresAt: Date) {
  return {
    name: SESSION_COOKIE,
    value: sessionId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    expires: expiresAt,
    path: "/",
  };
}

export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
}
