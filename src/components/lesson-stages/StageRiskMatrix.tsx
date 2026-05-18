import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertTriangle, Activity } from "lucide-react";

interface Hazard {
  id: string;
  text: string;
  correct_p: number;
  correct_s: number;
  control_keywords: string[];
  feedback?: { p_too_high?: string; p_too_low?: string };
}
interface Sensitivity {
  hazard_id: string;
  prompt: string;
  new_p: number;
  explanation: string;
}
interface Props {
  stage: {
    title: string;
    intro: string;
    formula?: string;
    hazards: Hazard[];
    sensitivity?: Sensitivity;
    colleague_card?: string;
  };
  onComplete: (score: number) => void;
}

const zoneFor = (rpn: number) =>
  rpn >= 12 ? { label: "Intolerable", cls: "bg-destructive/80 text-destructive-foreground", cell: "bg-destructive/70" }
  : rpn >= 5 ? { label: "ALARP", cls: "bg-accent text-background", cell: "bg-accent/70" }
  : { label: "Acceptable", cls: "bg-secondary text-secondary-foreground", cell: "bg-secondary/70" };

const Matrix = ({ p, s }: { p: number; s: number }) => (
  <div className="inline-grid grid-cols-6 gap-0.5 text-[10px]">
    <div />
    {[1, 2, 3, 4, 5].map((sv) => <div key={sv} className="text-center text-muted-foreground">S{sv}</div>)}
    {[5, 4, 3, 2, 1].map((pv) => (
      <>
        <div key={`l-${pv}`} className="text-muted-foreground text-right pr-1">P{pv}</div>
        {[1, 2, 3, 4, 5].map((sv) => {
          const rpn = pv * sv;
          const z = zoneFor(rpn);
          const sel = pv === p && sv === s;
          return (
            <div key={`${pv}-${sv}`} className={`h-7 w-7 flex items-center justify-center font-medium ${z.cell} ${sel ? "ring-2 ring-foreground" : "opacity-60"}`}>
              {rpn}
            </div>
          );
        })}
      </>
    ))}
  </div>
);

const StageRiskMatrix = ({ stage, onComplete }: Props) => {
  const [entries, setEntries] = useState<Record<string, { p: number; s: number; control: string }>>(
    () => Object.fromEntries(stage.hazards.map((h) => [h.id, { p: 3, s: 3, control: "" }]))
  );
  const [submitted, setSubmitted] = useState(false);
  const [sensP, setSensP] = useState<number>(stage.sensitivity?.new_p ?? 1);

  const ratings = useMemo(() => stage.hazards.map((h) => {
    const e = entries[h.id];
    const pOk = e.p === h.correct_p;
    const sOk = e.s === h.correct_s;
    const matched = h.control_keywords.filter((k) => e.control.toLowerCase().includes(k.toLowerCase())).length;
    const controlOk = e.control.trim().length >= 40 && matched >= Math.ceil(h.control_keywords.length / 2);
    const allOk = pOk && sOk && controlOk;
    return { id: h.id, pOk, sOk, controlOk, allOk, matched, total: h.control_keywords.length };
  }), [entries, stage.hazards]);

  const allFilled = stage.hazards.every((h) => entries[h.id].control.trim().length >= 40);

  const submit = () => {
    setSubmitted(true);
    const ok = ratings.filter((r) => r.allOk).length;
    onComplete(Math.round((ok / ratings.length) * 100));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" /> {stage.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">{stage.intro}</p>
        {stage.formula && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 inline-block">
            <code className="text-sm text-accent font-bold">{stage.formula}</code>
          </div>
        )}

        {stage.hazards.map((h, i) => {
          const e = entries[h.id];
          const r = ratings[i];
          const rpn = e.p * e.s;
          const z = zoneFor(rpn);
          return (
            <div key={h.id} className="rounded-lg border border-border p-3 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Hazard {i + 1}</p>
                <p className="text-sm text-foreground italic">"{h.text}"</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-24">Probability</label>
                    <Select value={String(e.p)} onValueChange={(v) => setEntries((p) => ({ ...p, [h.id]: { ...p[h.id], p: Number(v) } }))} disabled={submitted}>
                      <SelectTrigger className="h-8 w-20 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-24">Severity</label>
                    <Select value={String(e.s)} onValueChange={(v) => setEntries((p) => ({ ...p, [h.id]: { ...p[h.id], s: Number(v) } }))} disabled={submitted}>
                      <SelectTrigger className="h-8 w-20 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24">RPN</span>
                    <Badge className={z.cls}>{rpn} · {z.label}</Badge>
                  </div>
                </div>
                <div className="overflow-x-auto"><Matrix p={e.p} s={e.s} /></div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Risk control — include: <span className="text-foreground">{h.control_keywords.join(", ")}</span>
                </label>
                <Textarea
                  rows={2}
                  value={e.control}
                  onChange={(ev) => setEntries((p) => ({ ...p, [h.id]: { ...p[h.id], control: ev.target.value } }))}
                  disabled={submitted}
                  placeholder="Describe the engineering or procedural control…"
                />
              </div>
              {submitted && (
                <div className={`rounded-lg p-2 text-xs flex gap-2 items-start ${r.allOk ? "bg-secondary/10" : "bg-destructive/10"}`}>
                  {r.allOk ? <CheckCircle2 className="h-3.5 w-3.5 text-secondary mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />}
                  <span className="text-muted-foreground">
                    P {r.pOk ? "✓" : `✗ (correct ${h.correct_p})`} · S {r.sOk ? "✓" : `✗ (correct ${h.correct_s})`} · Control keywords {r.matched}/{r.total}
                    {!r.pOk && e.p > h.correct_p && h.feedback?.p_too_high && <span className="block mt-1">{h.feedback.p_too_high}</span>}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {!submitted ? (
          <Button onClick={submit} disabled={!allFilled} className="w-full">Submit risk matrix</Button>
        ) : stage.sensitivity ? (
          <div className="rounded-lg border border-accent/40 bg-accent/5 p-3 space-y-3">
            <p className="text-sm font-medium text-foreground">{stage.sensitivity.prompt}</p>
            {(() => {
              const target = stage.hazards.find((h) => h.id === stage.sensitivity!.hazard_id)!;
              const newRpn = sensP * target.correct_s;
              const z = zoneFor(newRpn);
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12">P = {sensP}</span>
                    <Slider value={[sensP]} min={1} max={5} step={1} onValueChange={(v) => setSensP(v[0])} className="flex-1" />
                    <Badge className={z.cls}>RPN {newRpn} · {z.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{stage.sensitivity!.explanation}</p>
                </div>
              );
            })()}
            {stage.colleague_card && (
              <p className="text-xs italic text-accent border-t border-accent/20 pt-2">"{stage.colleague_card}"</p>
            )}
          </div>
        ) : (
          stage.colleague_card && <p className="text-xs italic text-accent">"{stage.colleague_card}"</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StageRiskMatrix;
