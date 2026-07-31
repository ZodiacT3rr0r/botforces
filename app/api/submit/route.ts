import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";

/**
 * POST /api/submit
 *
 * Receives submission results pushed from the browser extension.
 * The extension submits code to Codeforces on behalf of the user and
 * reports the result back to our app.
 *
 * Body: {
 *   handle: string,
 *   submissionId: number,
 *   contestId: number,
 *   problemIndex: string,
 *   problemName: string,
 *   verdict: string,
 *   programmingLanguage: string,
 *   timeConsumedMillis?: number,
 *   memoryConsumedBytes?: number,
 *   passedTestCount?: number,
 *   tags?: string[],
 *   sourceCode?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { handle, submissionId, contestId, problemIndex, problemName, verdict } = body;

    // Validate required fields
    if (!handle || !submissionId || !contestId || !verdict) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: handle, submissionId, contestId, verdict",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Upsert the submission
    const submission = await Submission.findOneAndUpdate(
      { submissionId },
      {
        handle,
        submissionId,
        contestId,
        problemIndex: problemIndex || "",
        problemName: problemName || "",
        verdict,
        programmingLanguage: body.programmingLanguage || "",
        timeConsumedMillis: body.timeConsumedMillis || 0,
        memoryConsumedBytes: body.memoryConsumedBytes || 0,
        passedTestCount: body.passedTestCount || 0,
        tags: body.tags || [],
        sourceCode: body.sourceCode || "",
        creationTimeSeconds: Math.floor(Date.now() / 1000),
      },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      message: "Submission recorded",
      submission: {
        submissionId: submission.submissionId,
        verdict: submission.verdict,
        problemName: submission.problemName,
      },
    });
  } catch (error) {
    console.error("Submit error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
