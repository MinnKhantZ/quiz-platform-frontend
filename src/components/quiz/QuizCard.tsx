import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Users } from "lucide-react";
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
    PER_QUESTION: `${quiz.timerSeconds}s/question`,
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{quiz.title}</CardTitle>
          {isTeacher && (
            <Badge variant={quiz.isPublished ? "success" : "secondary"}>
              {quiz.isPublished ? "Published" : "Draft"}
            </Badge>
          )}
        </div>
        {quiz.description && <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {quiz._count?.questions || 0} questions
          </span>
          {timerLabels[quiz.timerType] && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timerLabels[quiz.timerType]}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {quiz._count?.attempts || 0} attempts
          </span>
        </div>
        {quiz.category && (
          <Badge variant="outline" className="mt-3">
            {quiz.category}
          </Badge>
        )}
      </CardContent>
      <CardFooter className="gap-2">
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
            <Button size="sm" className="flex-1" onClick={() => navigate(`/student/quizzes/${quiz.id}`)}>
              Start Quiz
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/student/quizzes/${quiz.id}/leaderboard`)}>
              Leaderboard
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
