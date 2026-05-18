// src/components/StagedLessonRunner.tsx
// Drives a lesson made up of multiple stages (each = one "task" from the brief).
// New behaviour vs. legacy:
//   - Per-task XP read from stage.xp (falls back to lesson.xp_reward / N if missing).
//   - Always shows a Colleague Card after each task is submitted (handled inside each Stage component).
//   - On lesson completion, checks if this is the LAST lesson of its level.
//     If so, captures team quotes from this level and triggers LevelCompleteCelebration.
//   - Passes lessonId / taskIndex into StageDocumentBuilder so it can persist to dhf_documents.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, ArrowRight } from "lucide-react";

import StageDecisionTree from "./lesson-stages/StageDecisionTree";
import StageCytotoxicity from "./lesson-stages/StageCytotoxicity";
import StageMaterialSlider from "./lesson-stages/StageMaterialSlider";
import StageComponentSelector from "./lesson-stages/StageComponentSelector";
import StageEcgFilter from "./lesson-stages/StageEcgFilter";
import StagePowerAllocation from "./lesson-stages/StagePowerAllocation";
import StageDocumentTask from "./lesson-stages/StageDocumentTask";
import StageBriefingRoom from "./lesson-stages/StageBriefingRoom";
import StageMeetingSimulation from "./lesson-stages/StageMeetingSimulation";
import StageGuidedScenario from "./lesson-stages/StageGuidedScenario";
import StageDecisionSandbox from "./lesson-stages/StageDecisionSandbox";
import StageDocumentBuilder from "./lesson-stages/StageDocumentBuilder";
import StageRiskMatrix from "./lesson-stages/StageRiskMatrix";
import StageFormulaSandbox from "./lesson-stages/StageFormulaSandbox";

import LevelCompleteCelebration, {
  LevelColleagueQuote,
} from "./LevelCompleteCelebration";

interface RunnerProps {
  lesson: any;
  userId: string;
  onComplete: (result: { score: number; xpEarned: number; biomedBadge: boolean }) => void;
}

const LEVEL_TITLES: Record<number, string> = {
  1: "Foundation",
  2: "Practitioner",
  3: "Contributor",
  4: "Specialist",
  5: "Leader",
  6: "Expert",
  7: "Architect",
};

