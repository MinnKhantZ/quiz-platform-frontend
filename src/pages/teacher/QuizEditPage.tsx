import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuizStore } from "../../stores/quizStore";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Trash2, Save } from "lucide-react";
import type { TimerType } from "../../types";

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
    }
  }, [currentQuiz]);

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
          Questions ({currentQuiz.questions?.length || 0})
        </p>
        <div className="space-y-2">
          {currentQuiz.questions?.map((q) => (
            <div key={q.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant="outline" className="shrink-0">{q.type}</Badge>
                <span className="text-sm truncate">{q.text}</span>
              </div>
              <span className="ml-3 text-xs text-muted-foreground shrink-0">{q.points} pts</span>
            </div>
          ))}
          {(!currentQuiz.questions || currentQuiz.questions.length === 0) && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No questions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
