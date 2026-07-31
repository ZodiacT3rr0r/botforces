import { NextRequest, NextResponse } from "next/server";
import { getContestList } from "@/lib/codeforces";

/**
 * GET /api/contests?gym=false
 *
 * Returns a list of Codeforces contests, sorted by start time (most recent first).
 * Optionally filter by gym contests.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gym = searchParams.get("gym") === "true";

    const contests = await getContestList(gym);

    // Sort by start time descending (most recent first)
    const sorted = contests.sort(
      (a, b) => (b.startTimeSeconds || 0) - (a.startTimeSeconds || 0)
    );

    return NextResponse.json({
      success: true,
      count: sorted.length,
      contests: sorted,
    });
  } catch (error) {
    console.error("Contest list error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
