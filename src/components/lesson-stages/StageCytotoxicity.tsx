import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  stage: {
    title: string;
    instruction: string;
    formula: string;
    safe_threshold: number;
    target_concentration: number;
    feedback_pass: string;
    feedback_fail: string;
  };
  onComplete: (score: number) => void;
}

// Sigmoid viability curve: viability = 100 / (1 + (c/k)^n)
const calcViability = (c: number, k: number) => 100 / (1 + Math.pow(c / k, 2.5));

const StageCytotoxicity = ({ stage, onComplete }: Props) => {
  const [concentration, setConcentration] = useState(20);
  const [submitted, setSubmitted] = useState(false);

  // User effectively chooses material formulation via concentration slider — k is fixed material property
  const k = 35; // material toxicity midpoint

  const data = useMemo(
    () => Array.from({ length: 21 }, (_, i) => {
      const c = i * 5;
      return { concentration: c, viability: Number(calcViability(c, k).toFixed(1)) };
    }),
    [],
  );

  const currentViability = calcViability(concentration, k);
  const passes = currentViability >= stage.safe_threshold && concentration >= stage.target_concentration - 10;

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete(passes ? 100 : 50);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{stage.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{stage.instruction}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-3 text-foreground">
          <BlockMath math={stage.formula} />
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="concentration" stroke="hsl(var(--muted-foreground))" label={{ value: "Concentration (%)", position: "insideBottom", offset: -5, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: "Viability (%)", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <ReferenceArea y1={stage.safe_threshold} y2={100} fill="#B7E4C7" fillOpacity={0.15} />
              <ReferenceLine y={stage.safe_threshold} stroke="#B7E4C7" strokeDasharray="4 4" label={{ value: "Safe Zone", fill: "#B7E4C7", fontSize: 11 }} />
              <ReferenceLine x={concentration} stroke="hsl(var(--accent))" strokeWidth={2} />
              <Line type="monotone" dataKey="viability" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Leachate Concentration</span>
            <span className="font-bold text-accent tabular-nums">{concentration}%</span>
          </div>
          <Slider min={0} max={100} step={1} value={[concentration]} onValueChange={([v]) => setConcentration(v)} disabled={submitted} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Current viability: <span className="font-bold text-foreground">{currentViability.toFixed(1)}%</span></span>
            <span>Threshold: {stage.safe_threshold}%</span>
          </div>
        </div>

        {submitted && (
          <div className={`flex gap-2 items-start rounded-lg p-3 ${passes ? "bg-secondary/10" : "bg-destructive/10"}`}>
            {passes ? <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive mt-0.5" />}
            <p className="text-sm">{passes ? stage.feedback_pass : stage.feedback_fail}</p>
          </div>
        )}

        {!submitted && (
          <Button onClick={handleSubmit} className="w-full">Validate Concentration</Button>
        )}
      </CardContent>
    </Card>
  );
};

export default StageCytotoxicity;
