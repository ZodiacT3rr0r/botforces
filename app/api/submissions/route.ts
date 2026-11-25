import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";

/**
 * GET /api/submissions?handle=<handle>&limit=30
 * Returns cached submissions from MongoDB, sorted by creation time desc.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get("handle");
    const rawLimit = Number.parseInt(searchParams.get("limit") || "30", 10);
    const limit = Number.isNaN(rawLimit)
      ? 30
      : Math.min(Math.max(rawLimit, 1), 100);

    if (!handle) {
      return NextResponse.json(
        { error: "Missing required parameter: handle" },
        { status: 400 }
      );
    }

    const handleLower = handle.trim().toLowerCase();
    await connectDB();

    const submissions = await Submission.find({
      $or: [{ handleLower }, { handle }],
    })
      .sort({ creationTimeSeconds: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Submissions fetch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
