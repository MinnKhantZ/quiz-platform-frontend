import { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import OptionButton from "./OptionButton";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Question } from "../../types";
import { cn } from "../../lib/utils";

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
    <Card className="w-full max-w-2xl mx-auto border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary">{typeLabel[question.type]}</Badge>
          <span className="font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {index + 1} <span className="text-border">/ {total}</span>
          </span>
        </div>
        <p className="text-lg font-display font-semibold text-foreground leading-snug">
          {question.text}
        </p>
        {question.imageUrl && (
          <img
            src={question.imageUrl}
            alt="Question illustration"
            className="mt-3 rounded-xl max-h-56 object-contain border border-border"
          />
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {(question.type === "MCQ" || question.type === "TRUE_FALSE") && (
          <div className="space-y-2">
            {question.options?.map((opt, i) => (
              <OptionButton
                key={i}
                text={opt.text}
                index={i}
                selected={selectedOption === i}
                correct={showResult && ((opt.isCorrect ?? false) || (isCorrect && selectedOption === i))}
                wrong={showResult && selectedOption === i && !(opt.isCorrect ?? false) && !isCorrect}
                disabled={disabled || showResult}
                onClick={setSelectedOption}
              />
            ))}
          </div>
        )}

        {question.type === "FILL_BLANK" && (
          <Input
            placeholder="Type your answer…"
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
            className="w-full mt-2"
            size="lg"
          >
            Submit Answer
          </Button>
        )}

        {showResult && (
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-xl border p-3.5",
              isCorrect
                ? "border-success/30 bg-success/10 text-success"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            {isCorrect ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0" />
            )}
            <span className="font-display font-semibold">
              {isCorrect ? "Correct!" : "Incorrect"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

