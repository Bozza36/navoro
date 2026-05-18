import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  stage: {
    title: string;
    instruction: string;
    battery_mah: number;
    base_draw_ma: number;
    per_hz_ma: number;
    min_sample_rate: number;
    min_days: number;
    feedback_pass: string;
    feedback_fail: string;
  };
  onComplete: (score: number) => void;
}

const StagePowerAllocation = ({ stage, onComplete }: Props) => {
  const [sampleRate, setSampleRate] = useState(250);
  const [submitted, setSubmitted] = useState(false);

  const drawMa = stage.base_draw_ma + sampleRate * stage.per_hz_ma;
  const lifeHours = stage.battery_mah / drawMa;
  const lifeDays = lifeHours / 24;

  const meetsRate = sampleRate >= stage.min_sample_rate;
  const meetsLife = lifeDays >= stage.min_days;
  const passes = meetsRate && meetsLife;
  const score = passes ? 100 : meetsRate || meetsLife ? 60 : 30;

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
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sampling Rate</span>
            <span className="font-bold text-accent tabular-nums">{sampleRate} Hz</span>
          </div>
          <Slider min={50} max={1000} step={10} value={[sampleRate]} onValueChange={([v]) => setSampleRate(v)} disabled={submitted} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Current Draw</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{drawMa.toFixed(2)} mA</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Battery Life</p>
            <p className={`text-lg font-bold tabular-nums ${meetsLife ? "text-secondary" : "text-destructive"}`}>{lifeDays.toFixed(1)} days</p>
            <p className="text-xs text-muted-foreground mt-1">Target: {stage.min_days}d</p>
          </div>
          <div className="rounded-lg border border-border p-3 col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Sampling vs minimum</p>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{ width: `${Math.min(100, (sampleRate / stage.min_sample_rate) * 50)}%`, background: meetsRate ? "#B7E4C7" : "hsl(var(--destructive))" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{meetsRate ? "Arrhythmia detection viable" : `Below ${stage.min_sample_rate} Hz minimum`}</p>
          </div>
        </div>

        {submitted && (
          <div className={`flex gap-2 items-start rounded-lg p-3 ${passes ? "bg-secondary/10" : "bg-destructive/10"}`}>
            {passes ? <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive mt-0.5" />}
            <p className="text-sm">{passes ? stage.feedback_pass : stage.feedback_fail}</p>
          </div>
        )}

        {!submitted && <Button onClick={handleSubmit} className="w-full">Submit Power Budget</Button>}
      </CardContent>
    </Card>
  );
};

export default StagePowerAllocation;
