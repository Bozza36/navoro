// src/components/lesson-stages/StageDocumentBuilder.tsx
// FORMAT 2 — Document Builder.
// Left panel: reference material (SOP, standard clause, template guide).
// Right panel: fillable fields with placeholders + live per-field validation.
// On submit: field-by-field scoring panel, pass = >=80% adequate or better.
// Passing docs persist to dhf_documents so the user can download their DHF.
//
// Stage payload (lessons.content.stages[]):
// {
//   "type": "document_builder",
//   "title": "Write a Verification Protocol",
//   "instruction": "Complete each field of VP-012...",
//   "reference": {
//     "title": "Template — Verification Protocol",
//     "body": "1. Purpose...\n2. Scope...\n3. Sample size justification...",
//     "highlights": ["ISO 14971 §7.1", "21 CFR 820.30(f)"]
//   },
//   "fields": [
//     {
//       "id": "purpose",
//       "label": "Purpose",
//       "placeholder": "Verify CardioSense Pro housing meets ISO 5841 drop test...",
//       "required_terms": ["ISO 5841", "drop", "housing"],
//       "min_chars": 60
//     },
//     ...
//   ],
//   "dhf": {                       // optional — when present, the completed doc saves to DHF
//     "doc_code": "VP-012",
//     "doc_title": "Verification Protocol — Housing Drop Test",
//     "doc_section": "Design Verification"
//   },
//   "colleague_card": { "name": "Tom Hargreaves", "quote": "...", "avatar": "TH" },
//   "xp": 250
// }

import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, FileText, CheckCircle2, AlertTriangle, Quote, Save, Download,
} from "lucide-react";
import { downloadSingleDhfPdf } from "@/lib/dhfPdf";

interface DocField {
  id: string;
  label: string;
  placeholder: string;
  required_terms: string[];
  min_chars?: number;
  help?: string;
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
    reference: { title: string; body: string; highlights?: string[] };
    fields: DocField[];
    dhf?: { doc_code: string; doc_title: string; doc_section?: string };
    colleague_card?: ColleagueCard;
    xp?: number;
  };
  onComplete: (score: number) => void;
  lessonId?: string;
  taskIndex?: number;
}

type FieldRating = "excellent" | "adequate" | "needs";

const matchTerms = (text: string, terms: string[]) => {
  const t = text.toLowerCase();
  return terms.filter((term) => t.includes(term.toLowerCase())).length;
};

