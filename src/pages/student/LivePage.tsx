import { useState, useEffect } from "react";
import { useSocketStore } from "../../stores/socketStore";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import QuestionCard from "../../components/quiz/QuestionCard";
import { Radio } from "lucide-react";
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
  } =
    useSocketStore();

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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Radio className="mx-auto h-12 w-12 text-primary" />
            <CardTitle>Join Live Quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <Input
              placeholder="Enter join code (e.g. ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
            <Button className="w-full" onClick={handleJoin} disabled={joinCode.length !== 6 || reconnecting}>
              Join Session
            </Button>
            {reconnecting && <p className="text-center text-sm text-muted-foreground">Reconnecting to live server...</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-lg font-medium">Waiting for the teacher to start...</p>
        <Badge variant="outline" className="text-lg">{session.quiz?.title}</Badge>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{session.quiz?.title}</h2>
        <Badge>Live</Badge>
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
        <div className="text-center text-muted-foreground">Waiting for next question...</div>
      )}
    </div>
  );
}
