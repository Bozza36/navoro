import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

interface Option { value: string; label: string; correct: boolean }
interface Question { id: string; label: string; options: Option[] }
interface Props {
  stage: {
    title: string;
    instruction: string;
    questions: Question[];
    feedback_correct: string;
    feedback_incorrect: string;
  };
  onComplete: (score: number) => void;
}

const StageDecisionTree = ({ stage, onComplete }: Props) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = stage.questions.every((q) => answers[q.id]);
  const allCorrect = stage.questions.every((q) =>
    q.options.find((o) => o.value === answers[q.id])?.correct,
  );

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete(allCorrect ? 100 : 40);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{stage.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{stage.instruction}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {stage.questions.map((q) => (
          <div key={q.id}>
            <p className="text-sm font-medium mb-2 text-foreground">{q.label}</p>
            <div className="grid gap-2">
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt.value;
                const showResult = submitted && selected;
                return (
                  <button
                    key={opt.value}
                    disabled={submitted}
                    onClick={() => setAnswers((p) => ({ ...p, [q.id]: opt.value }))}
                    className={`text-left rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                      showResult && opt.correct
                        ? "border-secondary bg-secondary/10"
                        : showResult && !opt.correct
                          ? "border-destructive bg-destructive/10"
                          : selected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {submitted && (
          <div className={`flex gap-2 items-start rounded-lg p-3 ${allCorrect ? "bg-secondary/10" : "bg-destructive/10"}`}>
            {allCorrect ? <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive mt-0.5" />}
            <p className="text-sm">{allCorrect ? stage.feedback_correct : stage.feedback_incorrect}</p>
          </div>
        )}

        {!submitted && (
          <Button onClick={handleSubmit} disabled={!allAnswered} className="w-full">
            Confirm Classification
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default StageDecisionTree;
