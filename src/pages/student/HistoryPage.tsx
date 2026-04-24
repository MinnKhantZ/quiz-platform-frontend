import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { cache } from "../../lib/cache";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { formatDate, formatTime } from "../../lib/utils";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { History, ChevronLeft, ChevronRight, ChevronRight as ArrowIcon } from "lucide-react";
import type { Attempt } from "../../types";
import { cn } from "../../lib/utils";

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[]>(
    () => cache.get<Attempt[]>("history:p1") ?? []
  );
  const [loading, setLoading] = useState<boolean>(
    () => !cache.get<Attempt[]>("history:p1")
  );
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const navigate = useNavigate();

  const loadHistory = useCallback(async (targetPage: number) => {
    const cacheKey = `history:p${targetPage}`;
    const stale = cache.get<Attempt[]>(cacheKey);
    if (stale) {
      setAttempts(stale);
      setHasMore(stale.length === PAGE_SIZE);
    } else {
      setLoading(true);
    }
    setError(null);
    const unsub = cache.subscribe<Attempt[]>(cacheKey, (fresh) => {
      setAttempts(fresh);
      setHasMore(fresh.length === PAGE_SIZE);
      unsub();
    });
    try {
      const data = await cache.fetch<Attempt[]>(cacheKey, () =>
        api.get<Attempt[]>(`/me/attempts?page=${targetPage}&limit=${PAGE_SIZE}`)
      );
      setAttempts(data);
      setHasMore(data.length === PAGE_SIZE);
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
      unsub();
    }
  }, []);

  useEffect(() => {
    loadHistory(page);
  }, [page, loadHistory]);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <History className="h-4 w-4 text-primary" />
          <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">
            History
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold">Quiz History</h1>
        <p className="text-muted-foreground mt-1">Your past quiz attempts</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {attempts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <History className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground mb-4">No quiz attempts yet.</p>
          <Button onClick={() => navigate("/student/quizzes")}>Browse Quizzes</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {attempts.map((attempt) => (
            <button
              key={attempt.id}
              className="group w-full flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:bg-accent/40"
              onClick={() => navigate(`/student/results/${attempt.id}`)}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{attempt.quiz?.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {attempt.completedAt && formatDate(attempt.completedAt)}
                  <span className="mx-1.5">·</span>
                  {formatTime(attempt.timeTaken)}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                {attempt.isLive && (
                  <Badge variant="default" className="gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse inline-block" />
                    Live
                  </Badge>
                )}
                <Badge
                  variant={
                    attempt.percentage >= 70
                      ? "success"
                      : attempt.percentage >= 40
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {Math.round(attempt.percentage)}%
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {attempt.score}/{attempt.totalPoints} pts
                </span>
                <ArrowIcon className={cn("h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5")} />
              </div>
            </button>
          ))}

          {(page > 1 || hasMore) && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!hasMore}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

