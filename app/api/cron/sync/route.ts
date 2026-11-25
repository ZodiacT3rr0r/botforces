import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getUserInfo, getUserSubmissions } from "@/lib/codeforces";
import { scrapeSourceCode } from "@/lib/scraper";
import { analyzeFailedSubmission } from "@/lib/gemini";
import User from "@/models/User";
import Submission from "@/models/Submission";
import Insight from "@/models/Insight";

/**
 * GET /api/cron/sync?handle=<handle>
 *
 * Sync pipeline:
 * 1. Fetch user info from Codeforces → upsert User document with canonical handleLower
 * 2. Fetch recent submissions → single Submission.bulkWrite upsert round-trip
 * 3. Filter for unsolved failed submissions (WA / TLE) not yet analyzed
 * 4. Throttled scrape of source code for up to 5 candidates
 * 5. Run schema-validated Gemini analysis on each
 * 6. Save Insight document (only recording non-stubbed IDs as permanently analyzed)
 */
export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const rawHandle = searchParams.get("handle")?.trim();

    if (!rawHandle) {
      return NextResponse.json(
        { error: "Missing required parameter: handle" },
        { status: 400 }
      );
    }

    await connectDB();

    // ── Step 1: Fetch and upsert user info with canonical casing ────────

    const cfUser = await getUserInfo(rawHandle);
    const canonicalHandle = cfUser.handle;
    const handleLower = canonicalHandle.toLowerCase();

    await User.findOneAndUpdate(
      { handleLower },
      {
        handle: canonicalHandle,
        handleLower,
        rating: cfUser.rating,
        rank: cfUser.rank,
        maxRating: cfUser.maxRating,
        maxRank: cfUser.maxRank,
        avatar: cfUser.avatar,
        contribution: cfUser.contribution,
        friendOfCount: cfUser.friendOfCount,
        organization: cfUser.organization || "",
        country: cfUser.country || "",
        city: cfUser.city || "",
        registrationTimeSeconds: cfUser.registrationTimeSeconds,
        lastOnlineTimeSeconds: cfUser.lastOnlineTimeSeconds,
      },
      { upsert: true, returnDocument: "after" }
    );

    // ── Step 2: Fetch recent submissions & bulkWrite upsert ─────────────

    const cfSubmissions = await getUserSubmissions(canonicalHandle, 1, 30);

    if (cfSubmissions.length > 0) {
      await Submission.bulkWrite(
        cfSubmissions.map((sub) => ({
          updateOne: {
            filter: { submissionId: sub.id },
            update: {
              $set: {
                handle: canonicalHandle,
                handleLower,
                submissionId: sub.id,
                contestId: sub.contestId || 0,
                problemIndex: sub.problem.index,
                problemName: sub.problem.name,
                problemRating: sub.problem.rating || 0,
                verdict: sub.verdict || "TESTING",
                programmingLanguage: sub.programmingLanguage,
                timeConsumedMillis: sub.timeConsumedMillis,
                memoryConsumedBytes: sub.memoryConsumedBytes,
                passedTestCount: sub.passedTestCount,
                tags: sub.problem.tags,
                creationTimeSeconds: sub.creationTimeSeconds,
              },
            },
            upsert: true,
          },
        })),
        { ordered: false }
      );
    }

    const syncedIds = cfSubmissions.map((s) => s.id);
    const upsertedSubmissions = await Submission.find({
      submissionId: { $in: syncedIds },
    })
      .sort({ creationTimeSeconds: -1 })
      .lean();

    // ── Step 3: Filter unsolved failed submissions not yet analyzed ─────

    const failedVerdicts = ["WRONG_ANSWER", "TIME_LIMIT_EXCEEDED"];

    const [existingInsights, solvedSubmissions] = await Promise.all([
      Insight.find({ handleLower }).select("analyzedSubmissionIds").lean(),
      Submission.find({ handleLower, verdict: "OK" })
        .select("contestId problemIndex")
        .lean(),
    ]);

    const analyzedIds = new Set(
      existingInsights.flatMap((i) => i.analyzedSubmissionIds)
    );
    const solvedSet = new Set(
      solvedSubmissions.map((s) => `${s.contestId}-${s.problemIndex}`)
    );

    const failedSubmissions = upsertedSubmissions.filter(
      (sub) =>
        failedVerdicts.includes(sub.verdict) &&
        !analyzedIds.has(sub.submissionId) &&
        !solvedSet.has(`${sub.contestId}-${sub.problemIndex}`) &&
        sub.contestId > 0
    );

    // ── Step 4 & 5: Throttled scrape and Gemini analysis (cap 5) ────────

    const submissionsToAnalyze = failedSubmissions.slice(0, 5);
    const analysisResults = [];

    for (const sub of submissionsToAnalyze) {
      let sourceCode: string | null = sub.sourceCode || null;
      if (!sourceCode) {
        sourceCode = await scrapeSourceCode(sub.contestId, sub.submissionId);
        if (sourceCode) {
          await Submission.updateOne(
            { submissionId: sub.submissionId },
            { $set: { sourceCode } }
          );
        }
      }

      const analysis = await analyzeFailedSubmission(
        sourceCode ||
          "// Source code could not be scraped due to Codeforces Cloudflare protection.",
        sub.tags,
        sub.verdict,
        sub.problemName
      );

      analysisResults.push({
        submissionId: sub.submissionId,
        problemName: sub.problemName,
        verdict: sub.verdict,
        analysis,
      });
    }

    // ── Step 6: Save insight (only permanently mark non-stub analyses) ──

    if (analysisResults.length > 0) {
      const allTopics = [
        ...new Set(
          analysisResults.flatMap((r) => r.analysis.recommendedTopics)
        ),
      ];

      const combinedReport = analysisResults
        .map(
          (r) =>
            `## ${r.problemName} (${r.verdict})\n\n${r.analysis.performanceReport}`
        )
        .join("\n\n---\n\n");

      const permanentlyAnalyzedIds = analysisResults
        .filter((r) => !r.analysis.isStub)
        .map((r) => r.submissionId);

      await Insight.create({
        handle: canonicalHandle,
        handleLower,
        date: new Date(),
        performanceReport: combinedReport,
        recommendedTopics: allTopics.slice(0, 10),
        analyzedSubmissionIds: permanentlyAnalyzedIds,
      });
    }

    return NextResponse.json({
      success: true,
      handle: canonicalHandle,
      userSynced: true,
      submissionsSynced: upsertedSubmissions.length,
      failedFound: failedSubmissions.length,
      analyzed: analysisResults.length,
      insights:
        analysisResults.length > 0
          ? "New insight generated"
          : "No new failed submissions to analyze",
    });
  } catch (error) {
    console.error("Sync error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