const StageDocumentBuilder = ({ stage, onComplete, lessonId, taskIndex }: Props) => {
  const { user } = useAuth();
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(stage.fields.map((f) => [f.id, ""])),
  );
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const ratings = useMemo(() => {
    return stage.fields.map((f) => {
      const text = values[f.id] ?? "";
      const matched = matchTerms(text, f.required_terms);
      const min = f.min_chars ?? 30;
      const lenOk = text.trim().length >= min;
      let level: FieldRating = "needs";
      if (matched >= f.required_terms.length && lenOk) level = "excellent";
      else if (matched >= Math.ceil(f.required_terms.length / 2) && lenOk) level = "adequate";
      return { id: f.id, level, matched, total: f.required_terms.length, lenOk };
    });
  }, [values, stage.fields]);

  const adequateCount = ratings.filter((r) => r.level !== "needs").length;
  const adequatePct = Math.round((adequateCount / ratings.length) * 100);
  const score = Math.round(
    (ratings.filter((r) => r.level === "excellent").length * 100 +
      ratings.filter((r) => r.level === "adequate").length * 75) /
      ratings.length,
  );

  const passed = adequatePct >= 80;

  const allFilled = stage.fields.every(
    (f) => (values[f.id] ?? "").trim().length >= (f.min_chars ?? 30),
  );

  // Save to DHF Portfolio
  const persistToDhf = async () => {
    if (!stage.dhf || !user || !lessonId) return;
    setSaving(true);
    const body = stage.fields
      .map((f) => `## ${f.label}\n\n${values[f.id] ?? ""}`)
      .join("\n\n");
    const { error } = await supabase
      .from("dhf_documents")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          task_index: taskIndex ?? 0,
          doc_code: stage.dhf.doc_code,
          doc_title: stage.dhf.doc_title,
          doc_section: stage.dhf.doc_section ?? null,
          body_markdown: body,
          score,
        },
        { onConflict: "user_id,lesson_id,task_index" },
      );
    if (!error) setSaved(true);
    setSaving(false);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    onComplete(score);
    if (passed && stage.dhf) await persistToDhf();
  };

  const downloadPdf = () => {
    if (!stage.dhf) return;
    const body = stage.fields
      .map((f) => `## ${f.label}\n\n${values[f.id] ?? ""}`)
      .join("\n\n");
    downloadSingleDhfPdf(
      {
        doc_code: stage.dhf.doc_code,
        doc_title: stage.dhf.doc_title,
        doc_section: stage.dhf.doc_section,
        body_markdown: body,
        score,
        created_at: new Date().toISOString(),
      },
      user?.user_metadata?.display_name ?? user?.email ?? "Navoro Engineer",
    );
  };

  const fieldStatusIcon = (idx: number) => {
    const r = ratings[idx];
    if (!values[stage.fields[idx].id]) return null;
    if (r.level === "excellent")
      return <CheckCircle2 className="h-4 w-4 text-secondary" />;
    if (r.level === "adequate")
      return <CheckCircle2 className="h-4 w-4 text-accent" />;
    return <AlertTriangle className="h-4 w-4 text-destructive" />;
  };

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          {stage.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{stage.instruction}</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Reference panel */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 lg:sticky lg:top-4 lg:self-start max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-accent" />
              <p className="text-xs uppercase tracking-wider text-accent font-medium">Reference</p>
            </div>
            <h4 className="text-sm font-bold text-foreground mb-2">{stage.reference.title}</h4>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {stage.reference.body}
            </pre>
            {stage.reference.highlights && (
              <div className="flex flex-wrap gap-1 mt-3">
                {stage.reference.highlights.map((h) => (
                  <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Document fields */}
          <div className="space-y-3">
            {stage.fields.map((f, idx) => (
              <div key={f.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-wider text-foreground">
                    {f.label}
                  </label>
                  {fieldStatusIcon(idx)}
                </div>
                <Textarea
                  placeholder={f.placeholder}
                  value={values[f.id]}
                  onChange={(e) => {
                    setValues((p) => ({ ...p, [f.id]: e.target.value }));
                    if (submitted) setSubmitted(false);
                  }}
                  rows={3}
                  className="text-sm font-mono"
                  disabled={submitted && passed}
                />
                {f.help && <p className="text-[11px] text-muted-foreground">{f.help}</p>}
              </div>
            ))}

            {!submitted && (
              <Button
                onClick={handleSubmit}
                size="lg"
                className="w-full"
                disabled={!allFilled}
              >
                Submit document
              </Button>
            )}
          </div>
        </div>

        {/* Scoring panel */}
        {submitted && (
          <div className="mt-5 rounded-lg border border-accent/30 bg-card/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-foreground">Field-by-field review</p>
              <Badge
                className={passed ? "bg-secondary text-secondary-foreground" : "bg-destructive text-destructive-foreground"}
              >
                {passed ? "PASS" : "REVISE"} · {adequatePct}%
              </Badge>
            </div>
            <ul className="space-y-1.5 mb-4">
              {ratings.map((r, i) => (
                <li key={r.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{stage.fields[i].label}</span>
                  <Badge
                    variant="outline"
                    className={
                      r.level === "excellent"
                        ? "border-secondary/60 text-secondary"
                        : r.level === "adequate"
                          ? "border-accent/60 text-accent"
                          : "border-destructive/60 text-destructive"
                    }
                  >
                    {r.level === "excellent" ? "Excellent" : r.level === "adequate" ? "Adequate" : "Needs work"}
                  </Badge>
                </li>
              ))}
            </ul>

            {!passed && (
              <Button
                onClick={() => setSubmitted(false)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Revise document
              </Button>
            )}

            {passed && stage.dhf && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {saved
                    ? "Saved to your DHF Portfolio."
                    : saving
                      ? "Saving to DHF Portfolio..."
                      : "Saving to your DHF Portfolio..."}
                </p>
                <div className="flex gap-2">
                  <Button onClick={downloadPdf} variant="outline" size="sm" className="flex-1">
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF
                  </Button>
                  {!saved && !saving && (
                    <Button onClick={persistToDhf} variant="outline" size="sm" className="flex-1">
                      <Save className="h-3.5 w-3.5 mr-1.5" /> Save to portfolio
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Colleague card */}
        {submitted && passed && stage.colleague_card && (
          <div className="mt-4 rounded-lg border border-accent/30 bg-card/60 p-4 flex gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-background shrink-0"
              style={{ background: "linear-gradient(135deg, #064635, #0a8a5f)" }}
            >
              {stage.colleague_card.avatar ??
                stage.colleague_card.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">
                <Quote className="h-3 w-3 inline mr-1 text-accent" />
                {stage.colleague_card.name}
                {stage.colleague_card.role ? ` · ${stage.colleague_card.role}` : ""}
              </p>
              <p className="text-sm text-foreground italic mt-1">"{stage.colleague_card.quote}"</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StageDocumentBuilder;
