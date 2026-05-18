// src/components/lesson-stages/StageFormulaSandbox.tsx
// FORMAT 4 — Live Formula Sandbox.
// Generic: any formula, any variables, live result + sensitivity slider.
//
// Stage payload shape (stored as JSONB in lessons.content.stages[]):
// {
//   "type": "formula_sandbox",
//   "title": "Sample Size Calculation",
//   "instruction": "Calculate n for 95/95 reliability...",
//   "formula_latex": "n = \\frac{k^2 \\sigma^2}{\\delta^2}",
//   "variables": [
//     { "name": "k",     "label": "k (z-multiplier)", "units": "",  "default": 2.43 },
//     { "name": "sigma", "label": "Standard deviation σ", "units": "N", "default": 8 },
//     { "name": "delta", "label": "Acceptable error δ", "units": "N", "default": 5 }
//   ],
//   "compute": "Math.pow(k,2) * Math.pow(sigma,2) / Math.pow(delta,2)",
//   "result_label": "Required n",
//   "result_units": "specimens",
//   "expected_result": 16,
//   "tolerance": 0.5,
//   "round_up": true,
//   "what_this_means": "n=16 meets FDA 95/95 reliability...",
//   "sensitivity": {
//     "variable": "sigma",
//     "label": "Slide σ to see how variance drives n",
//     "min": 4, "max": 16, "step": 0.5
//   },
//   "colleague_card": { "name": "Tom Hargreaves", "quote": "...", "avatar": "TH" },
//   "xp": 200
// }

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { CheckCircle2, XCircle, Calculator, Lightbulb, Quote } from "lucide-react";

interface Variable {
  name: string;
  label: string;
  units?: string;
  default: number;
  min?: number;
  max?: number;
}

interface Sensitivity {
  variable: string;
  label: string;
  min: number;
  max: number;
  step?: number;
}

interface ColleagueCard {
  name: string;
  role?: string;
  avatar?: string;
  quote: string;
}

interface Props {
  stage: {
    title: string;
    instruction: string;
    formula_latex: string;
    variables: Variable[];
    compute: string;             // JS expression using variable names
    result_label: string;
    result_units?: string;
    expected_result: number;
    tolerance?: number;          // absolute tolerance in result units
    round_up?: boolean;
    what_this_means: string;
    sensitivity?: Sensitivity;
    colleague_card?: ColleagueCard;
    xp?: number;
  };
  onComplete: (score: number) => void;
}

// Safely evaluate the JS compute expression against a vars dict.
const evalCompute = (expr: string, vars: Record<string, number>) => {
  try {
    const names = Object.keys(vars);
    const values = names.map((n) => vars[n]);
    // eslint-disable-next-line no-new-func
    const fn = new Function(...names, `"use strict"; return (${expr});`);
    const v = fn(...values);
    if (!Number.isFinite(v)) return NaN;
    return v;
  } catch {
    return NaN;
  }
};

