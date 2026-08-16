import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CF_BIN = path.join(process.cwd(), "bin", "cf");

/**
 * GET /api/cftool/status
 *
 * Reports whether cf-tool has an active authenticated session.
 * Checks for the existence of the ~/.cf/session file and reads
 * the handle from it to confirm it is populated.
 */
export async function GET() {
  try {
    const sessionPath = path.join(os.homedir(), ".cf", "session");

    if (!fs.existsSync(sessionPath)) {
      return NextResponse.json({ loggedIn: false, handle: null });
    }

    const raw = fs.readFileSync(sessionPath, "utf-8");
    const session = JSON.parse(raw);
    const handle = session?.handle ?? null;

    if (!handle) {
      return NextResponse.json({ loggedIn: false, handle: null });
    }

    return NextResponse.json({ loggedIn: true, handle });
  } catch {
    return NextResponse.json({ loggedIn: false, handle: null });
  }
}

/**
 * POST /api/cftool/status
 *
 * Logs in to Codeforces via the cf-tool CLI.
 * Writes the required ~/.cf/config (templates) first, then drives
 * `cf config` interactively via stdin to authenticate.
 *
 * Body: { handle: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { handle, password } = await request.json();

    if (!handle || !password) {
      return NextResponse.json(
        { error: "handle and password are required" },
        { status: 400 }
      );
    }

    // ── Step 1: Ensure ~/.cf/ directory exists ────────────────────────────
    const cfDir = path.join(os.homedir(), ".cf");
    if (!fs.existsSync(cfDir)) {
      fs.mkdirSync(cfDir, { recursive: true });
    }

    // ── Step 2: Write a minimal config so cf-tool has a template ─────────
    //   This is required before cf-tool will accept submissions.
    //   We define one C++ template using the standard competitive template.
    const configPath = path.join(cfDir, "config");
    const config = {
      template: [
        {
          alias: "cpp",
          lang: "GNU G++20 14.2 (64 bit)",
          path: "",
          suffix: ["cpp", "cc", "cxx"],
          before_script: "",
          script: "",
          after_script: "",
        },
        {
          alias: "python",
          lang: "PyPy 3-64",
          path: "",
          suffix: ["py"],
          before_script: "",
          script: "",
          after_script: "",
        },
        {
          alias: "java",
          lang: "Java 21 64bit",
          path: "",
          suffix: ["java"],
          before_script: "",
          script: "",
          after_script: "",
        },
      ],
      default_template: 0,
      gen_after_parse: false,
      host: "https://codeforces.com",
      proxy: "",
      folder_name: {
        c: "contest",
        g: "gym",
        a: "acmsguru",
        r: "root",
      },
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // ── Step 3: Run `cf config` and pipe login selections via stdin ───────
    //   The interactive menu requires these inputs in order:
    //     "0\n"  → select "Login"
    //     handle + "\n"  → handle or email
    //     password + "\n"  → password
    //     "7\n"  → exit the menu (option 7 is typically the last option)
    const output = await new Promise<{ stdout: string; stderr: string; code: number }>(
      (resolve) => {
        const proc = spawn(CF_BIN, ["config"], {
          env: { ...process.env, HOME: os.homedir() },
        });

        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
        proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

        // Pipe the interactive menu choices in sequence
        const inputs = ["0\n", `${handle}\n`, `${password}\n`, "7\n"];
        let i = 0;

        const writeNext = () => {
          if (i < inputs.length) {
            proc.stdin.write(inputs[i++]);
            setTimeout(writeNext, 800);
          } else {
            proc.stdin.end();
          }
        };

        proc.on("spawn", () => setTimeout(writeNext, 500));
        proc.on("close", (code: number) => resolve({ stdout, stderr, code: code ?? 0 }));
        proc.on("error", () => resolve({ stdout, stderr, code: 1 }));

        // Safety timeout — kill after 30s
        setTimeout(() => {
          proc.kill();
          resolve({ stdout, stderr, code: 1 });
        }, 30000);
      }
    );

    // ── Step 4: Verify session was written ────────────────────────────────
    const sessionPath = path.join(cfDir, "session");
    if (!fs.existsSync(sessionPath)) {
      return NextResponse.json(
        {
          error: "Login failed — cf-tool did not create a session file. Check your credentials.",
          detail: output.stdout + output.stderr,
        },
        { status: 401 }
      );
    }

    const session = JSON.parse(fs.readFileSync(sessionPath, "utf-8"));
    const loggedInHandle = session?.handle ?? null;

    if (!loggedInHandle) {
      return NextResponse.json(
        {
          error: "Login may have failed — session file exists but handle is empty.",
          detail: output.stdout + output.stderr,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, handle: loggedInHandle });
  } catch (error) {
    console.error("cf-tool login error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
