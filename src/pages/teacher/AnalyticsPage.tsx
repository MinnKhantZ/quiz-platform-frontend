import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { formatDate, formatTime } from "../../lib/utils";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useQuizStore } from "../../stores/quizStore";
import { BarChart3 } from "lucide-react";
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
    setLoading(true);
    api.get<QuizAnalytics>(`/quizzes/${selectedQuiz}/analytics`).then((data) => {
      setAnalytics(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedQuiz]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">View detailed performance metrics for your quizzes</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {quizzes.map((q) => (
          <button
            key={q.id}
            onClick={() => setSelectedQuiz(q.id)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              selectedQuiz === q.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
            }`}
          >
            {q.title}
          </button>
        ))}
      </div>

      {!selectedQuiz && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-16 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Select a quiz above to view analytics</p>
        </div>
      )}

      {loading && <LoadingSpinner className="mt-10" />}

      {analytics && !loading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{analytics.totalAttempts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{analytics.averageScore}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Percentage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{Math.round(analytics.averagePercentage)}%</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.scoreDistribution.map((bucket) => (
                <div key={bucket.range} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-muted-foreground">{bucket.range}</span>
                  <div className="flex-1">
                    <div className="h-6 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded transition-all"
                        style={{
                          width: `${analytics.totalAttempts > 0 ? (bucket.count / analytics.totalAttempts) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-sm font-medium text-right">{bucket.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Question Accuracy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.questionStats.map((q, i) => (
                <div key={q.questionId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex-1 truncate">Q{i + 1}: {q.text}</span>
                    <span className="ml-2 font-medium">{Math.round(q.accuracy)}%</span>
                  </div>
                  <Progress value={q.accuracy} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.recentAttempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{a.student?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.completedAt && formatDate(a.completedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{formatTime(a.timeTaken)}</span>
                      <Badge variant={a.percentage >= 70 ? "success" : a.percentage >= 40 ? "secondary" : "destructive"}>
                        {Math.round(a.percentage)}%
                      </Badge>
                    </div>
                  </div>
                ))}
                {analytics.recentAttempts.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">No attempts yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
