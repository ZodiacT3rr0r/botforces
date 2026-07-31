"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import DashboardShell from "@/components/DashboardShell";
import { CFContest, CFProblem } from "@/lib/codeforces";

function ContestDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const contestId = Number(params.contestId);
  const handle = searchParams.get("handle") || "";

  const [contest, setContest] = useState<CFContest | null>(null);
  const [problems, setProblems] = useState<CFProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId) return;

    const fetchContestData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/contest/${contestId}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setContest(data.contest);
        setProblems(data.problems || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load contest");
      } finally {
        setLoading(false);
      }
    };

    fetchContestData();
  }, [contestId]);

  function getDifficultyColor(rating?: number): string {
    if (!rating) return "text-text-muted";
    if (rating <= 1200) return "text-cf-pupil";
    if (rating <= 1400) return "text-cf-specialist";
    if (rating <= 1600) return "text-cf-expert";
    if (rating <= 1900) return "text-cf-candidate-master";
    if (rating <= 2100) return "text-cf-master";
    if (rating <= 2400) return "text-cf-international-master";
    return "text-cf-grandmaster";
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back link */}
      <a
        href={`/contests?handle=${handle}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Contests
      </a>

      {/* Loading */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-64 bg-bg-elevated rounded" />
          <div className="h-5 w-48 bg-bg-elevated rounded" />
          <div className="space-y-3 mt-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-bg-elevated rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card p-6 text-center">
          <p className="text-verdict-wa font-medium mb-2">Failed to load contest</p>
          <p className="text-text-secondary text-sm mb-4">{error}</p>
          <a
            href={`https://codeforces.com/contest/${contestId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-indigo/15 text-accent-indigo rounded-lg text-sm font-medium hover:bg-accent-indigo/25 transition-colors"
          >
            View on Codeforces
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      )}

      {/* Contest info */}
      {!loading && contest && (
        <>
          <div className="glass-card gradient-border p-6 animate-fade-in-up">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold mb-2">{contest.name}</h1>
                <div className="flex items-center gap-4 text-text-secondary text-sm">
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                    </svg>
                    {contest.startTimeSeconds
                      ? new Date(contest.startTimeSeconds * 1000).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "TBD"}
                  </span>
                  <span>·</span>
                  <span>{contest.type}</span>
                  <span>·</span>
                  <span>
                    {Math.floor(contest.durationSeconds / 3600)}h{" "}
                    {Math.floor((contest.durationSeconds % 3600) / 60)}m
                  </span>
                </div>
              </div>

              <a
                href={`https://codeforces.com/contest/${contestId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated hover:bg-bg-card-hover border border-border-subtle rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                Codeforces
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Problems list */}
          <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-indigo">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Problems
              </h2>
              <span className="text-text-muted text-xs">{problems.length} problems</span>
            </div>

            {problems.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-text-muted text-sm">No problems available</p>
                <p className="text-text-muted text-xs mt-1">
                  Problems may not be visible if the contest hasn&apos;t started
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle/50">
                {problems.map((problem, i) => (
                  <div
                    key={`${problem.contestId}-${problem.index}`}
                    className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-bg-card-hover/50 transition-colors group animate-fade-in-up"
                    style={{ animationDelay: `${0.15 + i * 0.05}s` }}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Problem index badge */}
                      <div className="w-10 h-10 rounded-lg bg-accent-indigo/10 flex items-center justify-center text-accent-indigo font-bold text-sm flex-shrink-0">
                        {problem.index}
                      </div>

                      <div className="min-w-0">
                        <a
                          href={`https://codeforces.com/contest/${contestId}/problem/${problem.index}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sm text-text-primary group-hover:text-accent-indigo transition-colors block truncate"
                        >
                          {problem.name}
                        </a>
                        {problem.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {problem.tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted"
                              >
                                {tag}
                              </span>
                            ))}
                            {problem.tags.length > 4 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted">
                                +{problem.tags.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Difficulty */}
                      {problem.rating && (
                        <span className={`text-sm font-bold ${getDifficultyColor(problem.rating)}`}>
                          {problem.rating}
                        </span>
                      )}

                      {/* Solve in editor button */}
                      <a
                        href={`/editor?handle=${handle}&contestId=${contestId}&problemIndex=${problem.index}&problemName=${encodeURIComponent(problem.name)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-indigo/10 hover:bg-accent-indigo/20 text-accent-indigo border border-accent-indigo/20 rounded-lg text-xs font-medium transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                        Solve
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ContestDetailPage() {
  return (
    <DashboardShell>
      <Suspense
        fallback={
          <div className="max-w-4xl space-y-6 animate-pulse">
            <div className="h-5 w-32 bg-bg-elevated rounded" />
            <div className="h-32 bg-bg-elevated rounded-xl" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-bg-elevated rounded-xl" />
              ))}
            </div>
          </div>
        }
      >
        <ContestDetailContent />
      </Suspense>
    </DashboardShell>
  );
}
