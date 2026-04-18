import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import OptionButton from "./OptionButton";
import type { Question } from "../../types";

interface AnswerPayload {
  questionId: string;
  selectedOption?: number | null;
  textAnswer?: string;
}

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  onAnswer: (payload: AnswerPayload) => void;
  showResult?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
}

export default function QuestionCard({
  question,
  index,
  total,
  onAnswer,
  showResult = false,
  isCorrect = false,
  disabled = false,
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");

  const handleSubmit = () => {
    if (question.type === "FILL_BLANK") {
      onAnswer({ questionId: question.id, textAnswer });
    } else {
      onAnswer({ questionId: question.id, selectedOption });
    }
  };

  const typeLabel: Record<string, string> = {
    MCQ: "Multiple Choice",
    TRUE_FALSE: "True / False",
    FILL_BLANK: "Fill in the Blank",
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">{typeLabel[question.type]}</Badge>
          <span className="text-sm text-muted-foreground">
            {index + 1} / {total}
          </span>
        </div>
        <CardTitle className="text-lg mt-2">{question.text}</CardTitle>
        {question.imageUrl && (
          <img src={question.imageUrl} alt="Question" className="mt-3 rounded-lg max-h-64 object-contain" />
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {(question.type === "MCQ" || question.type === "TRUE_FALSE") && (
          <div className="space-y-2">
            {question.options?.map((opt, i) => (
              <OptionButton
                key={i}
                text={opt.text}
                index={i}
                selected={selectedOption === i}
                correct={showResult && (opt.isCorrect ?? false)}
                wrong={showResult && selectedOption === i && !(opt.isCorrect ?? false)}
                disabled={disabled || showResult}
                onClick={setSelectedOption}
              />
            ))}
          </div>
        )}

        {question.type === "FILL_BLANK" && (
          <Input
            placeholder="Type your answer..."
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={disabled || showResult}
            className="text-base"
          />
        )}

        {!showResult && (
          <Button
            onClick={handleSubmit}
            disabled={
              disabled ||
              (question.type === "FILL_BLANK" ? !textAnswer.trim() : selectedOption === null)
            }
            className="w-full mt-4"
          >
            Submit Answer
          </Button>
        )}

        {showResult && (
          <div
            className={`mt-4 rounded-lg p-3 text-center font-medium ${
              isCorrect
                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {isCorrect ? "Correct!" : "Incorrect"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
