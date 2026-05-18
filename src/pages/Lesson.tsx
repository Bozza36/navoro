import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import ResourceSliders from "@/components/ResourceSliders";
import TeamPanel from "@/components/TeamPanel";
import LevelBadge from "@/components/LevelBadge";
import GraphicPlaceholder from "@/components/GraphicPlaceholder";
import StagedLessonRunner from "@/components/StagedLessonRunner";
import LessonOutlineSidebar from "@/components/LessonOutlineSidebar";
import TaskTypeBadge, { inferTaskType } from "@/components/TaskTypeBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Loader2, BarChart3, Gauge, Lock, Crown, PlayCircle } from "lucide-react";

interface SliderConfig {
  name: string;
  label: string;
  min: number;
  max: number;
  optimal: number;
  weight: number;
}

interface LegacyContent {
  scenario: string;
  diagram_label: string;
  choices?: { id: number; text: string; correct: boolean; feedback: string }[];
  sliders?: SliderConfig[];
  sandbox_type?: string;
  outcome_text?: Record<string, string>;
}

const LEVELS_MAP: Record<number, string> = {
  1: "Explorer", 2: "Apprentice", 3: "Practitioner",
  4: "Specialist", 5: "Professional", 6: "Expert", 7: "Leader",
};

const Lesson = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<any>(null);
  const [content, setContent] = useState<LegacyContent | null>(null);
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; grade: string; xp_earned: number; narrative: string } | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [adUnlocked, setAdUnlocked] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    const fetchLesson = async () => {
      const { data } = await supabase.from("lessons").select("*").eq("id", id).single();
      if (data) {
        setLesson(data);
        const c = data.content as unknown as LegacyContent;
        setContent(c);
        if (c.sliders) {
          const defaults: Record<string, number> = {};
          c.sliders.forEach((s) => { defaults[s.name] = 50; });
          setSliderValues(defaults);
        }
      }
      const { data: prof } = await supabase.from("profiles").select("is_pro").eq("user_id", user.id).single();
      if (prof) setIsPro(prof.is_pro);
      if (id && sessionStorage.getItem(`navoro_unlock_${id}`) === "1") setAdUnlocked(true);

      const { data: progress } = await supabase
        .from("user_lesson_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("lesson_id", id)
        .eq("completed", true)
        .maybeSingle();
      if (progress) {
        setAlreadyCompleted(true);
        setSubmitted(true);
        setResult({
          score: progress.selected_choice ?? 0,
          grade: (progress.selected_choice ?? 0) >= 85 ? "excellent" : (progress.selected_choice ?? 0) >= 65 ? "good" : (progress.selected_choice ?? 0) >= 40 ? "fair" : "poor",
          xp_earned: progress.xp_earned,
          narrative: "You've already completed this scenario.",
        });
      }
    };
    fetchLesson();
  }, [user, id]);

  const watchAd = () => {
    setWatchingAd(true);
    setAdCountdown(5);
    const iv = setInterval(() => {
      setAdCountdown((s) => {
        if (s <= 1) {
          clearInterval(iv);
          setWatchingAd(false);
          if (id) sessionStorage.setItem(`navoro_unlock_${id}`, "1");
          setAdUnlocked(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const isSandbox = content?.sliders && content.sliders.length > 0;

  const handleSliderChange = (name: string, value: number) => {
    setSliderValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitSandbox = async () => {
    if (!user || !lesson) return;
    setSubmitting(true);
    try {
      const response = await supabase.functions.invoke("calculate-sandbox", {
        body: { lesson_id: lesson.id, sliders: sliderValues },
      });
      if (response.data) {
        setResult(response.data);
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Sandbox calculation failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLegacy = async () => {
    if (selectedChoice === null || !lesson || !user || !content?.choices) return;
    setSubmitting(true);
    const isCorrect = content.choices[selectedChoice]?.correct;
    const earned = isCorrect ? lesson.xp_reward : Math.floor(lesson.xp_reward * 0.25);

    await supabase.from("user_lesson_progress").upsert({
      user_id: user.id, lesson_id: lesson.id, completed: true,
      selected_choice: selectedChoice, xp_earned: earned,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,lesson_id" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp, streak_count, last_lesson_date")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      const today = new Date().toISOString().split("T")[0];
      const lastDate = profile.last_lesson_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      let newStreak = profile.streak_count;
      if (lastDate === yesterday) newStreak += 1;
      else if (lastDate !== today) newStreak = 1;
      const newXp = profile.total_xp + earned;
      const levels = ["Explorer", "Apprentice", "Practitioner", "Specialist", "Professional", "Expert", "Leader"] as const;
      const newLevelIndex = Math.min(Math.floor(newXp / 200), 6);
      await supabase.from("profiles").update({
        total_xp: newXp, streak_count: newStreak,
        last_lesson_date: today, current_level: levels[newLevelIndex],
      }).eq("user_id", user.id);
    }

    setResult({
      score: isCorrect ? 100 : 25,
      grade: isCorrect ? "excellent" : "poor",
      xp_earned: earned,
      narrative: isCorrect ? "Great decision!" : content.choices[selectedChoice]?.feedback || "Not the best choice.",
    });
    setSubmitted(true);
    setSubmitting(false);
  };

  if (authLoading || !lesson || !content) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center text-muted-foreground">Loading scenario...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-[1400px]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-6">
          {/* LEFT — Path outline */}
          <div className="hidden lg:block">
            <LessonOutlineSidebar lesson={lesson} userId={user!.id} />
          </div>

          {/* MAIN */}
          <div className="space-y-6 min-w-0">
            {/* Header */}
            <div className="flex items-start gap-4">
              <LevelBadge level={lesson.level} size="md" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">{lesson.category}</Badge>
                  <Badge variant="secondary" className="text-xs">Level {lesson.level}: {LEVELS_MAP[lesson.level]}</Badge>
                  <Badge className="bg-accent text-accent-foreground text-xs">
                    <Star className="h-3 w-3 mr-1" />{lesson.xp_reward} XP
                  </Badge>
                  <TaskTypeBadge type={inferTaskType((content as any)?.stages?.[0]?.type)} />
                </div>
                <h1 className="text-2xl font-bold tracking-wide text-foreground">{lesson.title}</h1>
                <p className="text-muted-foreground mt-1 text-sm">{lesson.description}</p>
              </div>
            </div>

            {lesson.level >= 2 && !isPro && !adUnlocked && !alreadyCompleted ? (
              <Card className="border-accent/40" style={{ boxShadow: "0 0 30px hsl(43 69% 52% / 0.2)" }}>
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center gold-glow">
                    <Lock className="h-8 w-8 text-accent" />
                  </div>
                  <h2 className="text-xl font-bold tracking-wide text-foreground mb-2">Level {lesson.level} Locked</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Levels 2–7 require Navoro Pro. Watch a short ad to unlock this single scenario, or upgrade for unlimited access.
                  </p>
                  {watchingAd ? (
                    <div className="rounded-lg bg-muted py-12 mb-2">
                      <p className="text-sm text-muted-foreground">Sponsored placement</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{adCountdown}s</p>
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-center">
                      <Button onClick={watchAd} variant="outline" className="gap-2">
                        <PlayCircle className="h-4 w-4" /> Watch Ad to Unlock
                      </Button>
                      <Button onClick={() => navigate("/pro")} className="bg-accent text-accent-foreground hover:bg-accent/90 gold-glow gap-2">
                        <Crown className="h-4 w-4" /> Go Pro
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-border" style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-accent" /> Scenario Briefing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed text-sm">{content.scenario}</p>
                  </CardContent>
                </Card>

                <GraphicPlaceholder label={content.diagram_label} className="rounded-xl" />

                {(content as any).format === "staged" && (content as any).stages ? (
                  alreadyCompleted && result ? (
                    <PerformanceReview result={result} alreadyCompleted={true} onContinue={() => navigate(-1)} />
                  ) : (
                    <StagedLessonRunner
                      lesson={lesson}
                      userId={user!.id}
                      onComplete={({ score, xpEarned }) => {
                        setResult({
                          score,
                          grade: score >= 85 ? "excellent" : score >= 65 ? "good" : score >= 40 ? "fair" : "poor",
                          xp_earned: xpEarned,
                          narrative: "Staged scenario complete.",
                        });
                        setSubmitted(true);
                      }}
                    />
                  )
                ) : isSandbox ? (
                  <>
                    <Card style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-secondary" /> Decision Sandbox — Resource Allocation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResourceSliders
                          sliders={content.sliders!}
                          values={sliderValues}
                          onChange={handleSliderChange}
                          disabled={submitted}
                        />
                      </CardContent>
                    </Card>

                    {!submitted ? (
                      <Button size="lg" className="w-full" onClick={handleSubmitSandbox} disabled={submitting}>
                        {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calculating...</> : "Submit Recommendation"}
                      </Button>
                    ) : result && <PerformanceReview result={result} alreadyCompleted={alreadyCompleted} onContinue={() => navigate(-1)} />}
                  </>
                ) : content.choices ? (
                  <>
                    <Card style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">What's your recommendation?</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {content.choices.map((choice) => {
                            const isSelected = selectedChoice === choice.id;
                            const showResult = submitted;
                            let borderClass = "border-border hover:border-primary/50";
                            if (isSelected && !showResult) borderClass = "border-primary bg-primary/10";
                            if (showResult && isSelected && choice.correct) borderClass = "border-secondary bg-secondary/10";
                            if (showResult && isSelected && !choice.correct) borderClass = "border-destructive bg-destructive/10";
                            if (showResult && !isSelected && choice.correct) borderClass = "border-secondary/50 bg-secondary/5";

                            return (
                              <button
                                key={choice.id}
                                onClick={() => !submitted && setSelectedChoice(choice.id)}
                                disabled={submitted}
                                className={`w-full text-left rounded-xl border-2 p-4 transition-all ${borderClass}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5">
                                    {showResult && isSelected && choice.correct && <span className="text-secondary">✓</span>}
                                    {showResult && isSelected && !choice.correct && <span className="text-destructive">✗</span>}
                                    {!showResult && (
                                      <div className={`h-5 w-5 rounded-full border-2 ${isSelected ? "border-primary bg-primary" : "border-border"}`} />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{choice.text}</p>
                                    {showResult && (isSelected || choice.correct) && (
                                      <p className="text-xs text-muted-foreground mt-1">{choice.feedback}</p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {!submitted ? (
                      <Button size="lg" className="w-full" disabled={selectedChoice === null || submitting} onClick={handleSubmitLegacy}>
                        {submitting ? "Submitting..." : "Submit Recommendation"}
                      </Button>
                    ) : result && <PerformanceReview result={result} alreadyCompleted={alreadyCompleted} onContinue={() => navigate(-1)} />}
                  </>
                ) : null}
              </>
            )}
          </div>

          {/* RIGHT — Team & Context */}
          <aside className="space-y-6">
            <TeamPanel category={lesson.category} />
            <Card style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium tracking-wide uppercase">Complexity</p>
                <div className="flex gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full ${i < lesson.level ? "bg-secondary" : "bg-muted"}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Level {lesson.level}/7 — {LEVELS_MAP[lesson.level]}</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
};

/* Performance Review Card — replaces simple correct/incorrect */
const PerformanceReview = ({
  result,
  alreadyCompleted,
  onContinue,
}: {
  result: { score: number; grade: string; xp_earned: number; narrative: string };
  alreadyCompleted: boolean;
  onContinue: () => void;
}) => (
  <Card className="border-accent/30" style={{ boxShadow: "0 0 24px hsl(43 69% 52% / 0.15)" }}>
    <CardContent className="py-6">
      <p className="text-xs text-accent font-medium tracking-wider uppercase mb-3">Performance Review</p>
      <div className="text-center mb-4">
        <p className="text-4xl font-bold text-accent mb-1">{result.score}/100</p>
        <Badge className={`${
          result.grade === "excellent" ? "bg-secondary text-secondary-foreground"
            : result.grade === "good" ? "bg-secondary/70 text-secondary-foreground"
            : "bg-muted text-muted-foreground"
        }`}>
          {result.grade.charAt(0).toUpperCase() + result.grade.slice(1)}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground text-center mb-4">{result.narrative}</p>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {alreadyCompleted ? "Previously completed" : "You earned"}{" "}
          <span className="text-accent font-bold">{result.xp_earned} XP</span>
        </p>
        <Button onClick={onContinue}>Continue</Button>
      </div>
    </CardContent>
  </Card>
);

export default Lesson;
