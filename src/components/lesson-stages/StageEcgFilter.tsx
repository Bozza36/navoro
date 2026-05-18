import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  stage: {
    title: string;
    instruction: string;
    formula: string;
    optimal_fc: number;
    tolerance: number;
    feedback_pass: string;
    feedback_fail: string;
  };
  onComplete: (score: number) => void;
}

// Generate raw ECG with respiratory drift + R waves
const generateRawEcg = (n: number) => {
  const arr = [];
  for (let i = 0; i < n; i++) {
    const t = i / 20; // seconds, 20 samples/sec
    const drift = 0.6 * Math.sin(2 * Math.PI * 0.3 * t); // 0.3 Hz respiratory drift
    // R-waves every ~0.8s (75bpm)
    const phase = (t % 0.8) / 0.8;
    let r = 0;
    if (phase > 0.45 && phase < 0.55) r = Math.exp(-Math.pow((phase - 0.5) * 60, 2)) * 1.2;
    if (phase > 0.55 && phase < 0.62) r -= Math.exp(-Math.pow((phase - 0.58) * 80, 2)) * 0.4;
    arr.push({ t: Number(t.toFixed(2)), raw: drift + r });
  }
  return arr;
};

// Apply simple high-pass filter: y[n] = a*(y[n-1] + x[n] - x[n-1]); a = RC/(RC+dt); fc = 1/(2πRC)
const applyHighPass = (data: { t: number; raw: number }[], fc: number) => {
  const dt = 0.05;
  const RC = 1 / (2 * Math.PI * Math.max(fc, 0.001));
  const a = RC / (RC + dt);
  let yPrev = 0;
  let xPrev = data[0].raw;
  return data.map((d) => {
    const y = a * (yPrev + d.raw - xPrev);
    yPrev = y;
    xPrev = d.raw;
    return { t: d.t, filtered: Number(y.toFixed(3)) };
  });
};

const StageEcgFilter = ({ stage, onComplete }: Props) => {
  const [fc, setFc] = useState(0.05);
  const [submitted, setSubmitted] = useState(false);

  const raw = useMemo(() => generateRawEcg(120), []);
  const filtered = useMemo(() => applyHighPass(raw, fc), [raw, fc]);
  const merged = raw.map((r, i) => ({ t: r.t, raw: Number(r.raw.toFixed(3)), filtered: filtered[i].filtered }));

  const dist = Math.abs(fc - stage.optimal_fc);
  const passes = dist <= stage.tolerance;
  const score = Math.max(20, Math.round(100 * (1 - dist / 5)));

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete(score);
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

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={merged}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" label={{ value: "Time (s)", position: "insideBottom", offset: -5, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Line type="monotone" dataKey="raw" stroke="hsl(var(--muted-foreground))" strokeWidth={1} dot={false} name="Raw" />
              <Line type="monotone" dataKey="filtered" stroke="#B7E4C7" strokeWidth={2} dot={false} name="Filtered" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cutoff Frequency f_c</span>
            <span className="font-bold text-accent tabular-nums">{fc.toFixed(2)} Hz</span>
          </div>
          <Slider min={0.05} max={5} step={0.05} value={[fc]} onValueChange={([v]) => setFc(v)} disabled={submitted} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Drift remains</span>
            <span>R-wave clipped</span>
          </div>
        </div>

        {submitted && (
          <div className={`flex gap-2 items-start rounded-lg p-3 ${passes ? "bg-secondary/10" : "bg-destructive/10"}`}>
            {passes ? <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive mt-0.5" />}
            <p className="text-sm">{passes ? stage.feedback_pass : stage.feedback_fail}</p>
          </div>
        )}

        {!submitted && <Button onClick={handleSubmit} className="w-full">Lock Filter Setting</Button>}
      </CardContent>
    </Card>
  );
};

export default StageEcgFilter;