const StagedLessonRunner = ({ lesson, userId, onComplete }: RunnerProps) => {
  const stages = lesson.content.stages as any[];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [stageScores, setStageScores] = useState<number[]>([]);
  const [xpPerStage, setXpPerStage] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<{ score: number; xpEarned: number; biomedBadge: boolean } | null>(null);

  // Level-complete celebration
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    badgeLabel: string;
    skillProfile: { skill: string; value: number }[];
    teamQuotes: LevelColleagueQuote[];
    totalXp: number;
  } | null>(null);

  const stage = stages[currentIdx];
  const interactiveStages = stages.filter((s) => s.type !== "performance_review");

  const handleStageComplete = (score: number) => {
    setStageScores((p) => [...p, score]);
    // Per-task XP, scaled by score
    const taskXp = stage?.xp ?? Math.round((lesson.xp_reward ?? 100) / interactiveStages.length);
    const earned = Math.max(Math.floor(taskXp * 0.4), Math.round(taskXp * (score / 100)));
    setXpPerStage((p) => [...p, earned]);
  };

  const handleNext = async () => {
    if (currentIdx < stages.length - 1) {
      setCurrentIdx((i) => i + 1);
      if (stages[currentIdx + 1]?.type === "performance_review") {
        await finalize();
      }
    }
  };

  const finalize = async () => {
    setSubmitting(true);
    const validScores = stageScores.filter((_, i) => stages[i]?.type !== "performance_review");
    const avgScore = validScores.length
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;
    const xpEarned = xpPerStage.reduce((a, b) => a + b, 0);

    await supabase.from("user_lesson_progress").upsert(
      {
        user_id: userId,
        lesson_id: lesson.id,
        completed: true,
        selected_choice: avgScore,
        xp_earned: xpEarned,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );

    // Update profile XP, streak, current_level
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp, streak_count, last_lesson_date")
      .eq("user_id", userId)
      .single();

    if (profile) {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      let newStreak = profile.streak_count;
      if (profile.last_lesson_date === yesterday) newStreak += 1;
      else if (profile.last_lesson_date !== today) newStreak = 1;
      const newXp = profile.total_xp + xpEarned;
      const levels = ["Explorer", "Apprentice", "Practitioner", "Specialist", "Professional", "Expert", "Leader"] as const;
      const newLevelIndex = Math.min(Math.floor(newXp / 1500), 6); // calibrated for ~10250 total
      await supabase.from("profiles").update({
        total_xp: newXp,
        streak_count: newStreak,
        last_lesson_date: today,
        current_level: levels[newLevelIndex],
      }).eq("user_id", userId);
    }

    // Biomed Level 1 explorer badge (legacy)
    let biomedBadge = false;
    if (lesson.category === "Biomedical" && lesson.level === 1) {
      const { data: l1Lessons } = await supabase
        .from("lessons")
        .select("id")
        .eq("category", "Biomedical")
        .eq("level", 1);
      const { data: completed } = await supabase
        .from("user_lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("completed", true);
      const completedIds = new Set([...(completed?.map((c) => c.lesson_id) ?? []), lesson.id]);
      biomedBadge = (l1Lessons ?? []).every((l) => completedIds.has(l.id));
    }

    setFinalResult({ score: avgScore, xpEarned, biomedBadge });
    onComplete({ score: avgScore, xpEarned, biomedBadge });

    // Level-complete celebration
    await maybeShowLevelComplete(xpEarned);
    setSubmitting(false);
  };

  const maybeShowLevelComplete = async (justEarned: number) => {
    if (!lesson || !lesson.category || !lesson.level) return;
    const { data: levelLessons } = await supabase
      .from("lessons")
      .select("id")
      .eq("category", lesson.category)
      .eq("level", lesson.level);
    if (!levelLessons || levelLessons.length === 0) return;

    const { data: completed } = await supabase
      .from("user_lesson_progress")
      .select("lesson_id, xp_earned")
      .eq("user_id", userId)
      .eq("completed", true);

    const completedIds = new Set([
      ...(completed?.map((c) => c.lesson_id) ?? []),
      lesson.id,
    ]);
    const allDone = levelLessons.every((l) => completedIds.has(l.id));
    if (!allDone) return;

    // Already celebrated?
    const { data: prior } = await supabase
      .from("level_completions")
      .select("id")
      .eq("user_id", userId)
      .eq("category", lesson.category)
      .eq("level", lesson.level)
      .maybeSingle();
    if (prior) return;

    // Gather team quotes from this level's lesson content
    const { data: lessonsFull } = await supabase
      .from("lessons")
      .select("content")
      .eq("category", lesson.category)
      .eq("level", lesson.level);

    const teamQuotes: LevelColleagueQuote[] = [];
    const seen = new Set<string>();
    (lessonsFull ?? []).forEach((row: any) => {
      const cc: any[] = row.content?.team_quotes ?? [];
      for (const q of cc) {
        const key = `${q.name}::${q.quote}`;
        if (seen.has(key)) continue;
        seen.add(key);
        teamQuotes.push(q);
      }
    });

    // Skill profile — pull from level completion data or compute from average
    const totalLevelXp = (completed ?? [])
      .filter((c) => levelLessons.some((l) => l.id === c.lesson_id))
      .reduce((a, c) => a + (c.xp_earned ?? 0), 0) + justEarned;

    const skillProfile = [
      { skill: "Quality", value: Math.min(100, 60 + lesson.level * 8) },
      { skill: "Design", value: Math.min(100, 55 + lesson.level * 9) },
      { skill: "Regulatory", value: Math.min(100, 50 + lesson.level * 10) },
      { skill: "V&V", value: Math.min(100, 50 + lesson.level * 10) },
      { skill: "Risk", value: Math.min(100, 55 + lesson.level * 9) },
      { skill: "Leadership", value: Math.min(100, 30 + lesson.level * 14) },
    ];

    const badgeLabel = `${lesson.category} ${LEVEL_TITLES[lesson.level] ?? `Level ${lesson.level}`} Badge`;

    // Persist completion
    await supabase.from("level_completions").insert({
      user_id: userId,
      category: lesson.category,
      level: lesson.level,
      team_review: { quotes: teamQuotes, skill_profile: skillProfile, total_xp: totalLevelXp },
    });

    setCelebrationData({
      badgeLabel,
      skillProfile,
      teamQuotes,
      totalXp: totalLevelXp,
    });
    setShowLevelComplete(true);
  };

  const renderStage = () => {
    switch (stage.type) {
      case "decision_tree":      return <StageDecisionTree stage={stage} onComplete={handleStageComplete} />;
      case "cytotoxicity_graph": return <StageCytotoxicity stage={stage} onComplete={handleStageComplete} />;
      case "material_slider":    return <StageMaterialSlider stage={stage} onComplete={handleStageComplete} />;
      case "component_selector": return <StageComponentSelector stage={stage} onComplete={handleStageComplete} />;
      case "ecg_filter":         return <StageEcgFilter stage={stage} onComplete={handleStageComplete} />;
      case "power_allocation":   return <StagePowerAllocation stage={stage} onComplete={handleStageComplete} />;
      case "document_task":      return <StageDocumentTask stage={stage} onComplete={handleStageComplete} />;
      case "briefing_room":      return <StageBriefingRoom stage={stage} onComplete={handleStageComplete} />;
      case "meeting_simulation": return <StageMeetingSimulation stage={stage} onComplete={handleStageComplete} />;
      case "guided_scenario":    return <StageGuidedScenario stage={stage} onComplete={handleStageComplete} />;
      case "decision_sandbox":   return <StageDecisionSandbox stage={stage} onComplete={handleStageComplete} />;
      case "document_builder":   return (
        <StageDocumentBuilder
          stage={stage}
          onComplete={handleStageComplete}
          lessonId={lesson.id}
          taskIndex={currentIdx}
        />
      );
      case "risk_matrix":        return <StageRiskMatrix stage={stage} onComplete={handleStageComplete} />;
      case "formula_sandbox":    return <StageFormulaSandbox stage={stage} onComplete={handleStageComplete} />;
      case "performance_review":
        return (
          <Card className="border-accent/30" style={{ boxShadow: "0 0 24px hsl(43 69% 52% / 0.15)" }}>
            <CardContent className="py-6">
              <p className="text-xs text-accent font-medium tracking-wider uppercase mb-3">{stage.title}</p>
              {submitting || !finalResult ? (
                <p className="text-sm text-muted-foreground">Compiling review from {stage.reviewer}...</p>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-accent mb-1">{finalResult.score}/100</p>
                    <Badge className="bg-secondary text-secondary-foreground">
                      {finalResult.score >= 85 ? "Excellent" : finalResult.score >= 65 ? "Good" : finalResult.score >= 40 ? "Fair" : "Needs Work"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Reviewed by <span className="text-foreground font-medium">{stage.reviewer}</span></p>
                  <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                    {(stage.criteria ?? []).map((c: string, i: number) => (
                      <li key={c}>• {c}: <span className="text-foreground">{stageScores[i] ?? "—"}/100</span></li>
                    ))}
                  </ul>
                  <p className="text-sm text-accent font-bold mb-3">+{finalResult.xpEarned} XP earned</p>
                  {finalResult.biomedBadge && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-accent/40 bg-accent/5 mb-3">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D4AF37, #f4cf5a)", boxShadow: "0 0 20px #D4AF37" }}>
                        <Award className="h-6 w-6 text-background" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-accent">Biomed Foundation Badge Unlocked!</p>
                        <p className="text-xs text-muted-foreground">All Level 1 Biomedical lessons complete.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      default: return <p className="text-muted-foreground">Unknown stage type: {stage.type}</p>;
    }
  };

  // Show level-complete celebration when triggered
  if (showLevelComplete && celebrationData) {
    return (
      <LevelCompleteCelebration
        level={lesson.level}
        levelTitle={LEVEL_TITLES[lesson.level] ?? `Level ${lesson.level}`}
        badgeLabel={celebrationData.badgeLabel}
        skillProfile={celebrationData.skillProfile}
        teamQuotes={celebrationData.teamQuotes}
        totalXp={celebrationData.totalXp}
        onContinue={() => setShowLevelComplete(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {stages.map((s, i) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i < currentIdx ? "bg-accent" : i === currentIdx ? "bg-secondary" : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Stage {currentIdx + 1} of {stages.length}
        {stage?.xp && <> · <span className="text-accent">{stage.xp} XP available</span></>}
      </p>

      {renderStage()}

      {stageScores.length > currentIdx && currentIdx < stages.length - 1 && (
        <Button onClick={handleNext} size="lg" className="w-full">
          Next Stage <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
};

export default StagedLessonRunner;
