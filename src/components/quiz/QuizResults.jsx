import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { formatTime, formatDate } from "../../lib/utils";
import { useNavigate } from "react-router-dom";
import { Trophy, Clock, CheckCircle, XCircle } from "lucide-react";

export default function QuizResults({ attempt }) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2">
            {attempt.percentage >= 70 ? (
              <Trophy className="h-12 w-12 text-yellow-500" />
            ) : (
              <Trophy className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          <p className="text-muted-foreground">{attempt.quiz?.title}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score summary */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{Math.round(attempt.percentage)}%</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {attempt.score}/{attempt.totalPoints}
              </p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{formatTime(attempt.timeTaken)}</p>
              <p className="text-xs text-muted-foreground">Time</p>
            </div>
          </div>

          <Progress value={attempt.percentage} className="h-3" />

          {/* Per-question breakdown */}
          {attempt.answers && (
            <div className="space-y-3">
              <h3 className="font-semibold">Question Breakdown</h3>
              {attempt.answers.map((ans, i) => (
                <div key={ans.id} className="flex items-center gap-3 rounded-lg border p-3">
                  {ans.isCorrect ? (
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                  )}
                  <span className="flex-1 text-sm">{ans.question?.text}</span>
                  <Badge variant={ans.isCorrect ? "success" : "destructive"}>
                    {ans.points}/{ans.question?.points}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => navigate("/student/quizzes")}>
              More Quizzes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
