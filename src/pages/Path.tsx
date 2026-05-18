import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, Circle, Play } from "lucide-react";

const LEVELS = [
  { name: "Explorer", number: 1, description: "Begin your engineering journey" },
  { name: "Apprentice", number: 2, description: "Build foundational knowledge" },
  { name: "Practitioner", number: 3, description: "Apply core concepts" },
  { name: "Specialist", number: 4, description: "Deepen your expertise" },
  { name: "Professional", number: 5, description: "Master advanced scenarios" },
  { name: "Expert", number: 6, description: "Lead complex projects" },
  { name: "Leader", number: 7, description: "Shape the future of engineering" },
];

interface LessonSummary {
  id: string;
  title: string;
  category: string;
  level: number;
  order_index: number;
  xp_reward: number;
}

const Path = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [highestCompletedLevel, setHighestCompletedLevel] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [adUnlocked, setAdUnlocked] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      let q = supabase
        .from("lessons")
        .select("id, title, category, level, order_index, xp_reward")
        .order("level")
        .order("order_index");
      if (categoryFilter) q = q.eq("category", categoryFilter as any);
      const { data: lessonData } = await q;
      if (lessonData) setLessons(lessonData);

      const { data: progressData } = await supabase
        .from("user_lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id)
        .eq("completed", true);
      if (progressData) {
        setCompletedLessonIds(new Set(progressData.map((p) => p.lesson_id)));
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("user_id", user.id)
        .single();
      if (profile) setIsPro(profile.is_pro);
    };

    fetchData();
  }, [user, categoryFilter]);

  useEffect(() => {
    if (lessons.length === 0) return;
    let highest = 0;
    for (const level of LEVELS) {
      const levelLessons = lessons.filter((l) => l.level === level.number);
      if (levelLessons.length > 0 && levelLessons.every((l) => completedLessonIds.has(l.id))) {
        highest = level.number;
      } else break;
    }
    setHighestCompletedLevel(highest);
  }, [lessons, completedLessonIds]);

  const handleAdUnlock = (levelNumber: number) => {
    // Simulate watching an ad — in production this would trigger AdSense rewarded flow
    setAdUnlocked((prev) => new Set([...prev, levelNumber]));
  };

  const isLevelAccessible = (levelNumber: number) => {
    if (levelNumber === 1) return true;
    if (levelNumber > highestCompletedLevel + 1) return false;
    if (levelNumber === 2) return true;
    if (isPro) return true;
    if (adUnlocked.has(levelNumber)) return true;
    return false;
  };

  const needsAdUnlock = (levelNumber: number) => {
    if (levelNumber <= 2 || isPro) return false;
    if (adUnlocked.has(levelNumber)) return false;
    return levelNumber === highestCompletedLevel + 1;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold tracking-wide text-foreground">The Path</h1>
          {!isPro && (
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => navigate("/pro")}
            >
              ✨ Go Pro
            </Button>
          )}
        </div>
        <p className="text-muted-foreground mb-8">Master each level to unlock the next.</p>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          {LEVELS.map((level) => {
            const isUnlocked = level.number <= highestCompletedLevel + 1;
            const accessible = isLevelAccessible(level.number);
            const showAdWall = needsAdUnlock(level.number);
            const levelLessons = lessons.filter((l) => l.level === level.number);
            const allCompleted = levelLessons.length > 0 && levelLessons.every((l) => completedLessonIds.has(l.id));
            const hasLessons = levelLessons.length > 0;

            return (
              <div key={level.name} className="relative pl-16 pb-8">
                <div className={`absolute left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${allCompleted ? "bg-accent border-accent" : isUnlocked ? "bg-secondary border-primary" : "bg-muted border-border"}`}
                >
                  {allCompleted ? (
                    <CheckCircle2 className="h-3 w-3 text-accent-foreground" />
                  ) : isUnlocked ? (
                    <Circle className="h-2 w-2 text-primary" />
                  ) : (
                    <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </div>

                <div className={`rounded-xl border p-4 transition-all ${
                  isUnlocked ? "bg-card border-border shadow-md" : "bg-muted/30 border-border opacity-60"
                }`} style={isUnlocked ? { boxShadow: "0 4px 20px -4px hsl(0 0% 0% / 0.06)" } : undefined}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">
                      Level {level.number}: {level.name}
                    </h3>
                    {allCompleted && <Badge className="bg-accent text-accent-foreground text-xs">Complete</Badge>}
                    {!isUnlocked && <Badge variant="secondary" className="text-xs">Locked</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{level.description}</p>

                  {showAdWall && !accessible && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-3 w-full border-accent text-accent"
                      onClick={() => handleAdUnlock(level.number)}
                    >
                      <Play className="h-3 w-3 mr-1" /> Watch Ad to Unlock Lesson
                    </Button>
                  )}

                  {hasLessons && (isUnlocked || accessible) && (
                    <div className="space-y-2">
                      {levelLessons.map((lesson) => {
                        const isCompleted = completedLessonIds.has(lesson.id);
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => navigate(`/lesson/${lesson.id}`)}
                            className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors flex items-center justify-between
                              ${isCompleted
                                ? "bg-secondary/50 border-secondary text-foreground"
                                : "bg-background border-border text-foreground hover:border-primary"
                              }`}
                          >
                            <span className="flex items-center gap-2">
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-accent" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                              {lesson.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{lesson.category}</Badge>
                              <span className="ml-2">{lesson.xp_reward} XP</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!hasLessons && isUnlocked && (
                    <p className="text-xs text-muted-foreground italic">Lessons coming soon</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Path;
