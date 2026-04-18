import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { formatTime } from "../../lib/utils";
import { useAuthStore } from "../../stores/authStore";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Trophy, Medal } from "lucide-react";
import type { LeaderboardEntry } from "../../types";
import type { ReactNode } from "react";

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

  const rankIcons: Record<number, ReactNode> = {
    1: <Trophy className="h-5 w-5 text-yellow-500" />,
    2: <Medal className="h-5 w-5 text-gray-400" />,
    3: <Medal className="h-5 w-5 text-amber-700" />,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Top performers for this quiz</p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No attempts yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <Card
              key={entry.student.id}
              className={entry.student.id === user?.id ? "border-primary" : ""}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center">
                  {rankIcons[entry.rank] ?? (
                    <span className="text-lg font-bold text-muted-foreground">#{entry.rank}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {entry.student.name}
                    {entry.student.id === user?.id && (
                      <Badge variant="outline" className="ml-2">You</Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Time: {formatTime(entry.timeTaken)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{Math.round(entry.percentage)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.score}/{entry.totalPoints}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
