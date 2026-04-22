import { useState, useEffect } from "react";
import { useSocketStore } from "../../stores/socketStore";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import QuestionCard from "../../components/quiz/QuestionCard";
import { Radio, AlertCircle } from "lucide-react";
import type { Question } from "../../types";

interface AnswerPayload {
  questionId: string;
  selectedOption?: number | null;
  textAnswer?: string;
}

export default function StudentLivePage() {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const {
    connect,
    joinSession,
    submitLiveAnswer,
    session,
    currentQuestion,
    questionIndex,
    totalQuestions,
    disconnect,
    reconnecting,
  } = useSocketStore();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const handleJoin = async () => {
    setError("");
    const res = await joinSession(joinCode.toUpperCase());
    if (!res.success) setError(res.error ?? "Failed to join session");
  };

  const handleAnswer = async (answer: AnswerPayload) => {
    const res = await submitLiveAnswer(
      answer.questionId,
      answer.selectedOption ?? null,
      answer.textAnswer ?? null,
    );
    if (res.success) {
      setAnswered(true);
      setLastCorrect(res.isCorrect ?? null);
    }
  };

  useEffect(() => {
    setAnswered(false);
    setLastCorrect(null);
  }, [questionIndex]);

  if (!session) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-sm space-y-6 animate-slide-up">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <Radio className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold">Join Live Quiz</h1>
            <p className="text-muted-foreground mt-1.5">Enter the 6-character code from your teacher</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl shadow-black/20">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            <Input
              placeholder="ABC123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl tracking-[0.4em] font-mono font-bold h-14"
            />
            <Button
              className="w-full"
              size="lg"
              onClick={handleJoin}
              disabled={joinCode.length !== 6 || reconnecting}
            >
              {reconnecting ? "Reconnecting…" : "Join Session"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 animate-fade-in">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <div className="text-center">
          <p className="font-display text-xl font-bold">Waiting for the teacher…</p>
          <p className="text-muted-foreground text-sm mt-1">The session will start soon</p>
        </div>
        <Badge variant="secondary" className="text-base px-4 py-2">
          {session.quiz?.title}
        </Badge>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-foreground truncate pr-4">{session.quiz?.title}</h2>
        <Badge variant="default" className="shrink-0">
          <Radio className="h-3 w-3 mr-1 animate-pulse" /> Live
        </Badge>
      </div>

      <QuestionCard
        question={currentQuestion as unknown as Question}
        index={questionIndex}
        total={totalQuestions}
        onAnswer={handleAnswer}
        showResult={answered}
        isCorrect={lastCorrect ?? false}
        disabled={answered}
      />

      {answered && (
        <p className="text-center text-sm text-muted-foreground animate-fade-in">
          Answer recorded — waiting for the next question…
        </p>
      )}
    </div>
  );
}


