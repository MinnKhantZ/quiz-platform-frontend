import { useEffect, useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookOpen, Trophy, History, Radio } from "lucide-react";
import type { Quiz, Attempt } from "../../types";

interface DashboardStats {
  quizzes: number;
  attempts: number;
  avgScore: number;
}

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
      const avg = completed.length > 0 ? completed.reduce((s, a) => s + a.percentage, 0) / completed.length : 0;
      setStats({ quizzes: quizzes.length, attempts: completed.length, avgScore: Math.round(avg) });
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
        <p className="text-muted-foreground">Ready to test your knowledge?</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Quizzes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.quizzes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.attempts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.avgScore}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button className="h-24 text-lg" onClick={() => navigate("/student/quizzes")}>
          <BookOpen className="mr-2 h-5 w-5" /> Browse Quizzes
        </Button>
        <Button variant="outline" className="h-24 text-lg" onClick={() => navigate("/student/history")}>
          <History className="mr-2 h-5 w-5" /> View History
        </Button>
        <Button variant="outline" className="h-24 text-lg" onClick={() => navigate("/student/live")}>
          <Radio className="mr-2 h-5 w-5" /> Join Live Quiz
        </Button>
      </div>
    </div>
  );
}
