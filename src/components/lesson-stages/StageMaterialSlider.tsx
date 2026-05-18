import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { CheckCircle2, XCircle } from "lucide-react";

interface Material { name: string; modulus_gpa: number; yield_mpa: number; bone_modulus_gpa: number }
interface Props {
  stage: {
    title: string;
    instruction: string;
    formula: string;
    materials: Material[];
    applied_load_n: number;
    cross_section_mm2: number;
    fos_threshold: number;
    feedback: string;
  };
  onComplete: (score: number) => void;
}

const StageMaterialSlider = ({ stage, onComplete }: Props) => {
  // Slider 0-100: 0 = pure PEEK, 100 = pure Titanium
  const [blend, setBlend] = useState(50);
  const [submitted, setSubmitted] = useState(false);

  const peek = stage.materials.find((m) => m.name === "PEEK")!;
  const ti = stage.materials.find((m) => m.name === "Titanium Grade 5")!;
  const bone = ti.bone_modulus_gpa;

  const t = blend / 100;
  const modulus = peek.modulus_gpa + t * (ti.modulus_gpa - peek.modulus_gpa);
  const yieldStr = peek.yield_mpa + t * (ti.yield_mpa - peek.yield_mpa);
  const stressApplied = stage.applied_load_n / stage.cross_section_mm2; // MPa
  const fos = yieldStr / stressApplied;
  const stressShielding = Math.abs(modulus - bone) / bone; // ratio (lower better)

  const passesFos = fos >= stage.fos_threshold;
  const lowShielding = stressShielding < 2.0;
  const score = Math.round(
    50 * (passesFos ? 1 : Math.min(1, fos / stage.fos_threshold)) +
    50 * (1 - Math.min(1, stressShielding / 6)),
  );

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

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">PEEK ←→ Titanium Blend</span>
            <span className="font-bold text-accent tabular-nums">{blend}% Ti</span>
          </div>
          <Slider min={0} max={100} step={1} value={[blend]} onValueChange={([v]) => setBlend(v)} disabled={submitted} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Modulus E</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{modulus.toFixed(1)} GPa</p>
            <p className="text-xs text-muted-foreground mt-1">Bone: {bone} GPa</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Factor of Safety</p>
            <p className={`text-lg font-bold tabular-nums ${passesFos ? "text-secondary" : "text-destructive"}`}>{fos.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Min: {stage.fos_threshold}</p>
          </div>
          <div className="rounded-lg border border-border p-3 col-span-2">
            <p className="text-xs text-muted-foreground">Stress Shielding Ratio</p>
            <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(100, (stressShielding / 6) * 100)}%`,
                  background: lowShielding ? "#B7E4C7" : "hsl(var(--destructive))",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stressShielding.toFixed(2)}× — {lowShielding ? "Acceptable" : "High shielding risk"}</p>
          </div>
        </div>

        {submitted && (
          <div className={`flex gap-2 items-start rounded-lg p-3 ${score >= 70 ? "bg-secondary/10" : "bg-destructive/10"}`}>
            {score >= 70 ? <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive mt-0.5" />}
            <p className="text-sm">{stage.feedback}</p>
          </div>
        )}

        {!submitted && <Button onClick={handleSubmit} className="w-full">Submit Material Selection</Button>}
      </CardContent>
    </Card>
  );
};

export default StageMaterialSlider;
