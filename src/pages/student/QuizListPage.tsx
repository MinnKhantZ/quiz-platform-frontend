import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import QuizCard from "../../components/quiz/QuizCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Button } from "../../components/ui/button";
import type { Quiz } from "../../types";

const PAGE_SIZE = 12;

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadPage = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Quiz[]>(`/quizzes?page=${targetPage}&limit=${PAGE_SIZE}`);
      setQuizzes(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Available Quizzes</h1>
        <p className="text-muted-foreground">Choose a quiz to test your knowledge</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

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

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button variant="outline" onClick={() => setPage((prev) => prev + 1)} disabled={!hasMore}>
          Next
        </Button>
      </div>
    </div>
  );
}
