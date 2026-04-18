import { useEffect, useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookOpen, Users, PlusCircle } from "lucide-react";
import type { Quiz } from "../../types";

interface TeacherStats {
  quizzes: number;
  published: number;
  totalAttempts: number;
}

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
        <p className="text-muted-foreground">Manage your quizzes and track student performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.quizzes}</p>
            <p className="text-xs text-muted-foreground">{stats.published} published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalAttempts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <PlusCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button size="sm" className="w-full" onClick={() => navigate("/teacher/create")}>
              Create Quiz
            </Button>
            <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/teacher/analytics")}>
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
