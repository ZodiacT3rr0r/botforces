import { Suspense } from "react";
import DashboardShell from "@/components/DashboardShell";
import DashboardContent from "./DashboardContent";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </DashboardShell>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Profile skeleton */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-bg-elevated" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-48 bg-bg-elevated rounded" />
            <div className="h-4 w-32 bg-bg-elevated rounded" />
            <div className="grid grid-cols-4 gap-4 mt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-bg-elevated rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submissions skeleton */}
      <div className="glass-card">
        <div className="px-6 py-4 border-b border-border-subtle">
          <div className="h-5 w-40 bg-bg-elevated rounded" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="px-6 py-4 border-b border-border-subtle/50 flex items-center gap-4"
          >
            <div className="h-4 w-48 bg-bg-elevated rounded" />
            <div className="h-6 w-16 bg-bg-elevated rounded-full" />
            <div className="flex-1" />
            <div className="h-4 w-20 bg-bg-elevated rounded" />
          </div>
        ))}
      </div>

      {/* Insights skeleton */}
      <div className="glass-card p-6">
        <div className="h-5 w-48 bg-bg-elevated rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-bg-elevated rounded" />
          <div className="h-4 w-3/4 bg-bg-elevated rounded" />
          <div className="h-4 w-5/6 bg-bg-elevated rounded" />
        </div>
      </div>
    </div>
  );
}
