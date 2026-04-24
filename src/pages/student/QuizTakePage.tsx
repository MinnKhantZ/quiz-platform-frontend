import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { cache } from "../../lib/cache";
import QuestionCard from "../../components/quiz/QuestionCard";
import QuizResults from "../../components/quiz/QuizResults";
import Timer from "../../components/quiz/Timer";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { toast } from "../../hooks/useToast";
import type { Quiz, Question, Attempt } from "../../types";

interface AttemptData {
  quiz: Quiz;
  questions: Question[];
  attempt: { id: string };
}

interface AnswerPayload {
  questionId: string;
  selectedOption?: number | null;
  textAnswer?: string | null;
}

export default function QuizTakePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [attemptData, setAttemptData] = useState<AttemptData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerPayload[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [result, setResult] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    api.post<AttemptData>(`/quizzes/${id}/start`).then((data) => {
      setAttemptData(data);
      setLoading(false);
    }).catch((err: Error) => {
      toast.error("Failed to start quiz", err.message);
      navigate("/student/quizzes");
    });
  }, [id, navigate]);

  const handleAnswer = useCallback(async (answer: AnswerPayload) => {
    if (!attemptData || hasSubmitted.current) return;

    const updatedAnswers = [...answers, answer];
    setAnswers(updatedAnswers);

    const questions = attemptData.questions;
    const isLast = currentIndex === questions.length - 1;

    // Determine correctness locally
    const currentQ = questions[currentIndex];
    let isCorrectLocal = false;
    if (answer.selectedOption != null) {
      isCorrectLocal = currentQ.options?.[answer.selectedOption]?.isCorrect ?? false;
    } else if (currentQ.type === "FILL_BLANK" && answer.textAnswer != null) {
      isCorrectLocal =
        !!currentQ.correctAnswer &&
        answer.textAnswer.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
    }

    if (isLast) {
      hasSubmitted.current = true;
      setSubmitting(true);
      try {
        const res = await api.post<Attempt>(`/attempts/${attemptData.attempt.id}/submit`, {
          answers: updatedAnswers as unknown as Record<string, unknown>,
        });
        cache.invalidate("student:dashboard");
        cache.invalidatePrefix("history:");
        cache.invalidate(`leaderboard:${id}`);
        cache.invalidate(`analytics:${id}`);
        setResult(res);
      } catch (err) {
        hasSubmitted.current = false;
        setSubmitting(false);
        toast.error("Failed to submit quiz", (err as Error).message);
      }
    } else {
      setLastCorrect(isCorrectLocal);
      setShowResult(true);
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setShowResult(false);
        setLastCorrect(null);
      }, 1500);
    }
  }, [attemptData, currentIndex, answers, id]);

  const handleTimeUp = useCallback(() => {
    if (!attemptData || hasSubmitted.current) return;
    hasSubmitted.current = true;
    setSubmitting(true);
    // Fill any unanswered questions with null answers
    const remaining = attemptData.questions.slice(answers.length).map((q) => ({
      questionId: q.id,
      selectedOption: null,
      textAnswer: null,
    }));
    const allAnswers = [...answers, ...remaining];
    api.post<Attempt>(`/attempts/${attemptData.attempt.id}/submit`, {
      answers: allAnswers as unknown as Record<string, unknown>,
    })
      .then((res) => {
        cache.invalidate("student:dashboard");
        cache.invalidatePrefix("history:");
        cache.invalidate(`leaderboard:${id}`);
        cache.invalidate(`analytics:${id}`);
        setResult(res);
      })
      .catch((err: Error) => {
        hasSubmitted.current = false;
        setSubmitting(false);
        toast.error("Failed to submit quiz", err.message);
      });
  }, [attemptData, answers, id]);

  if (loading) return <LoadingSpinner className="mt-20" />;
  if (result) return <QuizResults attempt={result} />;
  if (submitting) return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 animate-fade-in">
      <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="font-display text-lg font-semibold text-foreground">Submitting your answers…</p>
      <p className="text-sm text-muted-foreground">Please wait a moment</p>
    </div>
  );
  if (!attemptData) return null;

  const { quiz, questions } = attemptData;
  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-slide-up">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg font-bold text-foreground truncate pr-4">{quiz.title}</h1>
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => navigate("/student/quizzes")}>
            Quit
          </Button>
        </div>
        <div className="space-y-1">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-right">
            {currentIndex + 1} of {questions.length}
          </p>
        </div>
      </div>

      {quiz.timerType !== "NONE" && quiz.timerSeconds && (
        <Timer
          key={quiz.timerType === "PER_QUESTION" ? currentIndex : "quiz"}
          seconds={quiz.timerSeconds}
          onTimeUp={handleTimeUp}
        />
      )}

      <QuestionCard
        question={question}
        index={currentIndex}
        total={questions.length}
        onAnswer={handleAnswer}
        showResult={showResult}
        isCorrect={lastCorrect ?? false}
        disabled={false}
      />
    </div>
  );
}

