import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import QuizCard from "../../components/quiz/QuizCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Button } from "../../components/ui/button";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
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
    <div className="space-y-6 animate-slide-up">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">
            Library
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold">Available Quizzes</h1>
        <p className="text-muted-foreground mt-1">Choose a quiz to test your knowledge</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No quizzes available yet. Check back later!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground font-medium">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!hasMore}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

