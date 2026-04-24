import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { cache } from "../../lib/cache";
import QuizResults from "../../components/quiz/QuizResults";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import type { Attempt } from "../../types";

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<Attempt | null>(
    () => (id ? (cache.get<Attempt>(`attempt:${id}`) ?? null) : null)
  );

  useEffect(() => {
    if (!id) return;
    cache.fetch<Attempt>(`attempt:${id}`, () => api.get<Attempt>(`/attempts/${id}`))
      .then(setAttempt)
      .catch(console.error);
  }, [id]);

  if (!attempt) return <LoadingSpinner className="mt-20" />;

  return <QuizResults attempt={attempt} />;
}
