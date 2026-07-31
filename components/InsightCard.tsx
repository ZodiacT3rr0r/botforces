import { IInsight } from "@/models/Insight";

interface InsightCardProps {
  insights: IInsight[];
}

export default function InsightCard({ insights }: InsightCardProps) {
  if (!insights || insights.length === 0) {
    return (
      <div className="glass-card p-8 text-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="animate-float inline-block mb-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 flex items-center justify-center mx-auto">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-accent-purple"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
        </div>
        <p className="text-text-secondary text-sm font-medium">No AI Insights Yet</p>
        <p className="text-text-muted text-xs mt-1 max-w-xs mx-auto">
          Sync your submissions to generate personalized performance analysis
          and practice recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <div
          key={insight._id?.toString() || index}
          className="glass-card gradient-border overflow-hidden animate-fade-in-up"
          style={{ animationDelay: `${0.2 + index * 0.1}s` }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Performance Analysis</h3>
                <p className="text-text-muted text-xs">
                  {new Date(insight.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-accent-emerald bg-accent-emerald/10 px-2.5 py-1 rounded-full border border-accent-emerald/20">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Gemini Analysis
            </div>
          </div>

          {/* Report Content */}
          <div className="px-6 py-5">
            <div className="prose prose-invert prose-sm max-w-none">
              {insight.performanceReport.split("\n\n").map((paragraph, i) => {
                // Handle markdown headers
                if (paragraph.startsWith("## ")) {
                  return (
                    <h4
                      key={i}
                      className="text-base font-semibold text-text-primary mt-4 mb-2 first:mt-0"
                    >
                      {paragraph.replace("## ", "")}
                    </h4>
                  );
                }
                if (paragraph === "---") {
                  return (
                    <hr
                      key={i}
                      className="border-border-subtle my-4"
                    />
                  );
                }
                return (
                  <p
                    key={i}
                    className="text-text-secondary text-sm leading-relaxed mb-3 last:mb-0"
                  >
                    {paragraph.split("**").map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className="text-text-primary font-medium">
                          {part}
                        </strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Recommended Topics */}
          {insight.recommendedTopics.length > 0 && (
            <div className="px-6 py-4 bg-bg-elevated/30 border-t border-border-subtle">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-accent-cyan"
                >
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-xs font-medium text-text-secondary">
                  Recommended Topics
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {insight.recommendedTopics.map((topic) => (
                  <span key={topic} className="topic-pill">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
