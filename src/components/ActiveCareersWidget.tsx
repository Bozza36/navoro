import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Clock } from "lucide-react";

interface CareerProgress {
  category: string;
  completed: number;
  total: number;
  lastActivity: string | null;
}

const formatRelative = (iso: string | null) => {
  if (!iso) return "No activity yet";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const Ring = ({ percent }: { percent: number }) => {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
      <circle cx="44" cy="44" r={r} stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
      <circle
        cx="44"
        cy="44"
        r={r}
        stroke="hsl(150 40% 81%)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
};

const ActiveCareersWidget = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const [careers, setCareers] = useState<CareerProgress[]>([]);

  useEffect(() => {
    (async () => {
      const { data: progress } = await supabase
        .from("user_lesson_progress")
        .select("lesson_id, completed, completed_at, lessons!inner(category)")
        .eq("user_id", userId)
        .eq("completed", true)
        .order("completed_at", { ascending: false });

      if (!progress || progress.length === 0) { setCareers([]); return; }

      const byCat = new Map<string, { completed: number; lastActivity: string | null }>();
      for (const p of progress as any[]) {
        const cat = p.lessons?.category;
        if (!cat) continue;
        const cur = byCat.get(cat) ?? { completed: 0, lastActivity: null };
        cur.completed += 1;
        if (!cur.lastActivity || (p.completed_at && p.completed_at > cur.lastActivity)) {
          cur.lastActivity = p.completed_at;
        }
        byCat.set(cat, cur);
      }

      const cats = Array.from(byCat.keys());
      const { data: totals } = await supabase
        .from("lessons")
        .select("category")
        .in("category", cats as any);
      const totalByCat = new Map<string, number>();
      for (const t of totals ?? []) {
        totalByCat.set(t.category, (totalByCat.get(t.category) ?? 0) + 1);
      }

      setCareers(Array.from(byCat.entries()).map(([category, v]) => ({
        category,
        completed: v.completed,
        total: totalByCat.get(category) ?? v.completed,
        lastActivity: v.lastActivity,
      })));
    })();
  }, [userId]);

  if (careers.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-secondary" /> Active Careers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {careers.map((c) => {
            const pct = Math.min(100, Math.round((c.completed / Math.max(c.total, 1)) * 100));
            return (
              <button
                key={c.category}
                onClick={() => navigate(`/path?category=${encodeURIComponent(c.category)}`)}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-accent/40"
              >
                <div className="relative h-22 w-22">
                  <Ring percent={pct} />
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                    {pct}%
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground tracking-wide truncate">{c.category}</p>
                  <p className="text-xs text-muted-foreground">{c.completed} of {c.total} stages</p>
                  <p className="flex items-center gap-1 text-xs text-secondary mt-1">
                    <Clock className="h-3 w-3" /> {formatRelative(c.lastActivity)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveCareersWidget;
