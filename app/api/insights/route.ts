import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Insight from "@/models/Insight";

/**
 * GET /api/insights?handle=<handle>&limit=5
 * Returns AI-generated insights from MongoDB, sorted by date desc.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get("handle");
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    if (!handle) {
      return NextResponse.json(
        { error: "Missing required parameter: handle" },
        { status: 400 }
      );
    }

    await connectDB();

    const insights = await Insight.find({ handle })
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      count: insights.length,
      insights,
    });
  } catch (error) {
    console.error("Insights fetch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
