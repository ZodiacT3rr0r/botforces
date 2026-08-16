import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";

const CF_BIN = path.join(process.cwd(), "bin", "cf");

// Map from our editor language keys to cf-tool language strings
// These must match exactly what cf-tool expects (Codeforces language names)
const LANG_MAP: Record<string, string> = {
  cpp: "cpp",
  python: "python",
  java: "java",
  javascript: "javascript",
  kotlin: "kotlin",
  rust: "rust",
  go: "go",
  c: "c",
};

/**
 * POST /api/submit
 *
 * Accepts source code from the editor and submits it to Codeforces
 * via the local cf-tool CLI binary.
 *
 * Workflow:
 *  1. Write source code to a temp file with the correct extension.
 *  2. Spawn `bin/cf submit -f <tempfile> <contestId><problemIndex>`.
 *  3. Parse the real-time stdout for submission ID and final verdict.
 *  4. Save result to MongoDB.
 *
 * Body: {
 *   handle: string,
 *   contestId: number,
 *   problemIndex: string,
 *   problemName?: string,
 *   language: string,    // our internal key e.g. "cpp", "python"
 *   sourceCode: string,
 * }
 */
export async function POST(request: NextRequest) {
  let tempFile: string | null = null;

  try {
    const body = await request.json();
    const { handle, contestId, problemIndex, problemName, language, sourceCode } = body;

    if (!handle || !contestId || !problemIndex || !language || !sourceCode) {
      return NextResponse.json(
        { error: "Missing required fields: handle, contestId, problemIndex, language, sourceCode" },
        { status: 400 }
      );
    }

    // ── Step 1: Write code to a temp file ────────────────────────────────
    const ext = getExtension(language);
    tempFile = path.join(os.tmpdir(), `botforces_${Date.now()}.${ext}`);
    fs.writeFileSync(tempFile, sourceCode, "utf-8");

    // ── Step 2: Run cf submit ──────────────────────────────────────────────
    const specifier = `${contestId}${problemIndex.toUpperCase()}`;
    const result = await runCfSubmit(tempFile, specifier);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "cf submit failed", detail: result.output },
        { status: 500 }
      );
    }

    // ── Step 3: Save to MongoDB ────────────────────────────────────────────
    await connectDB();

    const submission = await Submission.findOneAndUpdate(
      { submissionId: result.submissionId },
      {
        handle,
        submissionId: result.submissionId,
        contestId: Number(contestId),
        problemIndex,
        problemName: problemName || "",
        verdict: result.verdict,
        programmingLanguage: language,
        sourceCode,
        creationTimeSeconds: Math.floor(Date.now() / 1000),
        tags: [],
        timeConsumedMillis: 0,
        memoryConsumedBytes: 0,
        passedTestCount: 0,
      },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({
      success: true,
      submissionId: result.submissionId,
      verdict: result.verdict,
      output: result.output,
      submission: {
        submissionId: submission.submissionId,
        verdict: submission.verdict,
      },
    });
  } catch (error) {
    console.error("Submit error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    // Clean up the temp file regardless of outcome
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExtension(language: string): string {
  const map: Record<string, string> = {
    cpp: "cpp",
    c: "c",
    python: "py",
    java: "java",
    javascript: "js",
    kotlin: "kt",
    rust: "rs",
    go: "go",
  };
  return map[language] ?? "cpp";
}

interface SubmitResult {
  success: boolean;
  submissionId: number;
  verdict: string;
  output: string;
  error?: string;
}

/**
 * Spawns the cf binary to submit code and waits for the final verdict.
 * cf-tool prints status updates to stdout in real time; we watch for
 * the verdict line to extract both submission ID and final verdict.
 */
function runCfSubmit(filePath: string, specifier: string): Promise<SubmitResult> {
  return new Promise((resolve) => {
    const proc = spawn(CF_BIN, ["submit", "-f", filePath, specifier], {
      env: { ...process.env, HOME: os.homedir() },
    });

    let output = "";
    let submissionId = 0;
    let verdict = "TESTING";

    const processChunk = (chunk: string) => {
      output += chunk;

      // cf-tool prints lines like:
      //   "Accepted  #52531875  [1000ms, 4 MB]"
      //   "Wrong answer on test 2  #52531875  [1000ms, 4 MB]"
      //   "Time limit exceeded  #52531875  [2000ms, 4 MB]"
      // We extract the submission ID from the `#<number>` pattern
      const idMatch = chunk.match(/#(\d{6,})/);
      if (idMatch) {
        submissionId = parseInt(idMatch[1], 10);
      }

      // Detect final verdicts (cf-tool outputs these when judging is done)
      if (/accepted/i.test(chunk)) verdict = "OK";
      else if (/wrong answer/i.test(chunk)) verdict = "WRONG_ANSWER";
      else if (/time limit/i.test(chunk)) verdict = "TIME_LIMIT_EXCEEDED";
      else if (/memory limit/i.test(chunk)) verdict = "MEMORY_LIMIT_EXCEEDED";
      else if (/runtime error/i.test(chunk)) verdict = "RUNTIME_ERROR";
      else if (/compilation error/i.test(chunk)) verdict = "COMPILATION_ERROR";
      else if (/idleness limit/i.test(chunk)) verdict = "IDLENESS_LIMIT_EXCEEDED";
    };

    proc.stdout.on("data", (d: Buffer) => processChunk(d.toString()));
    proc.stderr.on("data", (d: Buffer) => processChunk(d.toString()));

    proc.on("close", (code: number) => {
      if (code !== 0 && submissionId === 0) {
        resolve({
          success: false,
          submissionId: 0,
          verdict: "FAILED",
          output,
          error: "cf submit exited with error. Are you logged in? Run login first.",
        });
      } else {
        resolve({ success: true, submissionId, verdict, output });
      }
    });

    proc.on("error", (err: Error) => {
      resolve({
        success: false,
        submissionId: 0,
        verdict: "FAILED",
        output,
        error: err.message,
      });
    });

    // Safety timeout — cf-tool can wait a long time for a verdict
    setTimeout(() => {
      proc.kill();
      resolve({
        success: submissionId > 0,
        submissionId,
        verdict: submissionId > 0 ? verdict : "TIMEOUT",
        output,
        error: submissionId > 0 ? undefined : "cf submit timed out",
      });
    }, 120000); // 2 minute timeout
  });
}

// Keep the old GET handler as a no-op for the old extension endpoint
export async function GET() {
  return NextResponse.json({ message: "Use POST to submit code via cf-tool" });
}
