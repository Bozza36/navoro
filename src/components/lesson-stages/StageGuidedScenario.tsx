import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowUp, ArrowDown, Quote, ArrowRight } from "lucide-react";

type Option = { label: string; correct: boolean; feedback?: string };
type SingleBest = {
  id: string; kind: "single_best"; prompt: string; options: Option[];
  feedback_correct?: string;
};
type RankSteps = {
  id: string; kind: "rank_steps"; prompt: string;
  items: string[]; // already in correct order
  feedback_correct?: string; feedback_incorrect?: string;
};
type Classify = {
  id: string; kind: "classify"; prompt: string;
  categories: string[];
  items: { text: string; category: string }[];
  feedback?: string;
};
type FillBlank = {
  id: string; kind: "fill_blank"; prompt: string;
  answer: string; alternatives?: string[];
  feedback_correct?: string; feedback_incorrect?: string;
};
type Question = SingleBest | RankSteps | Classify | FillBlank;

interface Props {
  stage: {
    title: string;
    colleague?: { name: string; role: string };
    brief?: string[];
    pull_quote?: string;
    scenario?: string;
    questions: Question[];
    colleague_card?: string;
  };
  onComplete: (score: number) => void;
}

const shuffled = <T,>(a: T[]) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

const norm = (s: string) => s.trim().toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "");

