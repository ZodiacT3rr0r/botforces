import { IUser } from "@/models/User";

function getRankClass(rank: string): string {
  const r = rank?.toLowerCase().replace(/\s+/g, "-") || "newbie";
  return `rank-${r}`;
}

function formatRating(rating: number): string {
  return rating > 0 ? rating.toString() : "Unrated";
}

function formatDate(seconds: number): string {
  if (!seconds) return "Unknown";
  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface ProfileHeaderProps {
  user: IUser;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className="glass-card gradient-border p-6 animate-fade-in-up">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-bg-elevated ring-2 ring-border-subtle">
            {user.avatar ? (
              <img
                src={
                  user.avatar.startsWith("//")
                    ? `https:${user.avatar}`
                    : user.avatar
                }
                alt={user.handle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-text-muted">
                {user.handle[0]?.toUpperCase()}
              </div>
            )}
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent-emerald border-2 border-bg-card" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h2 className={`text-2xl font-bold ${getRankClass(user.rank)}`}>
              {user.handle}
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-accent-indigo/10 border border-accent-indigo/20 text-accent-indigo capitalize">
              {user.rank || "Unrated"}
            </span>
          </div>

          {user.organization && (
            <p className="text-text-secondary text-sm mb-3 flex items-center gap-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v.01M12 14v.01M16 14v.01M8 18v.01M12 18v.01M16 18v.01" />
              </svg>
              {user.organization}
            </p>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <StatItem
              label="Rating"
              value={formatRating(user.rating)}
              valueClass={getRankClass(user.rank)}
            />
            <StatItem
              label="Max Rating"
              value={formatRating(user.maxRating)}
              valueClass={getRankClass(user.maxRank)}
              sublabel={user.maxRank}
            />
            <StatItem
              label="Contribution"
              value={
                user.contribution > 0
                  ? `+${user.contribution}`
                  : user.contribution.toString()
              }
              valueClass={
                user.contribution > 0 ? "text-accent-emerald" : "text-verdict-wa"
              }
            />
            <StatItem
              label="Registered"
              value={formatDate(user.registrationTimeSeconds)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  valueClass,
  sublabel,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sublabel?: string;
}) {
  return (
    <div className="bg-bg-elevated/50 rounded-lg px-3 py-2.5">
      <div className="text-text-muted text-xs mb-1">{label}</div>
      <div className={`text-lg font-bold ${valueClass || "text-text-primary"}`}>
        {value}
      </div>
      {sublabel && (
        <div className="text-text-muted text-xs capitalize mt-0.5">
          {sublabel}
        </div>
      )}
    </div>
  );
}
