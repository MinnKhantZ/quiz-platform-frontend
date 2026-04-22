import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { formatTime, formatDate } from "../../lib/utils";
import { useNavigate } from "react-router-dom";
import { Trophy, CheckCircle2, XCircle, Star } from "lucide-react";
import type { Attempt } from "../../types";
import { cn } from "../../lib/utils";

interface QuizResultsProps {
  attempt: Attempt;
}

export default function QuizResults({ attempt }: QuizResultsProps) {
  const navigate = useNavigate();
  const pct = Math.round(attempt.percentage);
  const isPassing = pct >= 70;

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-slide-up">
      {/* Score hero */}
      <Card className={cn(
        "relative overflow-hidden border",
        isPassing ? "border-primary/30" : "border-border"
      )}>
        {isPassing && (
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        )}
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          {/* Icon */}
          <div className={cn(
            "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl",
            isPassing ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
          )}>
            {isPassing ? (
              <Trophy className="h-8 w-8" />
            ) : (
              <Star className="h-8 w-8" />
            )}
          </div>

          <div>
            <p className="font-display text-3xl font-bold text-foreground">Quiz Complete!</p>
            <p className="text-muted-foreground mt-1">{attempt.quiz?.title}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
            <div>
              <p className={cn(
                "font-display text-4xl font-bold",
                isPassing ? "text-primary" : "text-foreground"
              )}>
                {pct}%
              </p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-display font-semibold">Score</p>
            </div>
            <div>
              <p className="font-display text-4xl font-bold text-foreground">
                {attempt.score}/{attempt.totalPoints}
              </p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-display font-semibold">Points</p>
            </div>
            <div>
              <p className="font-display text-4xl font-bold text-foreground">
                {formatTime(attempt.timeTaken)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-display font-semibold">Time</p>
            </div>
          </div>

          <Progress value={attempt.percentage} className="h-2" />

          {attempt.completedAt && (
            <p className="text-xs text-muted-foreground">{formatDate(attempt.completedAt)}</p>
          )}
        </CardContent>
      </Card>

      {/* Question breakdown */}
      {attempt.answers && attempt.answers.length > 0 && (
        <div className="space-y-2">
          <p className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Question Breakdown
          </p>
          {attempt.answers.map((ans) => (
            <div key={ans.id} className={cn(
              "flex items-start gap-3 rounded-xl border p-3.5",
              ans.isCorrect ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"
            )}>
              {ans.isCorrect ? (
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5 text-success" />
              ) : (
                <XCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-destructive" />
              )}
              <span className="flex-1 text-sm text-foreground">{ans.question?.text}</span>
              <Badge variant={ans.isCorrect ? "success" : "destructive"} className="shrink-0">
                {ans.points}/{ans.question?.points}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button className="flex-1" onClick={() => navigate("/student/quizzes")}>
          More Quizzes
        </Button>
      </div>
    </div>
  );
}

