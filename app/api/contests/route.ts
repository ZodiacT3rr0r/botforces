import { NextRequest, NextResponse } from "next/server";
import { CFContest, getContestList } from "@/lib/codeforces";

const CONTEST_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface ContestCacheEntry {
  contests: CFContest[];
  expiresAt: number;
}

const contestCache = new Map<string, ContestCacheEntry>();

/**
 * GET /api/contests?gym=false&limit=100
 *
 * Returns Codeforces contests sorted by start time descending.
 * Caches results in memory for 1 hour so contest browsing does not burn
 * global Codeforces API rate-limit slots.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gym = searchParams.get("gym") === "true";
    const limitParam = searchParams.get("limit");
    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : NaN;
    const limit =
      !Number.isNaN(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 500)
        : null;

    const cacheKey = gym ? "gym" : "regular";
    const cached = contestCache.get(cacheKey);
    const now = Date.now();

    let sorted: CFContest[];
    if (cached && cached.expiresAt > now) {
      sorted = cached.contests;
    } else {
      const contests = await getContestList(gym);
      sorted = [...contests].sort(
        (a, b) => (b.startTimeSeconds || 0) - (a.startTimeSeconds || 0)
      );
      contestCache.set(cacheKey, {
        contests: sorted,
        expiresAt: now + CONTEST_CACHE_TTL_MS,
      });
    }

    const result = limit ? sorted.slice(0, limit) : sorted;

    return NextResponse.json(
      {
        success: true,
        count: result.length,
        total: sorted.length,
        cached: Boolean(cached && cached.expiresAt > now),
        contests: result,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Contest list error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
