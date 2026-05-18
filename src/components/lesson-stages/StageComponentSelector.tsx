import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

interface Option { value: string; label: string; correct: boolean; feedback: string }
interface Props {
  stage: { title: string; instruction: string; options: Option[] };
  onComplete: (score: number) => void;
}

const StageComponentSelector = ({ stage, onComplete }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const chosen = stage.options.find((o) => o.value === selected);

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete(chosen?.correct ? 100 : 40);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{stage.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{stage.instruction}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {stage.options.map((opt) => {
          const isSelected = selected === opt.value;
          const showResult = submitted && isSelected;
          return (
            <button
              key={opt.value}
              disabled={submitted}
              onClick={() => setSelected(opt.value)}
              className={`w-full text-left rounded-lg border-2 p-3 transition-all ${
                showResult && opt.correct
                  ? "border-secondary bg-secondary/10"
                  : showResult && !opt.correct
                    ? "border-destructive bg-destructive/10"
                    : isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
              }`}
            >
              <p className="text-sm font-medium text-foreground">{opt.label}</p>
              {submitted && isSelected && <p className="text-xs text-muted-foreground mt-1">{opt.feedback}</p>}
            </button>
          );
        })}
        {!submitted && <Button onClick={handleSubmit} disabled={!selected} className="w-full">Select Component</Button>}
      </CardContent>
    </Card>
  );
};

export default StageComponentSelector;
