import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, Lock, ChevronDown, ChevronRight } from "lucide-react";
import TaskTypeBadge, { inferTaskType } from "./TaskTypeBadge";

interface Props {
  lesson: any;
  userId: string;
}

const LEVEL_NAMES: Record<number, string> = {
  1: "Explorer", 2: "Apprentice", 3: "Practitioner",
  4: "Specialist", 5: "Professional", 6: "Expert", 7: "Leader",
};

const LessonOutlineSidebar = ({ lesson, userId }: Props) => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ [lesson.level]: true });

  useEffect(() => {
    const load = async () => {
      const { data: ls } = await supabase
        .from("lessons")
        .select("id, title, level, order_index, content")
        .eq("category", lesson.category)
        .order("level", { ascending: true })
        .order("order_index", { ascending: true });
      setLessons(ls ?? []);
      const { data: prog } = await supabase
        .from("user_lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("completed", true);
      setCompletedIds(new Set((prog ?? []).map((p) => p.lesson_id)));
    };
    load();
  }, [lesson.category, userId]);

  const byLevel = lessons.reduce<Record<number, any[]>>((acc, l) => {
    (acc[l.level] = acc[l.level] || []).push(l);
    return acc;
  }, {});

  const isPro = false; // gating handled inside Lesson page; here we only mark visually

  return (
    <aside className="rounded-xl border border-border bg-card p-3" style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium px-1 mb-3">
        {lesson.category} Path
      </p>
      <div className="space-y-2">
        {Object.keys(byLevel).map((lvlStr) => {
          const lvl = Number(lvlStr);
          const items = byLevel[lvl];
          const open = expanded[lvl];
          const locked = lvl >= 2;
          return (
            <div key={lvl}>
              <button
                onClick={() => setExpanded((e) => ({ ...e, [lvl]: !e[lvl] }))}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/40 transition-colors"
              >
                <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-foreground">
                  {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  L{lvl} · {LEVEL_NAMES[lvl]}
                </span>
                {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </button>
              {open && (
                <ul className="mt-1 space-y-0.5">
                  {items.map((l) => {
                    const done = completedIds.has(l.id);
                    const active = l.id === lesson.id;
                    const firstStageType = (l.content as any)?.stages?.[0]?.type;
                    return (
                      <li key={l.id}>
                        <button
                          onClick={() => navigate(`/lesson/${l.id}`)}
                          className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-md transition-colors ${
                            active ? "bg-primary/20 border border-primary/40" : "hover:bg-muted/40"
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-secondary flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className={`block text-xs leading-snug ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                              {l.title}
                            </span>
                            <TaskTypeBadge type={inferTaskType(firstStageType)} className="mt-1" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default LessonOutlineSidebar;
