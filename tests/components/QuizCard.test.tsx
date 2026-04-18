import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { MemoryRouter } from "react-router-dom";
import QuizCard from "../../src/components/quiz/QuizCard";
import type { Quiz } from "../../src/types";

const mockQuiz: Quiz = {
  id: "quiz-1",
  title: "Math Chapter 1",
  description: "Basic arithmetic",
  isPublished: true,
  timerType: "PER_QUESTION",
  timerSeconds: 30,
  category: null,
  teacher: { id: "t1", name: "Mr. Smith", email: "t@test.com", role: "TEACHER" },
  _count: { questions: 5, attempts: 10 },
};

function renderCard(props: Partial<ComponentProps<typeof QuizCard>> = {}) {
  return render(
    <MemoryRouter>
      <QuizCard quiz={mockQuiz} {...props} />
    </MemoryRouter>
  );
}

describe("QuizCard", () => {
  it("renders quiz title", () => {
    renderCard();
    expect(screen.getByText("Math Chapter 1")).toBeInTheDocument();
  });

  it("renders quiz description", () => {
    renderCard();
    expect(screen.getByText("Basic arithmetic")).toBeInTheDocument();
  });

  it("shows question count", () => {
    renderCard();
    expect(screen.getByText(/5 questions/i)).toBeInTheDocument();
  });

  it("shows timer info when timerType is not NONE", () => {
    renderCard();
    expect(screen.getByText(/30s\/question/i)).toBeInTheDocument();
  });

  it("does not show Published badge for student view", () => {
    renderCard({ isTeacher: false });
    expect(screen.queryByText(/published|draft/i)).not.toBeInTheDocument();
  });

  it("shows Published badge for teacher view", () => {
    renderCard({ isTeacher: true });
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("shows Draft badge when quiz is unpublished (teacher view)", () => {
    renderCard({ isTeacher: true, quiz: { ...mockQuiz, isPublished: false } });
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });
});
