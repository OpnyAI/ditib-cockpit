// src/app/api/push/config/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY || "";
  return NextResponse.json({ vapidPublicKey: key });
}
