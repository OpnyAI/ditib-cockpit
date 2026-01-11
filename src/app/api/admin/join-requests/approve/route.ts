import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Forward to the new endpoint to avoid breaking older UI calls
  const url = new URL(req.url);
  url.pathname = "/api/admin/join-requests/decide";

  const body = await req.text(); // keep raw
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "content-type": req.headers.get("content-type") ?? "application/json",
    },
    body,
  });

  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: res.headers });
}
