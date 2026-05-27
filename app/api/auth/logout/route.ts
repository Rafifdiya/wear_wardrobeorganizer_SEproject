import { NextResponse } from "next/server";
import { deleteSession, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    await deleteSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(clearSessionCookie());
    return res;
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
