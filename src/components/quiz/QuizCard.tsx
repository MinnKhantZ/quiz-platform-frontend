import { Card, CardContent, CardHeader, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Users, ChevronRight } from "lucide-react";
import type { Quiz, TimerType } from "../../types";

interface QuizCardProps {
  quiz: Quiz;
  isTeacher?: boolean;
}

export default function QuizCard({ quiz, isTeacher = false }: QuizCardProps) {
  const navigate = useNavigate();

  const timerLabels: Record<TimerType, string | null> = {
    NONE: null,
    PER_QUIZ: `${quiz.timerSeconds}s total`,
    PER_QUESTION: `${quiz.timerSeconds}s/q`,
  };

  return (
    <Card className="group flex flex-col card-lift border-border overflow-hidden">
      {/* Top accent bar */}
      <div className="h-0.5 bg-gradient-to-r from-primary/40 via-primary/60 to-primary/20" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-foreground leading-snug line-clamp-2 flex-1">
            {quiz.title}
          </h3>
          {isTeacher && (
            <Badge variant={quiz.isPublished ? "success" : "secondary"} className="shrink-0 ml-1">
              {quiz.isPublished ? "Live" : "Draft"}
            </Badge>
          )}
        </div>
        {quiz.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{quiz.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary/70" />
            {quiz._count?.questions || 0} questions
          </span>
          {timerLabels[quiz.timerType] && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary/70" />
              {timerLabels[quiz.timerType]}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary/70" />
            {quiz._count?.attempts || 0} attempts
          </span>
        </div>
        {quiz.category && (
          <Badge variant="outline" className="mt-3 text-xs">
            {quiz.category}
          </Badge>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        {isTeacher ? (
          <>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/teacher/quizzes/${quiz.id}`)}>
              Edit
            </Button>
            <Button size="sm" className="flex-1" onClick={() => navigate(`/teacher/quizzes/${quiz.id}/analytics`)}>
              Analytics
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" className="flex-1 group-hover:glow-primary transition-shadow" onClick={() => navigate(`/student/quizzes/${quiz.id}`)}>
              Start Quiz <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/student/quizzes/${quiz.id}/leaderboard`)}>
              <Users className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

