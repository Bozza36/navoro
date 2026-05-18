import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, Lightbulb, FileText } from "lucide-react";

type Kind = "strength" | "issue" | "suggestion";
interface FeedbackItem { kind: Kind; text: string }
interface Review { verdict: "pass" | "needs_revision"; score: number; headline: string; feedback: FeedbackItem[]; reviewer: string }

interface Props {
  taskType: "document" | "briefing" | "meeting" | "lab" | "decision";
  taskTitle: string;
  scenario: string;
  reviewer?: string;
  rubric?: string[];
  prompt: string;
  placeholder?: string;
  minChars?: number;
  onComplete: (score: number) => void;
}

const KIND_META: Record<Kind, { Icon: any; cls: string; label: string }> = {
  strength: { Icon: CheckCircle2, cls: "text-secondary", label: "Strength" },
  issue: { Icon: AlertTriangle, cls: "text-destructive", label: "Issue" },
  suggestion: { Icon: Lightbulb, cls: "text-accent", label: "Suggestion" },
};

const AIReviewableStage = ({
  taskType, taskTitle, scenario, reviewer, rubric, prompt, placeholder, minChars = 80, onComplete,
}: Props) => {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("review-submission", {
        body: { taskType, taskTitle, scenario, reviewer, rubric, submission: text },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      setReview(data as Review);
      onComplete(data.score);
    } catch (e: any) {
      setError(e?.message ?? "Review failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (review) {
    const passed = review.verdict === "pass";
    return (
      <Card className={passed ? "border-secondary/40" : "border-destructive/40"}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" /> Performance Review
            </CardTitle>
            <Badge className={passed ? "bg-secondary text-secondary-foreground" : "bg-destructive text-destructive-foreground"}>
              {passed ? "Pass" : "Needs Revision"} · {review.score}/100
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Reviewed by <span className="text-foreground font-medium">{review.reviewer}</span></p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground leading-relaxed">{review.headline}</p>
          <ul className="space-y-2">
            {review.feedback.map((f, i) => {
              const meta = KIND_META[f.kind];
              const Icon = meta.Icon;
              return (
                <li key={i} className="flex gap-2 text-sm">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.cls}`} />
                  <span className="text-muted-foreground"><span className={`font-medium ${meta.cls}`}>{meta.label}:</span> {f.text}</span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{taskTitle}</CardTitle>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{prompt}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder ?? "Type your response here…"}
          rows={8}
          className="resize-y"
          disabled={submitting}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{text.length} chars · min {minChars}</p>
          <Button onClick={handleSubmit} disabled={text.length < minChars || submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reviewing…</> : "Submit for Review"}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
};

export default AIReviewableStage;
