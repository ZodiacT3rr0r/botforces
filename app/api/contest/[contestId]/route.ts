import { NextRequest, NextResponse } from "next/server";
import { getContestStandings } from "@/lib/codeforces";

/**
 * GET /api/contest/[contestId]
 *
 * Returns contest info and problem list using contest.standings endpoint.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contestId: string }> }
) {
  try {
    const { contestId: contestIdStr } = await params;
    const contestId = Number(contestIdStr);

    if (!contestId || isNaN(contestId)) {
      return NextResponse.json(
        { error: "Invalid contest ID" },
        { status: 400 }
      );
    }

    // Use contest.standings to get both contest info and problems
    // We only request 1 row to minimize data transfer
    const standings = await getContestStandings(contestId, 1, 1);

    return NextResponse.json({
      success: true,
      contest: standings.contest,
      problems: standings.problems,
    });
  } catch (error) {
    console.error("Contest detail error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
