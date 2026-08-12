import { NextResponse } from "next/server";
import { clearSessionCookieOnResponse } from "@/server/auth/session";
import { jsonOk } from "@/server/api/http";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookieOnResponse(res);
  return res;
}

export async function GET() {
  return jsonOk({ ok: true });
}
