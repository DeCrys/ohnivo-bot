import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  await destroySession();
  return NextResponse.redirect(new URL("/", env.NEXT_PUBLIC_APP_URL));
}

export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
