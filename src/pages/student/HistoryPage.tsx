import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { formatDate, formatTime } from "../../lib/utils";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import type { Attempt } from "../../types";

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Attempt[]>("/me/attempts").then((data) => {
      setAttempts(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quiz History</h1>
        <p className="text-muted-foreground">View your past quiz attempts</p>
      </div>

      {attempts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No quiz attempts yet. Take a quiz to get started!</p>
          <Button className="mt-4" onClick={() => navigate("/student/quizzes")}>
            Browse Quizzes
          </Button>
        </div>
      ) : (
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
      )}
    </div>
  );
}
