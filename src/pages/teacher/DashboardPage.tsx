import { useEffect, useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../lib/api";
import { Card, CardContent } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";
import { BookOpen, Users, PlusCircle, ArrowRight, Zap } from "lucide-react";
import type { Quiz } from "../../types";

interface TeacherStats {
  quizzes: number;
  published: number;
  totalAttempts: number;
}

const StatCard = ({
  value,
  label,
  sub,
}: {
  value: string | number;
  label: string;
  sub?: string;
}) => (
  <Card className="card-lift relative overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    <CardContent className="p-5">
      <p className="font-display text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
);

export default function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeacherStats>({ quizzes: 0, published: 0, totalAttempts: 0 });

  useEffect(() => {
    api.get<Quiz[]>("/quizzes").then((quizzes) => {
      const published = quizzes.filter((q) => q.isPublished).length;
      const totalAttempts = quizzes.reduce((s, q) => s + (q._count?.attempts || 0), 0);
      setStats({ quizzes: quizzes.length, published, totalAttempts });
    }).catch(() => {});
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">
            Teacher Dashboard
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Welcome, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">Manage your quizzes and track student performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          value={stats.quizzes}
          label="Total Quizzes"
          sub={`${stats.published} published`}
        />
        <StatCard value={stats.published} label="Published" />
        <StatCard value={stats.totalAttempts} label="Total Attempts" />
      </div>

      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Quick Actions
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Create Quiz", desc: "Build a new quiz from scratch", icon: PlusCircle, path: "/teacher/create", primary: true },
            { label: "My Quizzes", desc: "Manage all your quizzes", icon: BookOpen, path: "/teacher/quizzes" },
            { label: "Analytics", desc: "Review student performance", icon: Users, path: "/teacher/analytics" },
          ].map(({ label, desc, icon: Icon, path, primary }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`group flex flex-col gap-3 rounded-xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${
                primary
                  ? "border-primary/30 bg-primary/10 hover:bg-primary/15 hover:border-primary/50"
                  : "border-border bg-card hover:border-border/80 hover:bg-accent/60"
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${primary ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className={`font-display font-semibold ${primary ? "text-primary" : "text-foreground"}`}>{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${primary ? "text-primary" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

