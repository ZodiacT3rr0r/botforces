"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import DashboardShell from "@/components/DashboardShell";
import CodeEditor from "@/components/CodeEditor";

function EditorContent() {
  const searchParams = useSearchParams();
  const handle = searchParams.get("handle") || "";
  const contestId = searchParams.get("contestId")
    ? Number(searchParams.get("contestId"))
    : undefined;
  const problemIndex = searchParams.get("problemIndex") || undefined;
  const problemName = searchParams.get("problemName") || undefined;

  return (
    <div className="h-[calc(100vh-5rem)] lg:h-[calc(100vh-4rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-accent-indigo"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Code Editor
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {contestId && problemIndex ? (
              <>
                Solving{" "}
                <a
                  href={`https://codeforces.com/contest/${contestId}/problem/${problemIndex}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-indigo hover:underline font-medium"
                >
                  {problemIndex}
                  {problemName ? `. ${problemName}` : ""}
                </a>
                {" "}from contest{" "}
                <a
                  href={`/contests/${contestId}?handle=${handle}`}
                  className="text-accent-indigo hover:underline font-medium"
                >
                  #{contestId}
                </a>
              </>
            ) : (
              "Write and submit competitive programming solutions"
            )}
          </p>
        </div>

        {/* Quick links */}
        {contestId && (
          <div className="flex items-center gap-2">
            <a
              href={`https://codeforces.com/contest/${contestId}/problem/${problemIndex || "A"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-card hover:bg-bg-card-hover border border-border-subtle rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Problem Statement
            </a>
            <a
              href={`/contests/${contestId}?handle=${handle}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-card hover:bg-bg-card-hover border border-border-subtle rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              All Problems
            </a>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <CodeEditor
          contestId={contestId}
          problemIndex={problemIndex}
          problemName={problemName}
        />
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <DashboardShell>
      <Suspense
        fallback={
          <div className="h-[calc(100vh-5rem)] flex flex-col space-y-4 animate-pulse">
            <div className="h-8 w-32 bg-bg-elevated rounded" />
            <div className="flex-1 bg-bg-elevated rounded-xl" />
          </div>
        }
      >
        <EditorContent />
      </Suspense>
    </DashboardShell>
  );
}