const StageFormulaSandbox = ({ stage, onComplete }: Props) => {
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(stage.variables.map((v) => [v.name, v.default])),
  );
  const [submitted, setSubmitted] = useState(false);
  const [sensitivityVal, setSensitivityVal] = useState<number>(() =>
    stage.sensitivity ? (vals[stage.sensitivity.variable] ?? stage.sensitivity.min) : 0,
  );

  // Live result from the live inputs
  const liveResult = useMemo(() => {
    const raw = evalCompute(stage.compute, vals);
    return stage.round_up ? Math.ceil(raw) : raw;
  }, [vals, stage.compute, stage.round_up]);

  // Sensitivity-curve result (varies one variable, holds the rest)
  const sensResult = useMemo(() => {
    if (!stage.sensitivity) return null;
    const adjusted = { ...vals, [stage.sensitivity.variable]: sensitivityVal };
    const raw = evalCompute(stage.compute, adjusted);
    return stage.round_up ? Math.ceil(raw) : raw;
  }, [vals, sensitivityVal, stage.compute, stage.round_up, stage.sensitivity]);

  const tol = stage.tolerance ?? 0.51;
  const correct = Math.abs(liveResult - stage.expected_result) <= tol;

  const handleVar = (name: string, v: string) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    setVals((p) => ({ ...p, [name]: n }));
    setSubmitted(false);
  };

  const submit = () => {
    setSubmitted(true);
    onComplete(correct ? 100 : 40);
  };

  return (
    <Card className="border-secondary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-secondary" />
          {stage.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{stage.instruction}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Formula */}
        <div className="rounded-lg border border-secondary/20 bg-muted/40 p-4">
          <BlockMath math={stage.formula_latex} />
        </div>

        {/* Variable inputs */}
        <div className="grid gap-3 sm:grid-cols-2">
          {stage.variables.map((v) => (
            <div key={v.name} className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                {v.label} {v.units && <span className="text-muted-foreground/70">({v.units})</span>}
              </label>
              <Input
                type="number"
                value={vals[v.name]}
                step="any"
                onChange={(e) => handleVar(v.name, e.target.value)}
                disabled={submitted && correct}
                className="font-mono"
              />
            </div>
          ))}
        </div>

        {/* Live result */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-accent uppercase tracking-wider">{stage.result_label}</p>
            <p className="text-3xl font-bold text-foreground font-mono">
              {Number.isFinite(liveResult) ? (Number.isInteger(liveResult) ? liveResult : liveResult.toFixed(2)) : "—"}
              {stage.result_units && <span className="text-base text-muted-foreground ml-2">{stage.result_units}</span>}
            </p>
          </div>
          {submitted && (
            correct
              ? <Badge className="bg-secondary text-secondary-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />Correct</Badge>
              : <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Recheck</Badge>
          )}
        </div>

        {/* What this means panel */}
        {submitted && correct && (
          <div className="rounded-lg border border-secondary/40 bg-secondary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-secondary" />
              <p className="text-sm font-bold text-secondary">What this means</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{stage.what_this_means}</p>
          </div>
        )}

        {/* Sensitivity slider */}
        {submitted && correct && stage.sensitivity && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium text-foreground mb-2">
              {stage.sensitivity.label}
            </p>
            <Slider
              min={stage.sensitivity.min}
              max={stage.sensitivity.max}
              step={stage.sensitivity.step ?? 0.1}
              value={[sensitivityVal]}
              onValueChange={(v) => setSensitivityVal(v[0])}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {stage.sensitivity.variable} = <span className="font-mono text-foreground">{sensitivityVal.toFixed(2)}</span>
              {"  →  "}
              {stage.result_label} ={" "}
              <span className="font-mono text-foreground">
                {sensResult !== null && Number.isFinite(sensResult) ? sensResult : "—"}
                {stage.result_units && ` ${stage.result_units}`}
              </span>
            </p>
          </div>
        )}

        {/* Colleague card */}
        {submitted && correct && stage.colleague_card && (
          <div className="rounded-lg border border-accent/30 bg-card/60 p-4 flex gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-background"
              style={{ background: "linear-gradient(135deg, #064635, #0a8a5f)" }}
            >
              {stage.colleague_card.avatar ?? stage.colleague_card.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">
                <Quote className="h-3 w-3 inline mr-1 text-accent" />
                {stage.colleague_card.name}{stage.colleague_card.role ? ` · ${stage.colleague_card.role}` : ""}
              </p>
              <p className="text-sm text-foreground italic mt-1">"{stage.colleague_card.quote}"</p>
            </div>
          </div>
        )}

        {/* Submit / retry buttons */}
        {!submitted && (
          <Button onClick={submit} className="w-full" size="lg">
            Submit calculation
          </Button>
        )}
        {submitted && !correct && (
          <Button onClick={() => setSubmitted(false)} variant="outline" className="w-full" size="lg">
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default StageFormulaSandbox;
