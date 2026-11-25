import { NextResponse } from "next/server";

/**
 * GET / HEAD /api/health
 *
 * Lightweight connectivity probe used by the Chrome Extension popup.
 * Never triggers Codeforces API calls or consumes distributed rate-limit slots.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "botforces",
    timestamp: Date.now(),
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

