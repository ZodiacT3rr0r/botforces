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
 * 1. Fetch user info from Codeforces → upsert User document
 * 2. Fetch recent submissions → upsert Submission documents
 * 3. Filter for failed submissions (WA / TLE) not yet analyzed
 * 4. Scrape source code for each failed submission
 * 5. Run Gemini analysis on each
 * 6. Save Insight documents
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get("handle");

    if (!handle) {
      return NextResponse.json(
        { error: "Missing required parameter: handle" },
        { status: 400 }
      );
    }

    await connectDB();

    // ── Step 1: Fetch and upsert user info ──────────────────────────────

    const cfUser = await getUserInfo(handle);

    await User.findOneAndUpdate(
      { handle: cfUser.handle },
      {
        handle: cfUser.handle,
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
      { upsert: true, returnDocument: 'after' }
    );

    // ── Step 2: Fetch recent submissions ────────────────────────────────

    const cfSubmissions = await getUserSubmissions(handle, 1, 30);

    const upsertedSubmissions = [];
    for (const sub of cfSubmissions) {
      const doc = await Submission.findOneAndUpdate(
        { submissionId: sub.id },
        {
          handle: handle,
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
        { upsert: true, returnDocument: 'after' }
      );
      upsertedSubmissions.push(doc);
    }

    // ── Step 3: Filter failed submissions not yet analyzed ──────────────

    const failedVerdicts = ["WRONG_ANSWER", "TIME_LIMIT_EXCEEDED"];

    // Get all submission IDs that have already been analyzed
    const existingInsights = await Insight.find({ handle }).select(
      "analyzedSubmissionIds"
    );
    const analyzedIds = new Set(
      existingInsights.flatMap((i) => i.analyzedSubmissionIds)
    );

    // Get all solved problems to avoid analyzing failed submissions for problems the user eventually solved
    const solvedSubmissions = await Submission.find({ handle, verdict: "OK" }).select(
      "contestId problemIndex"
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

    // ── Step 4 & 5: Scrape code and analyze (limit to 5 to avoid rate limits) ─

    const submissionsToAnalyze = failedSubmissions.slice(0, 5);
    const analysisResults = [];

    for (const sub of submissionsToAnalyze) {
      // Scrape source code if we don't already have it
      let sourceCode: string | null = sub.sourceCode;
      if (!sourceCode) {
        sourceCode = await scrapeSourceCode(sub.contestId, sub.submissionId);
        if (sourceCode) {
          await Submission.findOneAndUpdate(
            { submissionId: sub.submissionId },
            { sourceCode },
            { returnDocument: 'after' }
          );
        }
      }

      // Run Gemini analysis (even if source code is missing, we can provide general feedback)
      const analysis = await analyzeFailedSubmission(
        sourceCode || "// Source code could not be scraped due to Codeforces Cloudflare protection.",
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

    // ── Step 6: Save insights ───────────────────────────────────────────

    if (analysisResults.length > 0) {
      // Aggregate all recommendations into a single insight
      const allTopics = [
        ...new Set(analysisResults.flatMap((r) => r.analysis.recommendedTopics)),
      ];

      const combinedReport = analysisResults
        .map(
          (r) =>
            `## ${r.problemName} (${r.verdict})\n\n${r.analysis.performanceReport}`
        )
        .join("\n\n---\n\n");

      const analyzedIds = analysisResults.map((r) => r.submissionId);

      await Insight.create({
        handle,
        date: new Date(),
        performanceReport: combinedReport,
        recommendedTopics: allTopics.slice(0, 10),
        analyzedSubmissionIds: analyzedIds,
      });
    }

    return NextResponse.json({
      success: true,
      handle,
      userSynced: true,
      submissionsSynced: upsertedSubmissions.length,
      failedFound: failedSubmissions.length,
      analyzed: analysisResults.length,
      insights: analysisResults.length > 0 ? "New insight generated" : "No new failed submissions to analyze",
    });
  } catch (error) {
    console.error("Sync error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
