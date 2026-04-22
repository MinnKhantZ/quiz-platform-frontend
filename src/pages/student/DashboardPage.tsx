import { useEffect, useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../lib/api";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookOpen, Trophy, History, Radio, ArrowRight, Zap } from "lucide-react";
import type { Quiz, Attempt } from "../../types";

interface DashboardStats {
  quizzes: number;
  attempts: number;
  avgScore: number;
}

const StatCard = ({
  value,
  label,
  sublabel,
  accent,
}: {
  value: string | number;
  label: string;
  sublabel?: string;
  accent?: string;
}) => (
  <Card className="card-lift relative overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    <CardContent className="p-5">
      <p className={`font-display text-3xl font-bold ${accent ?? "text-foreground"}`}>{value}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
    </CardContent>
  </Card>
);

const ActionCard = ({
  label,
  description,
  icon: Icon,
  onClick,
  variant = "outline",
}: {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "outline";
}) => (
  <button
    onClick={onClick}
    className={`group flex flex-col gap-3 rounded-xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${
      variant === "default"
        ? "border-primary/30 bg-primary/10 hover:bg-primary/15 hover:border-primary/50"
        : "border-border bg-card hover:border-border/80 hover:bg-accent/60"
    }`}
  >
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
        variant === "default" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground group-hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className={`font-display font-semibold ${variant === "default" ? "text-primary" : "text-foreground"}`}>
        {label}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
    <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${variant === "default" ? "text-primary" : "text-muted-foreground"}`} />
  </button>
);

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ quizzes: 0, attempts: 0, avgScore: 0 });

  useEffect(() => {
    Promise.all([
      api.get<Quiz[]>("/quizzes"),
      api.get<Attempt[]>("/me/attempts"),
    ]).then(([quizzes, attempts]) => {
      const completed = attempts.filter((a) => a.completedAt);
      const avg = completed.length > 0
        ? completed.reduce((s, a) => s + a.percentage, 0) / completed.length
        : 0;
      setStats({ quizzes: quizzes.length, attempts: completed.length, avgScore: Math.round(avg) });
    }).catch(() => {});
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Hero header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">
              Student Dashboard
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Hey, {firstName}!
          </h1>
          <p className="text-muted-foreground mt-1">Ready to sharpen your knowledge?</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard value={stats.quizzes} label="Available Quizzes" />
        <StatCard value={stats.attempts} label="Quizzes Completed" />
        <StatCard
          value={`${stats.avgScore}%`}
          label="Average Score"
          accent={
            stats.avgScore >= 70
              ? "text-success"
              : stats.avgScore >= 40
              ? "text-primary"
              : "text-destructive"
          }
        />
      </div>

      {/* Quick actions */}
      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Quick Actions
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            label="Browse Quizzes"
            description="Find and start a quiz now"
            icon={BookOpen}
            onClick={() => navigate("/student/quizzes")}
            variant="default"
          />
          <ActionCard
            label="View History"
            description="Review your past attempts"
            icon={History}
            onClick={() => navigate("/student/history")}
          />
          <ActionCard
            label="Join Live Quiz"
            description="Enter a live session with a code"
            icon={Radio}
            onClick={() => navigate("/student/live")}
          />
        </div>
      </div>

      {/* Trophy card */}
      {stats.avgScore >= 70 && stats.attempts > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">Great performance!</p>
              <p className="text-sm text-muted-foreground">
                You're averaging {stats.avgScore}% — keep it up!
              </p>
            </div>
            <Button size="sm" className="ml-auto" onClick={() => navigate("/student/history")}>
              See Results
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

