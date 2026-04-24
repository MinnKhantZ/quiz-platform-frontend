import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { cache } from "../../lib/cache";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { formatDate, formatTime } from "../../lib/utils";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useQuizStore } from "../../stores/quizStore";
import { BarChart3 } from "lucide-react";
import { toast } from "../../hooks/useToast";
import type { QuizAnalytics } from "../../types";

export default function AnalyticsPage() {
  const { quizzes, fetchQuizzes } = useQuizStore();
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  useEffect(() => {
    if (!selectedQuiz) return;
    const cacheKey = `analytics:${selectedQuiz}`;
    const stale = cache.get<QuizAnalytics>(cacheKey);
    if (stale) {
      setAnalytics(stale);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const unsub = cache.subscribe<QuizAnalytics>(cacheKey, (fresh) => {
      setAnalytics(fresh);
      setLoading(false);
      unsub();
    });
    cache.fetch<QuizAnalytics>(cacheKey, () =>
      api.get<QuizAnalytics>(`/quizzes/${selectedQuiz}/analytics`)
    ).then((data) => {
      setAnalytics(data);
      setLoading(false);
    }).catch(() => {
      toast.error("Failed to load analytics");
      setLoading(false);
    });
    return unsub;
  }, [selectedQuiz]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">Analytics</span>
        </div>
        <h1 className="font-display text-2xl font-bold">Performance Analytics</h1>
        <p className="text-muted-foreground mt-1">Review detailed metrics for your quizzes</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {quizzes.map((q) => (
          <button
            key={q.id}
            onClick={() => setSelectedQuiz(q.id)}
            className={`rounded-lg border px-4 py-2 text-sm font-display font-medium transition-colors ${
              selectedQuiz === q.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:border-primary/50 text-foreground"
            }`}
          >
            {q.title}
          </button>
        ))}
      </div>

      {!selectedQuiz && (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Select a quiz above to view analytics</p>
        </div>
      )}

      {loading && <LoadingSpinner className="mt-10" />}

      {analytics && !loading && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total Attempts", value: analytics.totalAttempts },
              { label: "Average Score", value: analytics.averageScore },
              { label: "Average Percentage", value: `${Math.round(analytics.averagePercentage)}%` },
            ].map(({ label, value }) => (
              <Card key={label} className="relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <CardContent className="p-5">
                  <p className="font-display text-3xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display font-semibold uppercase tracking-wider text-muted-foreground">
                Score Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.scoreDistribution.map((bucket) => (
                <div key={bucket.range} className="flex items-center gap-3">
                  <span className="w-14 text-xs text-muted-foreground font-mono">{bucket.range}</span>
                  <div className="flex-1 h-6 rounded-lg bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary/80 rounded-lg transition-all duration-500"
                      style={{
                        width: `${analytics.totalAttempts > 0 ? Math.max((bucket.count / analytics.totalAttempts) * 100, 2) : 2}%`,
                      }}
                    />
                  </div>
                  <span className="w-6 text-xs font-bold text-right">{bucket.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display font-semibold uppercase tracking-wider text-muted-foreground">
                Question Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.questionStats.map((q, i) => (
                <div key={q.questionId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex-1 truncate text-foreground">Q{i + 1}: {q.text}</span>
                    <span className="ml-2 font-display font-semibold">{Math.round(q.accuracy)}%</span>
                  </div>
                  <Progress value={q.accuracy} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display font-semibold uppercase tracking-wider text-muted-foreground">
                Recent Attempts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.recentAttempts.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">No attempts yet</p>
              ) : (
                analytics.recentAttempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{a.student?.name}</p>
                      <p className="text-xs text-muted-foreground">{a.completedAt && formatDate(a.completedAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{formatTime(a.timeTaken)}</span>
                      <Badge variant={a.percentage >= 70 ? "success" : a.percentage >= 40 ? "secondary" : "destructive"}>
                        {Math.round(a.percentage)}%
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
