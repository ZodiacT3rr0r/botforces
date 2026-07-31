"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import DashboardShell from "@/components/DashboardShell";
import ContestCard from "@/components/ContestCard";
import { CFContest } from "@/lib/codeforces";

function ContestsContent() {
  const searchParams = useSearchParams();
  const handle = searchParams.get("handle") || "";

  const [contests, setContests] = useState<CFContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "running" | "finished">("all");

  useEffect(() => {
    const fetchContests = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/contests");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setContests(data.contests || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load contests");
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  const filteredContests = contests.filter((c) => {
    if (filter === "upcoming") return c.phase === "BEFORE";
    if (filter === "running") return c.phase === "CODING";
    if (filter === "finished") return c.phase === "FINISHED";
    return true;
  });

  // Show max 50 contests to avoid overwhelming the UI
  const displayContests = filteredContests.slice(0, 50);

  const counts = {
    all: contests.length,
    upcoming: contests.filter((c) => c.phase === "BEFORE").length,
    running: contests.filter((c) => c.phase === "CODING").length,
    finished: contests.filter((c) => c.phase === "FINISHED").length,
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Contests</h1>
        <p className="text-text-secondary text-sm mt-0.5">
          Browse Codeforces contests
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "upcoming", "running", "finished"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === f
                ? "bg-accent-indigo/15 text-accent-indigo border border-accent-indigo/30"
                : "bg-bg-card text-text-secondary border border-border-subtle hover:text-text-primary hover:bg-bg-card-hover"
            }`}
          >
            <span className="capitalize">{f}</span>
            <span className="ml-1.5 text-xs opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-bg-elevated" />
                <div className="h-6 w-20 rounded-full bg-bg-elevated" />
              </div>
              <div className="h-5 w-3/4 bg-bg-elevated rounded mb-3" />
              <div className="flex gap-4">
                <div className="h-4 w-24 bg-bg-elevated rounded" />
                <div className="h-4 w-16 bg-bg-elevated rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card p-4 border-l-4 border-verdict-wa">
          <p className="text-sm text-verdict-wa font-medium">Error loading contests</p>
          <p className="text-text-secondary text-xs mt-1">{error}</p>
        </div>
      )}

      {/* Contest grid */}
      {!loading && !error && (
        <>
          {displayContests.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-text-muted text-4xl mb-3">🏆</p>
              <p className="text-text-secondary text-sm">No contests match this filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {displayContests.map((contest) => (
                <ContestCard
                  key={contest.id}
                  contest={contest}
                  handle={handle}
                />
              ))}
            </div>
          )}

          {filteredContests.length > 50 && (
            <p className="text-center text-text-muted text-xs">
              Showing 50 of {filteredContests.length} contests
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function ContestsPage() {
  return (
    <DashboardShell>
      <Suspense
        fallback={
          <div className="max-w-5xl space-y-6 animate-pulse">
            <div className="h-8 w-32 bg-bg-elevated rounded" />
            <div className="h-10 w-80 bg-bg-elevated rounded" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-bg-elevated rounded-xl" />
              ))}
            </div>
          </div>
        }
      >
        <ContestsContent />
      </Suspense>
    </DashboardShell>
  );
}
