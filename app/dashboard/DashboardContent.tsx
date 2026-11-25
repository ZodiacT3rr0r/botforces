"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileHeader from "@/components/ProfileHeader";
import SubmissionList from "@/components/SubmissionList";
import InsightCard from "@/components/InsightCard";
import ExtensionStatus from "@/components/ExtensionStatus";
import { IUser } from "@/models/User";
import { ISubmission } from "@/models/Submission";
import { IInsight } from "@/models/Insight";

interface SyncResponse {
  success: boolean;
  handle: string;
  submissionsSynced: number;
  analyzed: number;
  error?: string;
}

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const handle = searchParams.get("handle");

  const [user, setUser] = useState<IUser | null>(null);
  const [submissions, setSubmissions] = useState<ISubmission[]>([]);
  const [insights, setInsights] = useState<IInsight[]>([]);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) return;
    let cancelled = false;

    const loadCached = async () => {
      const [userRes, subsRes, insightsRes] = await Promise.all([
        fetch(`/api/user?handle=${encodeURIComponent(handle)}`),
        fetch(`/api/submissions?handle=${encodeURIComponent(handle)}`),
        fetch(`/api/insights?handle=${encodeURIComponent(handle)}`),
      ]);

      if (cancelled) return;

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubmissions(subsData.submissions);
      }

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData.insights);
      }
    };

    const staleWhileRevalidate = async () => {
      setSyncStatus("syncing");
      setError(null);

      try {
        // 1. Render cached MongoDB state immediately (fast path)
        await loadCached();

        // 2. Revalidate asynchronously via Codeforces + Gemini sync
        const syncRes = await fetch(
          `/api/cron/sync?handle=${encodeURIComponent(handle)}`
        );
        const syncData: SyncResponse = await syncRes.json();

        if (cancelled) return;
        if (!syncRes.ok || syncData.error) {
          throw new Error(syncData.error || "Sync failed");
        }

        // 3. Refresh UI with freshly synced MongoDB state
        await loadCached();
        if (!cancelled) {
          setSyncStatus("done");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Dashboard sync error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setSyncStatus("error");
      }
    };

    staleWhileRevalidate();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  if (!handle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">No Handle Specified</h2>
          <p className="text-text-secondary text-sm mb-4">
            Go back to the home page and enter your Codeforces handle.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top bar with sync status and extension indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Performance overview for{" "}
            <span className="text-accent-indigo font-medium">{handle}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExtensionStatus />

          {/* Sync indicator */}
          {syncStatus === "syncing" && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-indigo/10 text-accent-indigo text-xs font-medium border border-accent-indigo/20">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Syncing...
            </div>
          )}

          {syncStatus === "done" && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-emerald/10 text-accent-emerald text-xs font-medium border border-accent-emerald/20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Synced
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-card p-4 border-l-4 border-verdict-wa">
          <div className="flex items-start gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-verdict-wa flex-shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="text-sm font-medium text-verdict-wa">Sync Error</p>
              <p className="text-text-secondary text-xs mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-xs text-accent-indigo hover:text-accent-indigo/80 font-medium"
              >
                Try again →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      {user && <ProfileHeader user={user} />}

      {/* Two-column layout for submissions and insights */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Submissions - wider column */}
        <div className="xl:col-span-3">
          <SubmissionList submissions={submissions} />
        </div>

        {/* Insights - narrower column */}
        <div className="xl:col-span-2">
          <InsightCard insights={insights} />
        </div>
      </div>
    </div>
  );
}
