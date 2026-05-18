// src/components/lesson-stages/StageMeetingSimulation.tsx
// FORMAT 5 — Meeting Room (deterministic card-based scoring).
//
// Each meeting beat shows a colleague's prompt + exactly 3 answer cards.
// Picking the correct card scores +1; reaction text from colleagues plays.
// At the end, total correct is compared to pass thresholds defined in the
// stage payload, producing PASS / CONDITIONAL / FAIL outcomes that match
// the content brief exactly.
//
// Stage payload (lessons.content.stages[]):
// {
//   "type": "meeting_simulation",
//   "title": "Design Input Review Meeting",
//   "scenario": "You're presenting design inputs for the CardioSense Pro...",
//   "attendees": [
//     { "name": "Sarah Jenkins",  "role": "Lead R&D",     "avatar": "SJ" },
//     { "name": "Dr. Anaya Rao",  "role": "Clinical",     "avatar": "AR" }
//   ],
//   "beats": [
//     {
//       "id": "b1",
//       "speaker": "Dr. Anaya Rao",
//       "prompt": "These design inputs read as engineering specs...",
//       "cards": [
//         {
//           "label": "Acknowledge & translate",
//           "body": "You're right — let's add clinical context...",
//           "correct": true,
//           "reaction": "Anaya nods. 'That's exactly the bridge I needed.'"
//         },
//         { "label": "Defer",    "body": "...",  "correct": false, "reaction": "..." },
//         { "label": "Push back","body": "...",  "correct": false, "reaction": "..." }
//       ]
//     }
//   ],
//   "thresholds": {
//     "pass":        { "min": 6, "label": "Approved",        "text": "All inputs accepted..." },
//     "conditional": { "min": 4, "label": "Conditional pass","text": "Three actions raised..." },
//     "fail":        { "min": 0, "label": "Two design inputs rejected", "text": "Reviewers concerned about..." }
//   },
//   "colleague_card": { "name": "Tom Hargreaves", "quote": "...", "avatar": "TH" },
//   "xp": 350
// }

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, CheckCircle2, AlertTriangle, XCircle, MessageSquare, Quote,
} from "lucide-react";

interface Attendee {
  name: string;
  role: string;
  avatar?: string;
}

interface AnswerCard {
  label: string;
  body: string;
  correct: boolean;
  reaction: string;
}

interface Beat {
  id: string;
  speaker: string;
  prompt: string;
  cards: AnswerCard[];
}

interface Threshold {
  min: number;
  label: string;
  text: string;
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
    scenario: string;
    attendees: Attendee[];
    beats: Beat[];
    thresholds: { pass: Threshold; conditional: Threshold; fail: Threshold };
    colleague_card?: ColleagueCard;
    xp?: number;
  };
  onComplete: (score: number) => void;
}

