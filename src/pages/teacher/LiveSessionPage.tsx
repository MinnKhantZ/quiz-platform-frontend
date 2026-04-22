import { useState, useEffect } from "react";
import { useSocketStore } from "../../stores/socketStore";
import { useQuizStore } from "../../stores/quizStore";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Users, Play, SkipForward, StopCircle, Copy, Check, Radio } from "lucide-react";
import type { QuizOption } from "../../types";

export default function TeacherLivePage() {
  const { quizzes, fetchQuizzes } = useQuizStore();
  const {
    connect, createSession, startSession, nextQuestion, endSession, disconnect,
    session, currentQuestion, questionIndex, totalQuestions, students, answers, reconnecting,
  } = useSocketStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchQuizzes();
    connect();
    return () => disconnect();
  }, [fetchQuizzes, connect, disconnect]);

  const handleCreate = async (quizId: string) => {
    await createSession(quizId);
  };

  const copyCode = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!session) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="h-4 w-4 text-primary" />
            <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">
              Live
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold">Start Live Session</h1>
          <p className="text-muted-foreground mt-1">Select a published quiz to host a live session</p>
        </div>

        {quizzes.filter((q) => q.isPublished).length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <Radio className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No published quizzes available. Publish a quiz first.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes
              .filter((q) => q.isPublished)
              .map((quiz) => (
                <Card key={quiz.id} className="card-lift">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{quiz.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {quiz._count?.questions || 0} questions
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => handleCreate(quiz.id)}>
                      <Play className="mr-2 h-4 w-4" /> Start Session
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">Live Session</span>
          </div>
          <h1 className="font-display text-2xl font-bold">{session.quiz?.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {reconnecting && <Badge variant="outline">Reconnecting…</Badge>}
          <Button variant="destructive" onClick={() => endSession()} size="sm">
            <StopCircle className="mr-2 h-4 w-4" /> End Session
          </Button>
        </div>
      </div>

      {/* Join code card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Join Code
            </p>
            <p className="font-mono font-bold text-4xl tracking-[0.25em] text-foreground">
              {session.joinCode}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={copyCode}>
              {copied ? (
                <><Check className="mr-2 h-4 w-4 text-success" /> Copied!</>
              ) : (
                <><Copy className="mr-2 h-4 w-4" /> Copy</>
              )}
            </Button>
            <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-display font-bold">{students.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!currentQuestion ? (
        <Button size="lg" className="w-full" onClick={() => startSession()} disabled={students.length === 0}>
          <Play className="mr-2 h-5 w-5" />
          Start Quiz
          {students.length > 0 && <span className="ml-1 text-primary-foreground/70">({students.length} joined)</span>}
        </Button>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge>Q {questionIndex + 1}/{totalQuestions}</Badge>
                <Badge variant="secondary">{answers.length} answered</Badge>
              </div>
              <CardTitle className="mt-3 text-lg leading-snug">{currentQuestion.text}</CardTitle>
            </CardHeader>
            <CardContent>
              {currentQuestion.options && (
                <div className="space-y-2">
                  {(currentQuestion.options as QuizOption[]).map((opt, i) => {
                    const count = answers.filter((a) => (a as { selectedOption?: number }).selectedOption === i).length;
                    const pct = answers.length > 0 ? (count / answers.length) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-6 font-display text-sm font-bold text-muted-foreground">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <div className="flex-1 h-7 rounded-lg bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary/70 rounded-lg transition-all duration-500 flex items-center px-3"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          >
                            {count > 0 && (
                              <span className="text-xs font-bold text-primary-foreground">{count}</span>
                            )}
                          </div>
                        </div>
                        <span className="w-8 text-xs text-right text-muted-foreground">{Math.round(pct)}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" onClick={() => nextQuestion()}>
            <SkipForward className="mr-2 h-5 w-5" /> Next Question
          </Button>
        </div>
      )}

      {/* Student list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display font-semibold uppercase tracking-wider text-muted-foreground">
            Students ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">Waiting for students to join…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {students.map((s) => (
                <Badge key={s.id} variant="secondary">{s.name}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

