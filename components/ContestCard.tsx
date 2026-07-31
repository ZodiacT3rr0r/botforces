"use client";

import { CFContest } from "@/lib/codeforces";

function formatDate(seconds?: number): string {
  if (!seconds) return "TBD";
  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function getPhaseConfig(phase: string): {
  label: string;
  className: string;
  dotClass: string;
} {
  switch (phase) {
    case "BEFORE":
      return {
        label: "Upcoming",
        className: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20",
        dotClass: "bg-accent-cyan animate-pulse",
      };
    case "CODING":
      return {
        label: "Live",
        className: "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20",
        dotClass: "bg-accent-emerald animate-pulse",
      };
    case "PENDING_SYSTEM_TEST":
    case "SYSTEM_TEST":
      return {
        label: "System Testing",
        className: "bg-verdict-tle/10 text-verdict-tle border-verdict-tle/20",
        dotClass: "bg-verdict-tle animate-pulse",
      };
    case "FINISHED":
      return {
        label: "Finished",
        className: "bg-text-muted/10 text-text-muted border-text-muted/20",
        dotClass: "bg-text-muted",
      };
    default:
      return {
        label: phase,
        className: "bg-text-muted/10 text-text-muted border-text-muted/20",
        dotClass: "bg-text-muted",
      };
  }
}

function getContestTypeIcon(type: string) {
  switch (type) {
    case "CF":
      return (
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      );
    case "IOI":
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </>
      );
    case "ICPC":
      return (
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      );
    default:
      return <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />;
  }
}

function getTimeUntil(startTimeSeconds?: number): string | null {
  if (!startTimeSeconds) return null;
  const now = Math.floor(Date.now() / 1000);
  const diff = startTimeSeconds - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);

  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h ${mins}m`;
  return `Starts in ${mins}m`;
}

interface ContestCardProps {
  contest: CFContest;
  handle?: string;
}

export default function ContestCard({ contest, handle }: ContestCardProps) {
  const phase = getPhaseConfig(contest.phase);
  const timeUntil = getTimeUntil(contest.startTimeSeconds);

  return (
    <a
      href={
        contest.phase === "FINISHED" && handle
          ? `/contests/${contest.id}?handle=${handle}`
          : `https://codeforces.com/contest/${contest.id}`
      }
      target={contest.phase !== "FINISHED" || !handle ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="glass-card p-5 flex flex-col gap-3 group transition-all duration-200 hover:scale-[1.01] cursor-pointer"
    >
      {/* Top row: type icon + phase badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-accent-indigo/10 flex items-center justify-center text-accent-indigo group-hover:bg-accent-indigo/20 transition-colors">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {getContestTypeIcon(contest.type)}
            </svg>
          </div>
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
            {contest.type}
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${phase.className}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${phase.dotClass}`} />
          {phase.label}
        </span>
      </div>

      {/* Contest name */}
      <h3 className="font-semibold text-sm text-text-primary group-hover:text-accent-indigo transition-colors leading-snug line-clamp-2">
        {contest.name}
      </h3>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-text-muted text-xs mt-auto">
        {/* Date */}
        <div className="flex items-center gap-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatDate(contest.startTimeSeconds)}
        </div>

        {/* Duration */}
        <div className="flex items-center gap-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {formatDuration(contest.durationSeconds)}
        </div>
      </div>

      {/* Time until start */}
      {timeUntil && (
        <div className="text-accent-cyan text-xs font-medium animate-pulse">
          ⏱ {timeUntil}
        </div>
      )}
    </a>
  );
}
