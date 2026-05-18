import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass } from "lucide-react";

const LEVEL_NAMES = ["Explorer", "Practitioner", "Contributor", "Specialist", "Leader"];

interface PathData {
  category: string;
  totalLessons: number;
  completedLessons: number;
  currentLevel: number; // 1-5
  currentStageTitle: string;
  continueLessonId: string | null;
}

const ProgressRing = ({ pct }: { pct: number }) => {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
      <circle cx="44" cy="44" r={r} stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
      <circle
        cx="44"
        cy="44"
        r={r}
        stroke="hsl(150 40% 81%)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 700ms ease-out" }}
      />
      <text
        x="44"
        y="44"
        textAnchor="middle"
        dominantBaseline="central"
        transform="rotate(90 44 44)"
        className="fill-foreground text-base font-bold"
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
};

const LevelPips = ({ current }: { current: number }) => (
  <div className="flex items-center gap-1.5 mt-3">
    {[1, 2, 3, 4, 5].map((n) => {
      const filled =
        n < current
          ? "bg-accent border-accent"
          : n === current
            ? "border-secondary"
          : "border-muted bg-transparent";
      const inner = n === current ? <span className="block h-2 w-2 rounded-full bg-secondary" /> : null;
      return (
        <div
          key={n}
          className={`h-3 w-3 rounded-full border-2 flex items-center justify-center ${filled}`}
        >
          {inner}
        </div>
      );
    })}
  </div>
);

const ActivePathsSection = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const [paths, setPaths] = useState<PathData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: progress } = await supabase
        .from("user_lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", userId);

      const completedIds = new Set(
        (progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id),
      );
      const touchedIds = new Set((progress ?? []).map((p) => p.lesson_id));

      if (touchedIds.size === 0) {
        setPaths([]);
        setLoading(false);
        return;
      }

      const { data: touchedLessons } = await supabase
        .from("lessons")
        .select("category")
        .in("id", Array.from(touchedIds));

      const activeCategories = Array.from(
        new Set((touchedLessons ?? []).map((l) => l.category)),
      );

      if (activeCategories.length === 0) {
        setPaths([]);
        setLoading(false);
        return;
      }

      const { data: allLessons } = await supabase
        .from("lessons")
        .select("id, title, category, level, order_index")
        .in("category", activeCategories)
        .order("level", { ascending: true })
        .order("order_index", { ascending: true });

      const grouped: Record<string, typeof allLessons> = {};
      (allLessons ?? []).forEach((l) => {
        (grouped[l.category] ||= []).push(l);
      });

      const result: PathData[] = activeCategories.map((cat) => {
        const lessons = grouped[cat] ?? [];
        const completed = lessons.filter((l) => completedIds.has(l.id));
        const next =
          lessons.find((l) => !completedIds.has(l.id)) ?? lessons[lessons.length - 1];
        const currentLevel = Math.min(Math.max(next?.level ?? 1, 1), 5);
        return {
          category: cat,
          totalLessons: lessons.length,
          completedLessons: completed.length,
          currentLevel,
          currentStageTitle: next?.title ?? "Path complete",
          continueLessonId: next?.id ?? null,
        };
      });

      setPaths(result);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) return null;

  return (
    <section>
      <h2 className="text-lg font-bold tracking-wide text-foreground mb-3">Your Active Paths</h2>
      {paths.length === 0 ? (
        <Card className="border-dashed border-border bg-card">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-secondary/15 flex items-center justify-center">
              <Compass className="h-6 w-6 text-secondary" />
            </div>
            <p className="font-bold text-foreground mb-1">Start your first career simulation</p>
            <p className="text-sm text-muted-foreground mb-4">
              Pick a discipline and step into your first workplace scenario.
            </p>
            <Button onClick={() => navigate("/careers")} style={{ background: "#064635", color: "#FAF9F6" }}>
              Browse paths <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paths.map((p) => {
            const pct = p.totalLessons === 0 ? 0 : (p.completedLessons / p.totalLessons) * 100;
            const levelName = LEVEL_NAMES[p.currentLevel - 1] ?? "Explorer";
            return (
              <Card key={p.category} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <ProgressRing pct={pct} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground tracking-wide truncate">{p.category}</h3>
                      <p className="text-xs text-accent font-medium mt-0.5">
                        Level {p.currentLevel} — {levelName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        Current: <span className="text-foreground">{p.currentStageTitle}</span>
                      </p>
                      <LevelPips current={p.currentLevel} />
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4"
                    style={{ background: "#064635", color: "#FAF9F6" }}
                    onClick={() =>
                      p.continueLessonId
                        ? navigate(`/lesson/${p.continueLessonId}`)
                        : navigate(`/path?category=${encodeURIComponent(p.category)}`)
                    }
                  >
                    Continue <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ActivePathsSection;
