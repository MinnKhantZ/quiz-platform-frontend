import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import QuestionCard from "../../components/quiz/QuestionCard";
import QuizResults from "../../components/quiz/QuizResults";
import Timer from "../../components/quiz/Timer";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";

export default function QuizTakePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attemptData, setAttemptData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.post(`/quizzes/${id}/start`).then((data) => {
      setAttemptData(data);
      setLoading(false);
    }).catch((err) => {
      alert(err.message);
      navigate("/student/quizzes");
    });
  }, [id, navigate]);

  const handleAnswer = useCallback(async (answer) => {
    setAnswers((prev) => [...prev, answer]);

    // Check if this is the last question
    const questions = attemptData.questions;
    const isLast = currentIndex === questions.length - 1;

    // For immediate feedback, we'll submit individual answer check
    // But the final submit happens at the end
    const allAnswers = [...answers, answer];

    if (isLast) {
      // Submit all answers
      try {
        const res = await api.post(`/attempts/${attemptData.attempt.id}/submit`, {
          answers: allAnswers,
        });
        setResult(res);
      } catch (err) {
        alert(err.message);
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
    // Auto-submit with current answers
    if (attemptData) {
      const remaining = attemptData.questions.slice(answers.length).map((q) => ({
        questionId: q.id,
        selectedOption: null,
        textAnswer: null,
      }));
      const allAnswers = [...answers, ...remaining];
      api.post(`/attempts/${attemptData.attempt.id}/submit`, { answers: allAnswers })
        .then(setResult)
        .catch((err) => alert(err.message));
    }
  }, [attemptData, answers]);

  if (loading) return <LoadingSpinner className="mt-20" />;
  if (result) return <QuizResults attempt={result} />;
  if (!attemptData) return null;

  const { quiz, questions } = attemptData;
  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate("/student/quizzes")}>
            Quit
          </Button>
        </div>
        <Progress value={progress} />
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
        isCorrect={lastCorrect}
        disabled={false}
      />
    </div>
  );
}
