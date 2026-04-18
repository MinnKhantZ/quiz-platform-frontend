import { useEffect } from "react";
import { useQuizStore } from "../../stores/quizStore";
import QuizCard from "../../components/quiz/QuizCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function QuizListPage() {
  const { quizzes, loading, fetchQuizzes } = useQuizStore();

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Available Quizzes</h1>
        <p className="text-muted-foreground">Choose a quiz to test your knowledge</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No quizzes available yet. Check back later!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
