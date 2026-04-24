import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuizStore } from "../../stores/quizStore";
import { api } from "../../lib/api";
import { cache } from "../../lib/cache";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Trash2, Save, PlusCircle, ImagePlus } from "lucide-react";
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

export default function QuizEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentQuiz, fetchQuiz, updateQuiz, deleteQuiz, clearCurrent } = useQuizStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [timerType, setTimerType] = useState<TimerType>("NONE");
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [saving, setSaving] = useState(false);
  const [localQuestions, setLocalQuestions] = useState<DraftQuestion[]>([]);
  const [questionSaving, setQuestionSaving] = useState(false);

  useEffect(() => {
    if (id) fetchQuiz(id);
    return () => clearCurrent();
  }, [id, fetchQuiz, clearCurrent]);

  useEffect(() => {
    if (currentQuiz) {
      setTitle(currentQuiz.title);
      setDescription(currentQuiz.description || "");
      setCategory(currentQuiz.category || "");
      setTimerType(currentQuiz.timerType);
      setTimerSeconds(currentQuiz.timerSeconds || 60);
      setLocalQuestions(
        (currentQuiz.questions || []).map((q) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          options: (q.options as QuestionOption[]) || [],
          correctAnswer: q.correctAnswer || "",
          points: q.points,
          imageUrl: q.imageUrl || null,
          saved: true,
        }))
      );
    }
  }, [currentQuiz]);

  const addQuestion = () => {
    setLocalQuestions((prev) => [
      ...prev,
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

  const updateLocalQuestion = (index: number, field: keyof DraftQuestion, value: unknown) => {
    setLocalQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value, saved: false } : q))
    );
  };

  const updateLocalOption = (qIndex: number, oIndex: number, field: keyof QuestionOption, value: unknown) => {
    setLocalQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.map((o, j) => {
          if (field === "isCorrect") return { ...o, isCorrect: j === oIndex };
          return j === oIndex ? { ...o, [field]: value } : o;
        });
        return { ...q, options, saved: false };
      })
    );
  };

  const saveQuestion = async (index: number) => {
    if (!id) return;
    const q = localQuestions[index];
    setQuestionSaving(true);
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
        setLocalQuestions((prev) =>
          prev.map((qq, i) => (i === index ? { ...qq, saved: true } : qq))
        );
      } else {
        const created = await api.post<{ id: string }>(`/${id}/questions`, data as Record<string, unknown>);
        setLocalQuestions((prev) =>
          prev.map((qq, i) => (i === index ? { ...qq, id: created.id, saved: true } : qq))
        );
      }
      cache.invalidate(`quiz:${id}`);
      cache.invalidatePrefix("quizzes:student:");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setQuestionSaving(false);
    }
  };

  const deleteQuestion = async (index: number) => {
    const q = localQuestions[index];
    if (q.id) {
      try {
        await api.delete(`/questions/${q.id}`);
        cache.invalidate(`quiz:${id}`);
        cache.invalidatePrefix("quizzes:student:");
      } catch (err) {
        alert((err as Error).message);
        return;
      }
    }
    setLocalQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (index: number, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { url } = await api.upload<{ url: string }>("/upload", formData);
      updateLocalQuestion(index, "imageUrl", url);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateQuiz(id, {
        title,
        description: description || undefined,
        category: category || undefined,
        timerType,
        timerSeconds: timerType !== "NONE" ? timerSeconds : undefined,
      });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    await deleteQuiz(id);
    navigate("/teacher/quizzes");
  };

  const togglePublish = async () => {
    if (!id || !currentQuiz) return;
    setSaving(true);
    try {
      await updateQuiz(id, { isPublished: !currentQuiz.isPublished });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!currentQuiz) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Save className="h-4 w-4 text-primary" />
            <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">Edit Quiz</span>
          </div>
          <h1 className="font-display text-2xl font-bold truncate">{currentQuiz.title}</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={togglePublish} disabled={saving}>
            {currentQuiz.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button variant="destructive" size="icon" className="h-9 w-9" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
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
          <Button onClick={handleSave} disabled={!title || saving} className="w-full" size="lg">
            <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <div>
        <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Questions ({localQuestions.length})
        </p>
        <div className="space-y-4">
          {localQuestions.map((q, qIndex) => (
            <Card key={qIndex} className="relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-display font-semibold uppercase tracking-wider text-muted-foreground">
                  Question {qIndex + 1}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={q.saved ? "success" : "secondary"}>{q.saved ? "Saved" : "Unsaved"}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteQuestion(qIndex)}>
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
                        updateLocalQuestion(qIndex, "type", t);
                        if (t === "TRUE_FALSE") {
                          updateLocalQuestion(qIndex, "options", [
                            { text: "True", isCorrect: true },
                            { text: "False", isCorrect: false },
                          ]);
                        } else if (t === "MCQ") {
                          updateLocalQuestion(qIndex, "options", [
                            { text: "", isCorrect: true },
                            { text: "", isCorrect: false },
                            { text: "", isCorrect: false },
                            { text: "", isCorrect: false },
                          ]);
                        }
                      }}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-display font-medium transition-colors ${
                        q.type === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {t === "MCQ" ? "MCQ" : t === "TRUE_FALSE" ? "True/False" : "Fill Blank"}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Input
                    value={q.text}
                    onChange={(e) => updateLocalQuestion(qIndex, "text", e.target.value)}
                    placeholder="Enter question…"
                  />
                </div>

                <div>
                  {q.imageUrl ? (
                    <div className="relative">
                      <img src={q.imageUrl} alt="" className="max-h-32 rounded-lg" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1"
                        onClick={() => updateLocalQuestion(qIndex, "imageUrl", null)}
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
                          name={`correct-edit-${qIndex}`}
                          checked={opt.isCorrect}
                          onChange={() => updateLocalOption(qIndex, oIndex, "isCorrect", true)}
                          className="h-4 w-4 accent-[oklch(0.74_0.16_80)]"
                        />
                        <Input
                          value={opt.text}
                          onChange={(e) => updateLocalOption(qIndex, oIndex, "text", e.target.value)}
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
                      onChange={(e) => updateLocalQuestion(qIndex, "correctAnswer", e.target.value)}
                      placeholder="Type the correct answer"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    value={q.points}
                    onChange={(e) => updateLocalQuestion(qIndex, "points", Number(e.target.value))}
                    min={1}
                    className="w-20"
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => saveQuestion(qIndex)}
                  disabled={!q.text || questionSaving}
                >
                  {questionSaving ? "Saving…" : q.saved ? "Update Question" : "Save Question"}
                </Button>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full border-dashed" onClick={addQuestion}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </div>
      </div>
    </div>
  );
}
