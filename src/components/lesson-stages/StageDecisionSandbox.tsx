import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, GitBranch } from "lucide-react";

interface NodeOption {
  label: string;
  outcome: "correct" | "wrong";
  consequence: string;
}
interface DecisionNode {
  id: string;
  prompt: string;
  options: NodeOption[];
}
interface Props {
  stage: {
    title: string;
    scenario: string;
    nodes: DecisionNode[];
    debrief?: { flow?: string[]; text?: string };
    colleague_card?: string;
  };
  onComplete: (score: number) => void;
}

const StageDecisionSandbox = ({ stage, onComplete }: Props) => {
  const [nodeIdx, setNodeIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [done, setDone] = useState(false);

  const node = stage.nodes[nodeIdx];
  const choice = picked !== null ? node.options[picked] : null;

  const advance = () => {
    if (!choice) return;
    if (choice.outcome === "correct") {
      if (nodeIdx + 1 >= stage.nodes.length) {
        setDone(true);
        const score = Math.max(40, 100 - wrongAttempts * 15);
        onComplete(score);
      } else {
        setNodeIdx((i) => i + 1);
        setPicked(null);
      }
    } else {
      setWrongAttempts((w) => w + 1);
      setPicked(null);
    }
  };

  if (done) {
    return (
      <Card className="border-secondary/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-secondary" /> Debrief — Optimal Path
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stage.debrief?.flow && (
            <ol className="space-y-1.5">
              {stage.debrief.flow.map((s, i) => (
                <li key={i} className="flex gap-2 items-start text-sm">
                  <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                  <span className="text-foreground">{s}</span>
                </li>
              ))}
            </ol>
          )}
          {stage.debrief?.text && (
            <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-secondary/40 pl-3">
              {stage.debrief.text}
            </p>
          )}
          {stage.colleague_card && (
            <p className="text-xs italic text-accent">"{stage.colleague_card}"</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{stage.title}</CardTitle>
          <Badge variant="outline" className="text-xs">Decision {nodeIdx + 1} of {stage.nodes.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {nodeIdx === 0 && (
          <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-3">
            <p className="text-xs uppercase tracking-wider text-secondary font-bold mb-1">Scenario</p>
            <p className="text-sm text-foreground">{stage.scenario}</p>
          </div>
        )}
        <p className="text-sm font-medium text-foreground">{node.prompt}</p>
        <div className="grid gap-2">
          {node.options.map((opt, i) => {
            const sel = picked === i;
            return (
              <button
                key={i}
                disabled={!!choice}
                onClick={() => setPicked(i)}
                className={`text-left rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                  sel ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {choice && (
          <div className={`rounded-lg p-3 flex gap-2 items-start ${
            choice.outcome === "correct" ? "bg-secondary/10" : "bg-destructive/10"
          }`}>
            {choice.outcome === "correct"
              ? <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
              : <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
            <p className="text-sm">{choice.consequence}</p>
          </div>
        )}

        {choice && (
          <Button onClick={advance} className="w-full">
            {choice.outcome === "correct"
              ? <>Continue <ArrowRight className="h-4 w-4 ml-1" /></>
              : <>Try again from this node <RotateCcw className="h-4 w-4 ml-1" /></>}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default StageDecisionSandbox;
