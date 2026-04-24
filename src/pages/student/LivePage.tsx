import { useState, useEffect } from "react";
import { useSocketStore } from "../../stores/socketStore";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import QuestionCard from "../../components/quiz/QuestionCard";
import QuizResults from "../../components/quiz/QuizResults";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Radio, AlertCircle, ClipboardList, Trophy, ArrowLeft, Medal, Award } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Question, Attempt } from "../../types";

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
  const [activePanel, setActivePanel] = useState<null | "myResults" | "leaderboard">(null);
  const [myAttempt, setMyAttempt] = useState<Attempt | null>(null);
  const [loadingAttempt, setLoadingAttempt] = useState(false);
  const user = useAuthStore((s) => s.user);

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
    sessionFinished,
    sessionResults,
    sessionState,
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
    // Quiz is finished — show waiting screen with teacher-enabled actions
    if (sessionFinished) {
      const myResult = sessionResults.find((r) => r.studentId === user?.id);

      // ── Inline: My Results panel ──────────────────────────────────────
      if (activePanel === "myResults") {
        return (
          <div className="mx-auto max-w-2xl space-y-4 animate-slide-up">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 -ml-1"
              onClick={() => setActivePanel(null)}
            >
              <ArrowLeft className="h-4 w-4" /> Back to session
            </Button>
            {loadingAttempt || !myAttempt ? (
              <LoadingSpinner className="mt-16" />
            ) : (
              <QuizResults attempt={myAttempt} showActions={false} />
            )}
          </div>
        );
      }

      // ── Inline: Session Leaderboard panel ─────────────────────────────
      if (activePanel === "leaderboard") {
        return (
          <div className="mx-auto max-w-2xl space-y-5 animate-slide-up">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 -ml-1"
              onClick={() => setActivePanel(null)}
            >
              <ArrowLeft className="h-4 w-4" /> Back to session
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">
                  Session Rankings
                </span>
              </div>
              <h2 className="font-display text-xl font-bold">Leaderboard</h2>
            </div>
            <div className="space-y-2">
              {sessionResults.map((r, i) => {
                const isMe = r.studentId === user?.id;
                const rankIcons = [
                  <Trophy key="1" className="h-5 w-5 text-yellow-400" />,
                  <Medal key="2" className="h-5 w-5 text-slate-300" />,
                  <Award key="3" className="h-5 w-5 text-amber-600" />,
                ];
                return (
                  <div
                    key={r.studentId}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border p-4",
                      i === 0 && "border-yellow-400/30 bg-yellow-400/5",
                      i === 1 && "border-slate-300/30 bg-slate-300/5",
                      i === 2 && "border-amber-600/30 bg-amber-600/5",
                      i > 2 && !isMe && "border-border bg-card",
                      i > 2 && isMe && "border-primary/30 bg-primary/5"
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                      {i < 3 ? rankIcons[i] : (
                        <span className="font-display text-base font-bold text-muted-foreground">#{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{r.studentName}</p>
                        {isMe && <Badge variant="default" className="text-xs">You</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-muted-foreground">{r.score}/{r.totalPoints} pts</span>
                      <Badge variant={r.percentage >= 70 ? "success" : r.percentage >= 40 ? "secondary" : "destructive"}>
                        {Math.round(r.percentage)}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // ── Default: session-end action screen ────────────────────────────
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 animate-fade-in">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="text-center">
            <p className="font-display text-xl font-bold">Quiz Complete!</p>
            <p className="text-muted-foreground text-sm mt-1">Waiting for teacher action…</p>
          </div>
          <Badge variant="secondary" className="text-base px-4 py-2">
            {session.quiz?.title}
          </Badge>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {sessionState.showResults && myResult && (
              <Button
                className="w-full gap-2"
                onClick={async () => {
                  setLoadingAttempt(true);
                  setActivePanel("myResults");
                  try {
                    const data = await api.get<Attempt>(`/attempts/${myResult.attemptId}`);
                    setMyAttempt(data);
                  } finally {
                    setLoadingAttempt(false);
                  }
                }}
              >
                <ClipboardList className="h-4 w-4" /> View My Results
              </Button>
            )}
            {sessionState.showLeaderboard && sessionResults.length > 0 && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setActivePanel("leaderboard")}
              >
                <Trophy className="h-4 w-4" /> View Leaderboard
              </Button>
            )}
          </div>
        </div>
      );
    }

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


