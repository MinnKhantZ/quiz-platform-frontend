import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import { formatTime } from "../../lib/utils";
import { useAuthStore } from "../../stores/authStore";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Trophy, Medal, Award } from "lucide-react";
import type { LeaderboardEntry } from "../../types";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export default function LeaderboardPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    api.get<LeaderboardEntry[]>(`/quizzes/${quizId}/leaderboard`).then((data) => {
      setLeaderboard(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [quizId]);

  if (loading) return <LoadingSpinner className="mt-20" />;

  const rankConfig: Record<number, { icon: ReactNode; rowClass: string; labelClass: string }> = {
    1: {
      icon: <Trophy className="h-5 w-5 text-yellow-400" />,
      rowClass: "border-yellow-400/30 bg-yellow-400/5",
      labelClass: "text-yellow-400",
    },
    2: {
      icon: <Medal className="h-5 w-5 text-slate-300" />,
      rowClass: "border-slate-300/30 bg-slate-300/5",
      labelClass: "text-slate-300",
    },
    3: {
      icon: <Award className="h-5 w-5 text-amber-600" />,
      rowClass: "border-amber-600/30 bg-amber-600/5",
      labelClass: "text-amber-600",
    },
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-slide-up">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">
            Rankings
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">Top performers for this quiz</p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <Trophy className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No attempts yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry) => {
            const isMe = entry.student.id === user?.id;
            const config = rankConfig[entry.rank];

            return (
              <div
                key={entry.student.id}
                className={cn(
                  "flex items-center gap-4 rounded-xl border p-4 transition-all",
                  config ? config.rowClass : "border-border bg-card",
                  isMe && !config && "border-primary/30 bg-primary/5"
                )}
              >
                {/* Rank */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  {config ? (
                    config.icon
                  ) : (
                    <span className={cn("font-display text-base font-bold text-muted-foreground")}>
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{entry.student.name}</p>
                    {isMe && (
                      <Badge variant="default" className="text-xs">You</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTime(entry.timeTaken)} · {entry.score}/{entry.totalPoints} pts
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className={cn(
                    "font-display text-xl font-bold",
                    config ? config.labelClass : isMe ? "text-primary" : "text-foreground"
                  )}>
                    {Math.round(entry.percentage)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

