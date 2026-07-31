import { ISubmission } from "@/models/Submission";

function getVerdictDisplay(verdict: string): {
  label: string;
  className: string;
  short: string;
} {
  const map: Record<string, { label: string; className: string; short: string }> = {
    OK: { label: "Accepted", className: "verdict-ok", short: "AC" },
    WRONG_ANSWER: {
      label: "Wrong Answer",
      className: "verdict-wrong-answer",
      short: "WA",
    },
    TIME_LIMIT_EXCEEDED: {
      label: "Time Limit",
      className: "verdict-time-limit",
      short: "TLE",
    },
    MEMORY_LIMIT_EXCEEDED: {
      label: "Memory Limit",
      className: "verdict-memory-limit",
      short: "MLE",
    },
    RUNTIME_ERROR: {
      label: "Runtime Error",
      className: "verdict-runtime-error",
      short: "RE",
    },
    COMPILATION_ERROR: {
      label: "Compile Error",
      className: "verdict-other",
      short: "CE",
    },
    TESTING: {
      label: "Testing",
      className: "verdict-other",
      short: "...",
    },
  };

  return (
    map[verdict] || {
      label: verdict.replace(/_/g, " "),
      className: "verdict-other",
      short: verdict.slice(0, 3),
    }
  );
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatMemory(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function timeAgo(seconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface SubmissionListProps {
  submissions: ISubmission[];
}

export default function SubmissionList({ submissions }: SubmissionListProps) {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="glass-card p-8 text-center animate-fade-in-up">
        <div className="text-text-muted text-4xl mb-3">📭</div>
        <p className="text-text-secondary text-sm">No submissions found</p>
        <p className="text-text-muted text-xs mt-1">
          Submit a solution on Codeforces to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-accent-indigo"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <h3 className="font-semibold text-sm">Recent Submissions</h3>
        </div>
        <span className="text-text-muted text-xs">{submissions.length} submissions</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-text-muted text-xs">
              <th className="px-6 py-3 text-left font-medium">Problem</th>
              <th className="px-4 py-3 text-left font-medium">Verdict</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Language</th>
              <th className="px-4 py-3 text-right font-medium hidden lg:table-cell">Time</th>
              <th className="px-4 py-3 text-right font-medium hidden lg:table-cell">Memory</th>
              <th className="px-6 py-3 text-right font-medium">When</th>
            </tr>
          </thead>
          <tbody className="stagger-children">
            {submissions.map((sub) => {
              const v = getVerdictDisplay(sub.verdict);
              return (
                <tr
                  key={sub.submissionId}
                  className="border-b border-border-subtle/50 hover:bg-bg-card-hover/50 transition-colors"
                >
                  {/* Problem */}
                  <td className="px-6 py-3.5">
                    <div>
                      <a
                        href={`https://codeforces.com/contest/${sub.contestId}/problem/${sub.problemIndex}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-text-primary hover:text-accent-indigo transition-colors"
                      >
                        {sub.problemIndex}. {sub.problemName}
                      </a>
                      {sub.problemRating > 0 && (
                        <span className="ml-2 text-text-muted text-xs">
                          ({sub.problemRating})
                        </span>
                      )}
                    </div>
                    {sub.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sub.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                        {sub.tags.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted">
                            +{sub.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Verdict */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${v.className}`}
                    >
                      {v.short === "AC" && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {v.short}
                      {sub.passedTestCount > 0 && v.short !== "AC" && (
                        <span className="opacity-60">
                          #{sub.passedTestCount + 1}
                        </span>
                      )}
                    </span>
                  </td>

                  {/* Language */}
                  <td className="px-4 py-3.5 text-text-secondary hidden md:table-cell">
                    {sub.programmingLanguage}
                  </td>

                  {/* Time */}
                  <td className="px-4 py-3.5 text-right text-text-secondary font-mono text-xs hidden lg:table-cell">
                    {formatTime(sub.timeConsumedMillis)}
                  </td>

                  {/* Memory */}
                  <td className="px-4 py-3.5 text-right text-text-secondary font-mono text-xs hidden lg:table-cell">
                    {formatMemory(sub.memoryConsumedBytes)}
                  </td>

                  {/* Time ago */}
                  <td className="px-6 py-3.5 text-right text-text-muted text-xs">
                    {timeAgo(sub.creationTimeSeconds)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
