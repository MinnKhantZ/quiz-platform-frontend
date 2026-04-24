// Domain types shared across the frontend

export type Role = "STUDENT" | "TEACHER";
export type TimerType = "NONE" | "PER_QUIZ" | "PER_QUESTION";
export type QuestionType = "MCQ" | "TRUE_FALSE" | "FILL_BLANK";
export type SessionStatus = "WAITING" | "IN_PROGRESS" | "FINISHED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
}

export interface QuizOption {
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl?: string | null;
  options?: QuizOption[] | null;
  correctAnswer?: string | null;
  points: number;
  order: number;
  quizId: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  isPublished: boolean;
  timerType: TimerType;
  timerSeconds?: number | null;
  teacherId: string;
  teacher?: { name: string };
  questions?: Question[];
  _count?: {
    questions: number;
    attempts: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Answer {
  id: string;
  questionId: string;
  isCorrect: boolean;
  points: number;
  selectedOption?: number | null;
  textAnswer?: string | null;
  question?: { text: string; points: number };
}

export interface Attempt {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  timeTaken: number;
  isLive?: boolean;
  liveSessionId?: string | null;
  completedAt?: string | null;
  startedAt: string;
  quiz?: { title: string; id: string };
  student?: { id: string; name: string };
  answers?: Answer[];
}

export interface LiveResult {
  studentId: string;
  studentName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  attemptId: string;
}

export interface LiveSession {
  id: string;
  quizId: string;
  teacherId: string;
  joinCode: string;
  status: SessionStatus;
  currentQuestion: number;
  quiz?: Quiz;
}

export interface LeaderboardEntry {
  rank: number;
  student: { id: string; name: string };
  score: number;
  totalPoints: number;
  percentage: number;
  timeTaken: number;
  completedAt?: string | null;
}

export interface QuestionStat {
  questionId: string;
  text: string;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface QuizAnalytics {
  totalAttempts: number;
  averageScore: number;
  averagePercentage: number;
  scoreDistribution: ScoreDistribution[];
  questionStats: QuestionStat[];
  recentAttempts: Attempt[];
}
