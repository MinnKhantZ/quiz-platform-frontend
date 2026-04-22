import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { formatDate, formatTime } from "../../lib/utils";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import type { Attempt } from "../../types";

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const navigate = useNavigate();

  const loadHistory = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Attempt[]>(`/me/attempts?page=${targetPage}&limit=${PAGE_SIZE}`);
      setAttempts(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(page);
  }, [page, loadHistory]);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quiz History</h1>
        <p className="text-muted-foreground">View your past quiz attempts</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {attempts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No quiz attempts yet. Take a quiz to get started!</p>
          <Button className="mt-4" onClick={() => navigate("/student/quizzes")}>
            Browse Quizzes
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {attempts.map((attempt) => (
              <Card
                key={attempt.id}
                className="cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => navigate(`/student/results/${attempt.id}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{attempt.quiz?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {attempt.completedAt && formatDate(attempt.completedAt)} &middot; {formatTime(attempt.timeTaken)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        attempt.percentage >= 70 ? "success" : attempt.percentage >= 40 ? "secondary" : "destructive"
                      }
                    >
                      {Math.round(attempt.percentage)}%
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {attempt.score}/{attempt.totalPoints}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button variant="outline" onClick={() => setPage((prev) => prev + 1)} disabled={!hasMore}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
