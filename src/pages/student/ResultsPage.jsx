import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";
import QuizResults from "../../components/quiz/QuizResults";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function ResultsPage() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);

  useEffect(() => {
    api.get(`/attempts/${id}`).then(setAttempt).catch(console.error);
  }, [id]);

  if (!attempt) return <LoadingSpinner className="mt-20" />;

  return <QuizResults attempt={attempt} />;
}
