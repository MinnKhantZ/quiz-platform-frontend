import { useState, useEffect } from "react";
import { useSocketStore } from "../../stores/socketStore";
import { useQuizStore } from "../../stores/quizStore";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Users, Play, SkipForward, StopCircle, Copy, Check } from "lucide-react";
import type { QuizOption } from "../../types";

export default function TeacherLivePage() {
  const { quizzes, fetchQuizzes } = useQuizStore();
  const {
    connect, createSession, startSession, nextQuestion, endSession, disconnect,
    session, currentQuestion, questionIndex, totalQuestions, students, answers,
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Start Live Session</h1>
          <p className="text-muted-foreground">Select a quiz to host a live session</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes
            .filter((q) => q.isPublished)
            .map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <CardTitle className="text-base">{quiz.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {quiz._count?.questions || 0} questions
                  </p>
                  <Button className="w-full" onClick={() => handleCreate(quiz.id)}>
                    <Play className="mr-2 h-4 w-4" /> Start Session
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live Session</h1>
        <Button variant="destructive" onClick={() => endSession()}>
          <StopCircle className="mr-2 h-4 w-4" /> End Session
        </Button>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">Join Code</p>
            <p className="text-4xl font-mono font-bold tracking-widest">{session.joinCode}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={copyCode}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="text-lg font-bold">{students.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!currentQuestion ? (
        <Button size="lg" className="w-full" onClick={() => startSession()} disabled={students.length === 0}>
          <Play className="mr-2 h-5 w-5" /> Start Quiz ({students.length} students joined)
        </Button>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge>Question {questionIndex + 1}/{totalQuestions}</Badge>
                <Badge variant="outline">{answers.length} answers received</Badge>
              </div>
              <CardTitle className="mt-2">{currentQuestion.text}</CardTitle>
            </CardHeader>
            <CardContent>
              {currentQuestion.options && (
                <div className="space-y-2">
                  {(currentQuestion.options as QuizOption[]).map((opt, i) => {
                    const count = answers.filter((a) => (a as { selectedOption?: number }).selectedOption === i).length;
                    const pct = answers.length > 0 ? (count / answers.length) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-8 text-sm font-medium">{String.fromCharCode(65 + i)}</span>
                        <div className="flex-1 h-8 rounded bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary/70 rounded transition-all flex items-center px-2"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          >
                            <span className="text-xs font-medium text-primary-foreground">{count}</span>
                          </div>
                        </div>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {students.map((s) => (
              <Badge key={s.id} variant="secondary">{s.name}</Badge>
            ))}
            {students.length === 0 && (
              <p className="text-sm text-muted-foreground">Waiting for students to join...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
