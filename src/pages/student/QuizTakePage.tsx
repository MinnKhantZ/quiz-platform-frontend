import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import QuestionCard from "../../components/quiz/QuestionCard";
import QuizResults from "../../components/quiz/QuizResults";
import Timer from "../../components/quiz/Timer";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
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

  useEffect(() => {
    api.post<AttemptData>(`/quizzes/${id}/start`).then((data) => {
      setAttemptData(data);
      setLoading(false);
    }).catch((err: Error) => {
      alert(err.message);
      navigate("/student/quizzes");
    });
  }, [id, navigate]);

  const handleAnswer = useCallback(async (answer: AnswerPayload) => {
    if (!attemptData) return;

    const updatedAnswers = [...answers, answer];
    setAnswers(updatedAnswers);

    const questions = attemptData.questions;
    const isLast = currentIndex === questions.length - 1;

    if (isLast) {
      try {
        const res = await api.post<Attempt>(`/attempts/${attemptData.attempt.id}/submit`, {
          answers: updatedAnswers as unknown as Record<string, unknown>,
        });
        setResult(res);
      } catch (err) {
        alert((err as Error).message);
      }
    } else {
      setShowResult(true);
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setShowResult(false);
        setLastCorrect(null);
      }, 1500);
    }
  }, [attemptData, currentIndex, answers]);

  const handleTimeUp = useCallback(() => {
    if (!attemptData) return;
    const remaining = attemptData.questions.slice(answers.length).map((q) => ({
      questionId: q.id,
      selectedOption: null,
      textAnswer: null,
    }));
    const allAnswers = [...answers, ...remaining];
    api.post<Attempt>(`/attempts/${attemptData.attempt.id}/submit`, {
      answers: allAnswers as unknown as Record<string, unknown>,
    })
      .then(setResult)
      .catch((err: Error) => alert(err.message));
  }, [attemptData, answers]);

  if (loading) return <LoadingSpinner className="mt-20" />;
  if (result) return <QuizResults attempt={result} />;
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