const initials = (n: string) =>
  n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const StageMeetingSimulation = ({ stage, onComplete }: Props) => {
  const [picks, setPicks] = useState<(number | null)[]>(
    () => stage.beats.map(() => null),
  );
  const [revealedIdx, setRevealedIdx] = useState<number>(-1); // index of last revealed reaction
  const [done, setDone] = useState(false);

  const pickCard = (beatIdx: number, cardIdx: number) => {
    if (picks[beatIdx] !== null) return;
    const next = [...picks];
    next[beatIdx] = cardIdx;
    setPicks(next);
    setRevealedIdx(beatIdx);
  };

  const advance = (beatIdx: number) => {
    if (beatIdx + 1 >= stage.beats.length) {
      // Final
      setDone(true);
      const correctCount = picks.filter(
        (p, i) => p !== null && stage.beats[i].cards[p]?.correct,
      ).length;
      const total = stage.beats.length;
      const pct = Math.round((correctCount / total) * 100);
      onComplete(pct);
    } else {
      setRevealedIdx(beatIdx + 0.5); // gate to next beat
    }
  };

  const correctCount = picks.reduce(
    (acc, p, i) =>
      acc + (p !== null && stage.beats[i].cards[p]?.correct ? 1 : 0),
    0,
  );

  const outcome = (() => {
    const { pass, conditional, fail } = stage.thresholds;
    if (correctCount >= pass.min) return { kind: "pass" as const, ...pass };
    if (correctCount >= conditional.min) return { kind: "conditional" as const, ...conditional };
    return { kind: "fail" as const, ...fail };
  })();

  // Determine which beat we're currently working on (first one with no pick yet)
  const activeBeat = picks.findIndex((p) => p === null);
  const showBeat = (i: number) => {
    if (i <= revealedIdx) return true;
    if (activeBeat === i) return true;
    return false;
  };

  return (
    <Card className="border-secondary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-secondary" /> {stage.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{stage.scenario}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Attendees */}
        <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-muted/30 p-3">
          {stage.attendees.map((a) => (
            <div key={a.name} className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-background"
                style={{ background: "linear-gradient(135deg, #064635, #0a8a5f)" }}
              >
                {a.avatar ?? initials(a.name)}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground leading-none">{a.name}</p>
                <p className="text-[10px] text-muted-foreground">{a.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Beats */}
        {!done && stage.beats.map((beat, i) => {
          if (!showBeat(i)) return null;
          const picked = picks[i];
          const card = picked !== null ? beat.cards[picked] : null;

          return (
            <div key={beat.id} className="space-y-3">
              {/* Speaker prompt */}
              <div className="flex gap-3">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-background shrink-0"
                  style={{ background: "linear-gradient(135deg, #064635, #0a8a5f)" }}
                >
                  {initials(beat.speaker)}
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted/50 border border-border p-3 flex-1">
                  <p className="text-[11px] text-muted-foreground mb-1">
                    <MessageSquare className="h-3 w-3 inline mr-1" />
                    {beat.speaker}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{beat.prompt}</p>
                </div>
              </div>

              {/* Answer cards */}
              {picked === null && (
                <div className="grid gap-2 sm:grid-cols-3">
                  {beat.cards.map((c, ci) => (
                    <button
                      key={ci}
                      onClick={() => pickCard(i, ci)}
                      className="text-left rounded-lg border-2 border-border bg-card hover:border-accent/60 hover:bg-accent/5 transition-all p-3"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">
                        {c.label}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Reaction */}
              {picked !== null && card && (
                <div
                  className={`rounded-lg border p-3 ${
                    card.correct
                      ? "border-secondary/50 bg-secondary/5"
                      : "border-destructive/50 bg-destructive/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {card.correct ? (
                      <CheckCircle2 className="h-4 w-4 text-secondary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <p className="text-xs font-bold tracking-wide">
                      {card.correct ? "STRONG RESPONSE" : "PUSHBACK"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{card.reaction}</p>
                  {i < stage.beats.length - 1 ? (
                    <Button
                      onClick={() => advance(i)}
                      size="sm"
                      className="mt-3"
                      disabled={revealedIdx > i}
                    >
                      Next exchange
                    </Button>
                  ) : (
                    <Button onClick={() => advance(i)} size="sm" className="mt-3">
                      End meeting
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Outcome */}
        {done && (
          <div
            className={`rounded-lg border-2 p-5 ${
              outcome.kind === "pass"
                ? "border-secondary/60 bg-secondary/10"
                : outcome.kind === "conditional"
                  ? "border-accent/60 bg-accent/10"
                  : "border-destructive/60 bg-destructive/10"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {outcome.kind === "pass" ? (
                <CheckCircle2 className="h-5 w-5 text-secondary" />
              ) : outcome.kind === "conditional" ? (
                <AlertTriangle className="h-5 w-5 text-accent" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <Badge
                className={
                  outcome.kind === "pass"
                    ? "bg-secondary text-secondary-foreground"
                    : outcome.kind === "conditional"
                      ? "bg-accent text-accent-foreground"
                      : "bg-destructive text-destructive-foreground"
                }
              >
                {outcome.label.toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {correctCount} / {stage.beats.length} optimal responses
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{outcome.text}</p>

            {/* Transcript with optimal answers */}
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Transcript — your responses vs. optimal
              </p>
              {stage.beats.map((b, i) => {
                const yourIdx = picks[i];
                const yours = yourIdx !== null ? b.cards[yourIdx] : null;
                const optimal = b.cards.find((c) => c.correct);
                return (
                  <div key={b.id} className="text-xs space-y-1">
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">{b.speaker}:</span> {b.prompt}
                    </p>
                    <p className={yours?.correct ? "text-secondary" : "text-destructive"}>
                      → You chose: {yours?.label} {yours?.correct ? "✓" : "✗"}
                    </p>
                    {!yours?.correct && optimal && (
                      <p className="text-secondary">→ Optimal: {optimal.label} ✓</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Colleague card */}
            {stage.colleague_card && (
              <div className="mt-4 pt-4 border-t border-border flex gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-background shrink-0"
                  style={{ background: "linear-gradient(135deg, #064635, #0a8a5f)" }}
                >
                  {stage.colleague_card.avatar ?? initials(stage.colleague_card.name)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    <Quote className="h-3 w-3 inline mr-1 text-accent" />
                    {stage.colleague_card.name}
                    {stage.colleague_card.role ? ` · ${stage.colleague_card.role}` : ""}
                  </p>
                  <p className="text-sm text-foreground italic mt-1">"{stage.colleague_card.quote}"</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StageMeetingSimulation;
