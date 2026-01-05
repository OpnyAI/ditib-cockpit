// src/app/api/push/config/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return NextResponse.json(
      { error: "Missing VAPID_PUBLIC_KEY on server" },
      { status: 500 }
    );
  }

  return NextResponse.json({ vapidPublicKey });
}