const StageGuidedScenario = ({ stage, onComplete }: Props) => {
  const [phase, setPhase] = useState<"brief" | "questions" | "done">("brief");
  const [idx, setIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const total = stage.questions.length;
  const q = stage.questions[idx];

  const handleResult = (correct: boolean) => {
    setAttempts((a) => a + 1);
    if (!correct) setWrongCount((w) => w + 1);
    if (correct) {
      if (idx + 1 >= total) {
        const score = Math.max(40, Math.round(100 - wrongCount * 12));
        setPhase("done");
        onComplete(score);
      } else {
        setIdx((i) => i + 1);
      }
    }
  };

  if (phase === "brief") {
    return (
      <Card className="border-accent/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold">
              {stage.colleague?.name?.[0] ?? "•"}
            </div>
            <div>
              <CardTitle className="text-base">{stage.colleague?.name ?? "Briefing"}</CardTitle>
              <p className="text-xs text-muted-foreground">{stage.colleague?.role}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {stage.brief?.map((p, i) => (
            <p key={i} className="text-sm text-foreground leading-relaxed">{p}</p>
          ))}
          {stage.pull_quote && (
            <div className="border-l-4 border-accent pl-3 py-2 bg-accent/5 rounded-r">
              <Quote className="h-4 w-4 text-accent mb-1" />
              <p className="text-sm italic text-accent font-medium">{stage.pull_quote}</p>
            </div>
          )}
          {stage.scenario && (
            <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-3">
              <p className="text-xs uppercase tracking-wider text-secondary font-bold mb-1">Scenario</p>
              <p className="text-sm text-foreground">{stage.scenario}</p>
            </div>
          )}
          <Button onClick={() => setPhase("questions")} className="w-full">
            Begin questions <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "done") {
    return (
      <Card className="border-secondary/40">
        <CardContent className="py-6 text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-secondary mx-auto" />
          <p className="text-sm text-foreground font-medium">Briefing complete</p>
          {stage.colleague_card && (
            <p className="text-xs italic text-muted-foreground">"{stage.colleague_card}"</p>
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
          <Badge variant="outline" className="text-xs">Q {idx + 1} of {total}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {q.kind === "single_best" && <SingleBestUI key={q.id} q={q} onResult={handleResult} />}
        {q.kind === "rank_steps" && <RankStepsUI key={q.id} q={q} onResult={handleResult} />}
        {q.kind === "classify" && <ClassifyUI key={q.id} q={q} onResult={handleResult} />}
        {q.kind === "fill_blank" && <FillBlankUI key={q.id} q={q} onResult={handleResult} />}
      </CardContent>
    </Card>
  );
};

/* ---------- Single best ---------- */
const SingleBestUI = ({ q, onResult }: { q: SingleBest; onResult: (c: boolean) => void }) => {
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (picked === null) return;
    setSubmitted(true);
  };

  const advance = () => onResult(!!q.options[picked!]?.correct);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{q.prompt}</p>
      <div className="grid gap-2">
        {q.options.map((opt, i) => {
          const sel = picked === i;
          const showState = submitted && sel;
          return (
            <button
              key={i}
              disabled={submitted}
              onClick={() => setPicked(i)}
              className={`text-left rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                showState && opt.correct ? "border-secondary bg-secondary/10"
                : showState && !opt.correct ? "border-destructive bg-destructive/10"
                : sel ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {submitted && picked !== null && (
        <div className={`rounded-lg p-3 flex gap-2 items-start ${q.options[picked].correct ? "bg-secondary/10" : "bg-destructive/10"}`}>
          {q.options[picked].correct
            ? <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
            : <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
          <p className="text-sm">{q.options[picked].feedback ?? (q.options[picked].correct ? q.feedback_correct : "Not quite — try another option.")}</p>
        </div>
      )}
      {!submitted ? (
        <Button onClick={submit} disabled={picked === null} className="w-full">Submit answer</Button>
      ) : (
        <Button onClick={advance} className="w-full">
          {q.options[picked!].correct ? "Continue" : "Try again"}
        </Button>
      )}
    </div>
  );
};

/* ---------- Rank steps ---------- */
const RankStepsUI = ({ q, onResult }: { q: RankSteps; onResult: (c: boolean) => void }) => {
  const [order, setOrder] = useState<string[]>(() => shuffled(q.items));
  const [submitted, setSubmitted] = useState(false);
  const correct = useMemo(() => order.every((s, i) => s === q.items[i]), [order, q.items]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{q.prompt}</p>
      <ol className="space-y-2">
        {order.map((s, i) => (
          <li key={s} className={`flex items-center gap-2 rounded-lg border p-2 ${
            submitted ? (s === q.items[i] ? "border-secondary/50 bg-secondary/5" : "border-destructive/50 bg-destructive/5") : "border-border"
          }`}>
            <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
            <span className="text-sm flex-1">{s}</span>
            {!submitted && (
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, 1)} disabled={i === order.length - 1}>
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ol>
      {submitted && (
        <div className={`rounded-lg p-3 flex gap-2 items-start ${correct ? "bg-secondary/10" : "bg-destructive/10"}`}>
          {correct
            ? <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
            : <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
          <p className="text-sm">{correct ? q.feedback_correct : q.feedback_incorrect}</p>
        </div>
      )}
      {!submitted ? (
        <Button onClick={() => setSubmitted(true)} className="w-full">Submit order</Button>
      ) : (
        <Button onClick={() => { if (correct) onResult(true); else { setSubmitted(false); onResult(false); } }} className="w-full">
          {correct ? "Continue" : "Try again"}
        </Button>
      )}
    </div>
  );
};

/* ---------- Classify ---------- */
const ClassifyUI = ({ q, onResult }: { q: Classify; onResult: (c: boolean) => void }) => {
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const allPicked = q.items.every((_, i) => picks[i]);
  const allCorrect = q.items.every((it, i) => picks[i] === it.category);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{q.prompt}</p>
      <ul className="space-y-2">
        {q.items.map((it, i) => {
          const right = submitted && picks[i] === it.category;
          const wrong = submitted && picks[i] && picks[i] !== it.category;
          return (
            <li key={i} className={`grid grid-cols-[1fr_auto] gap-2 items-center rounded-lg border p-2 ${
              right ? "border-secondary/50 bg-secondary/5" : wrong ? "border-destructive/50 bg-destructive/5" : "border-border"
            }`}>
              <span className="text-sm">{it.text}</span>
              <Select value={picks[i] ?? ""} onValueChange={(v) => setPicks((p) => ({ ...p, [i]: v }))} disabled={submitted}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {q.categories.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
          );
        })}
      </ul>
      {submitted && (
        <div className={`rounded-lg p-3 flex gap-2 items-start ${allCorrect ? "bg-secondary/10" : "bg-destructive/10"}`}>
          {allCorrect
            ? <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
            : <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
          <p className="text-sm">{q.feedback}</p>
        </div>
      )}
      {!submitted ? (
        <Button onClick={() => setSubmitted(true)} disabled={!allPicked} className="w-full">Submit</Button>
      ) : (
        <Button onClick={() => { if (allCorrect) onResult(true); else { setSubmitted(false); onResult(false); } }} className="w-full">
          {allCorrect ? "Continue" : "Try again"}
        </Button>
      )}
    </div>
  );
};

/* ---------- Fill blank ---------- */
const FillBlankUI = ({ q, onResult }: { q: FillBlank; onResult: (c: boolean) => void }) => {
  const [val, setVal] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const accepted = [q.answer, ...(q.alternatives ?? [])].map(norm);
  const correct = accepted.includes(norm(val));

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{q.prompt}</p>
      <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Type your answer…" disabled={submitted} />
      {submitted && (
        <div className={`rounded-lg p-3 flex gap-2 items-start ${correct ? "bg-secondary/10" : "bg-destructive/10"}`}>
          {correct
            ? <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
            : <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
          <p className="text-sm">{correct ? q.feedback_correct : q.feedback_incorrect}</p>
        </div>
      )}
      {!submitted ? (
        <Button onClick={() => setSubmitted(true)} disabled={!val.trim()} className="w-full">Submit answer</Button>
      ) : (
        <Button onClick={() => { if (correct) onResult(true); else { setSubmitted(false); onResult(false); } }} className="w-full">
          {correct ? "Continue" : "Try again"}
        </Button>
      )}
    </div>
  );
};

export default StageGuidedScenario;
