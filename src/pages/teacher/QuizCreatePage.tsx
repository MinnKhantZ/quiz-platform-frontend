import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizStore } from "../../stores/quizStore";
import { api } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { PlusCircle, Trash2, ImagePlus } from "lucide-react";
import type { TimerType, QuestionType } from "../../types";

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface DraftQuestion {
  id?: string;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  correctAnswer: string;
  points: number;
  imageUrl: string | null;
  saved: boolean;
}

export default function QuizCreatePage() {
  const navigate = useNavigate();
  const { createQuiz } = useQuizStore();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [timerType, setTimerType] = useState<TimerType>("NONE");
  const [timerSeconds, setTimerSeconds] = useState(60);

  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [quizId, setQuizId] = useState<string | null>(null);

  const handleCreateQuiz = async () => {
    setSaving(true);
    try {
      const quiz = await createQuiz({
        title,
        description: description || undefined,
        category: category || undefined,
        timerType,
        timerSeconds: timerType !== "NONE" ? timerSeconds : undefined,
      });
      setQuizId(quiz.id);
      setStep(2);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: "MCQ",
        text: "",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        correctAnswer: "",
        points: 1,
        imageUrl: null,
        saved: false,
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof DraftQuestion, value: unknown) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value, saved: false } : q))
    );
  };

  const updateOption = (qIndex: number, oIndex: number, field: keyof QuestionOption, value: unknown) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.map((o, j) => {
          if (field === "isCorrect") {
            return { ...o, isCorrect: j === oIndex };
          }
          return j === oIndex ? { ...o, [field]: value } : o;
        });
        return { ...q, options, saved: false };
      })
    );
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const saveQuestion = async (index: number) => {
    const q = questions[index];
    setSaving(true);
    try {
      const data = {
        type: q.type,
        text: q.text,
        points: q.points,
        imageUrl: q.imageUrl,
        options: q.type === "FILL_BLANK" ? null : q.options,
        correctAnswer: q.type === "FILL_BLANK" ? q.correctAnswer : null,
      };

      if (q.id) {
        await api.put(`/questions/${q.id}`, data as Record<string, unknown>);
        setQuestions((prev) =>
          prev.map((qq, i) => (i === index ? { ...qq, saved: true } : qq))
        );
      } else {
        const created = await api.post<{ id: string }>(`/${quizId}/questions`, data as Record<string, unknown>);
        setQuestions((prev) =>
          prev.map((qq, i) => (i === index ? { ...qq, id: created.id, saved: true } : qq))
        );
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (index: number, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { url } = await api.upload<{ url: string }>("/upload", formData);
      updateQuestion(index, "imageUrl", url);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const publishQuiz = async () => {
    setSaving(true);
    try {
      await api.put(`/quizzes/${quizId}`, { isPublished: true });
      navigate("/teacher/quizzes");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (step === 1) {
    return (
      <div className="mx-auto max-w-xl space-y-6 animate-slide-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
            <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">Step 1 of 2</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Create New Quiz</h1>
          <p className="text-muted-foreground mt-1">Set up the basic details for your quiz</p>
        </div>
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Math Chapter 1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat">Category</Label>
              <Input id="cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div className="space-y-2">
              <Label>Timer Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["NONE", "PER_QUIZ", "PER_QUESTION"] as TimerType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimerType(t)}
                    className={`rounded-lg border-2 p-3 text-center text-sm font-display font-medium transition-colors ${
                      timerType === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    {t === "NONE" ? "No Timer" : t === "PER_QUIZ" ? "Per Quiz" : "Per Question"}
                  </button>
                ))}
              </div>
              {timerType !== "NONE" && (
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    type="number"
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(Number(e.target.value))}
                    min={10}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">seconds</span>
                </div>
              )}
            </div>
            <Button onClick={handleCreateQuiz} disabled={!title || saving} className="w-full" size="lg">
              {saving ? "Creating…" : "Next: Add Questions →"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
            <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">Step 2 of 2</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Add Questions</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate("/teacher/quizzes")}>
            Save as Draft
          </Button>
          <Button size="sm" onClick={publishQuiz} disabled={questions.length === 0 || saving}>
            Publish Quiz
          </Button>
        </div>
      </div>

      {questions.map((q, qIndex) => (
        <Card key={qIndex} className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-display font-semibold uppercase tracking-wider text-muted-foreground">
              Question {qIndex + 1}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={q.saved ? "success" : "secondary"}>{q.saved ? "Saved" : "Unsaved"}</Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeQuestion(qIndex)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {(["MCQ", "TRUE_FALSE", "FILL_BLANK"] as QuestionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    updateQuestion(qIndex, "type", t);
                    if (t === "TRUE_FALSE") {
                      updateQuestion(qIndex, "options", [
                        { text: "True", isCorrect: true },
                        { text: "False", isCorrect: false },
                      ]);
                    } else if (t === "MCQ") {
                      updateQuestion(qIndex, "options", [
                        { text: "", isCorrect: true },
                        { text: "", isCorrect: false },
                        { text: "", isCorrect: false },
                        { text: "", isCorrect: false },
                      ]);
                    }
                  }}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-display font-medium transition-colors ${
                    q.type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {t === "MCQ" ? "MCQ" : t === "TRUE_FALSE" ? "True/False" : "Fill Blank"}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Question Text</Label>
              <Input value={q.text} onChange={(e) => updateQuestion(qIndex, "text", e.target.value)} placeholder="Enter question…" />
            </div>

            <div>
              {q.imageUrl ? (
                <div className="relative">
                  <img src={q.imageUrl} alt="" className="max-h-32 rounded-lg" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1"
                    onClick={() => updateQuestion(qIndex, "imageUrl", null)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-accent/60 transition-colors">
                  <ImagePlus className="h-4 w-4" />
                  Add image (optional)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(qIndex, e.target.files[0])}
                  />
                </label>
              )}
            </div>

            {(q.type === "MCQ" || q.type === "TRUE_FALSE") && (
              <div className="space-y-2">
                <Label>Options — click radio to mark correct</Label>
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={opt.isCorrect}
                      onChange={() => updateOption(qIndex, oIndex, "isCorrect", true)}
                      className="h-4 w-4 accent-[oklch(0.74_0.16_80)]"
                    />
                    <Input
                      value={opt.text}
                      onChange={(e) => updateOption(qIndex, oIndex, "text", e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      disabled={q.type === "TRUE_FALSE"}
                    />
                  </div>
                ))}
              </div>
            )}

            {q.type === "FILL_BLANK" && (
              <div className="space-y-2">
                <Label>Correct Answer</Label>
                <Input
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(qIndex, "correctAnswer", e.target.value)}
                  placeholder="Type the correct answer"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <Label>Points</Label>
              <Input
                type="number"
                value={q.points}
                onChange={(e) => updateQuestion(qIndex, "points", Number(e.target.value))}
                min={1}
                className="w-20"
              />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => saveQuestion(qIndex)}
              disabled={!q.text || saving}
            >
              {saving ? "Saving…" : q.saved ? "Update Question" : "Save Question"}
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full border-dashed" onClick={addQuestion}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Question
      </Button>
    </div>
  );
}
