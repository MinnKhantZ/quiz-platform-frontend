import { useEffect } from "react";
import { useQuizStore } from "../../stores/quizStore";
import { useNavigate } from "react-router-dom";
import QuizCard from "../../components/quiz/QuizCard";
import { Button } from "../../components/ui/button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { PlusCircle, BookOpen } from "lucide-react";

export default function QuizManagePage() {
  const { quizzes, loading, fetchQuizzes } = useQuizStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">
              Quizzes
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold">My Quizzes</h1>
          <p className="text-muted-foreground mt-1">Create and manage your quizzes</p>
        </div>
        <Button onClick={() => navigate("/teacher/create")} className="shrink-0">
          <PlusCircle className="h-4 w-4 mr-2" /> Create Quiz
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground mb-4">No quizzes yet. Create your first one!</p>
          <Button onClick={() => navigate("/teacher/create")}>
            <PlusCircle className="h-4 w-4 mr-2" /> Create Quiz
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} isTeacher />
          ))}
        </div>
      )}
    </div>
  );
}

