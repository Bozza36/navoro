// src/components/LevelCompleteCelebration.tsx
// Renders the moment a user finishes the last task of a level:
//   1. Badge unlock animation (gold ring pulse + scale-in)
//   2. Skill radar chart (recharts) showing the user's competency profile
//   3. "Team Performance Review" — every colleague's level-wide quote in one card
//
// Used by StagedLessonRunner. Self-contained — driven entirely by props.

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import { Award, ArrowRight, Quote } from "lucide-react";

export interface LevelColleagueQuote {
  name: string;
  role?: string;
  avatar?: string;
  quote: string;
}

interface Props {
  level: number;
  levelTitle: string;          // e.g. "Foundation"
  badgeLabel: string;          // e.g. "Biomed Foundation Badge"
  skillProfile: { skill: string; value: number }[]; // radar axes (0-100)
  teamQuotes: LevelColleagueQuote[];
  totalXp: number;
  onContinue: () => void;
}

const LevelCompleteCelebration = ({
  level, levelTitle, badgeLabel, skillProfile, teamQuotes, totalXp, onContinue,
}: Props) => {
  const [phase, setPhase] = useState<"intro" | "badge" | "radar" | "team">("intro");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("badge"), 200);
    const t2 = setTimeout(() => setPhase("radar"), 1600);
    const t3 = setTimeout(() => setPhase("team"), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="space-y-5">
      {/* Headline */}
      <Card className="border-accent/40 overflow-hidden relative">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(212,175,55,0.25), transparent 60%)",
          }}
        />
        <CardContent className="py-7 text-center relative">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-1">
            Level {level} Complete
          </p>
          <h2 className="text-3xl font-bold text-foreground tracking-wide">{levelTitle}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            +{totalXp.toLocaleString()} XP earned across this level
          </p>
        </CardContent>
      </Card>

      {/* Badge unlock */}
      <Card className="border-accent/40 relative overflow-hidden">
        <CardContent className="py-8 flex flex-col items-center text-center">
          <div
            className={`relative h-28 w-28 transition-all duration-700 ${
              phase === "intro" ? "scale-0 opacity-0" : "scale-100 opacity-100"
            }`}
          >
            {/* pulsing gold ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow:
                  phase === "intro" ? "none" : "0 0 0 8px rgba(212,175,55,0.15), 0 0 40px rgba(212,175,55,0.55)",
                animation: phase !== "intro" ? "pulse 2s ease-in-out infinite" : "none",
              }}
            />
            <div
              className="h-28 w-28 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #f4cf5a)",
                boxShadow: "0 0 40px rgba(212,175,55,0.4)",
              }}
            >
              <Award className="h-12 w-12 text-background" />
            </div>
          </div>
          <p className="text-sm uppercase tracking-wider text-accent mt-5">Badge unlocked</p>
          <h3 className="text-xl font-bold text-foreground mt-1">{badgeLabel}</h3>
        </CardContent>
      </Card>

      {/* Skill radar */}
      <Card
        className={`border-secondary/40 transition-all duration-500 ${
          phase === "intro" || phase === "badge" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Updated Skill Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillProfile} outerRadius="80%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="You"
                  dataKey="value"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  fill="#D4AF37"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Team performance review */}
      <Card
        className={`border-accent/30 transition-all duration-500 ${
          phase !== "team" ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
        }`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Team Performance Review</CardTitle>
          <p className="text-xs text-muted-foreground">
            What your colleagues took away from your work this level
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {teamQuotes.map((q, i) => (
            <div
              key={`${q.name}-${i}`}
              className="rounded-lg border border-border bg-card/60 p-3 flex gap-3"
            >
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-background shrink-0"
                style={{ background: "linear-gradient(135deg, #064635, #0a8a5f)" }}
              >
                {q.avatar ?? q.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  <Quote className="h-3 w-3 inline mr-1 text-accent" />
                  <span className="text-foreground font-medium">{q.name}</span>
                  {q.role ? ` · ${q.role}` : ""}
                </p>
                <p className="text-sm text-foreground italic mt-1">"{q.quote}"</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button size="lg" className="w-full" onClick={onContinue}>
        Continue to Level {level + 1} <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

export default LevelCompleteCelebration;
