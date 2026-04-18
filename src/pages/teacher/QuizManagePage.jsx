import { useEffect } from "react";
import { useQuizStore } from "../../stores/quizStore";
import { useNavigate } from "react-router-dom";
import QuizCard from "../../components/quiz/QuizCard";
import { Button } from "../../components/ui/button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { PlusCircle } from "lucide-react";

export default function QuizManagePage() {
  const { quizzes, loading, fetchQuizzes } = useQuizStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Quizzes</h1>
          <p className="text-muted-foreground">Create and manage your quizzes</p>
        </div>
        <Button onClick={() => navigate("/teacher/create")}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Quiz
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No quizzes yet. Create your first quiz!</p>
          <Button className="mt-4" onClick={() => navigate("/teacher/create")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Quiz
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
