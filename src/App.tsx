import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import { setUnauthorizedHandler } from "./lib/api";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ErrorBoundary from "./components/common/ErrorBoundary";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import StudentDashboard from "./pages/student/DashboardPage";
import QuizListPage from "./pages/student/QuizListPage";
import QuizTakePage from "./pages/student/QuizTakePage";
import ResultsPage from "./pages/student/ResultsPage";
import HistoryPage from "./pages/student/HistoryPage";
import LeaderboardPage from "./pages/student/LeaderboardPage";
import StudentLivePage from "./pages/student/LivePage";

import TeacherDashboard from "./pages/teacher/DashboardPage";
import QuizManagePage from "./pages/teacher/QuizManagePage";
import QuizCreatePage from "./pages/teacher/QuizCreatePage";
import QuizEditPage from "./pages/teacher/QuizEditPage";
import AnalyticsPage from "./pages/teacher/AnalyticsPage";
import TeacherLivePage from "./pages/teacher/LiveSessionPage";

import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      useAuthStore.getState().logout();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <ErrorBoundary>
      <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />

      {/* Root redirect based on role */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : user.role === "TEACHER" ? (
            <Navigate to="/teacher" replace />
          ) : (
            <Navigate to="/student" replace />
          )
        }
      />

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <Layout><StudentDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quizzes"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <Layout><QuizListPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quizzes/:id"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <Layout><QuizTakePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quizzes/:quizId/leaderboard"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <Layout><LeaderboardPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/results/:id"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <Layout><ResultsPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/history"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <Layout><HistoryPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/live"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <Layout><StudentLivePage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Teacher routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <Layout><TeacherDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/quizzes"
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <Layout><QuizManagePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/create"
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <Layout><QuizCreatePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/quizzes/:id"
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <Layout><QuizEditPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/quizzes/:id/analytics"
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <Layout><AnalyticsPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/analytics"
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <Layout><AnalyticsPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/live"
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <Layout><TeacherLivePage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
