import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, TrendingUp, DollarSign } from "lucide-react";

interface DisciplineInfo {
  id: string;
  name: string;
  salary: string;
  growth: string;
  display_order: number;
}

interface PathGroup {
  key: string;
  label: string;
  description: string;
  icon: string;
  display_order: number;
  disciplines: DisciplineInfo[];
}

const Careers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { group } = useParams();
  const [pathGroups, setPathGroups] = useState<PathGroup[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadGroupsAndDisciplines = async () => {
      const [{ data: groupRows }, { data: discRows }] = await Promise.all([
        supabase
          .from("path_groups" as any)
          .select("key, label, description, icon, display_order")
          .order("display_order", { ascending: true }),
        supabase
          .from("path_disciplines" as any)
          .select("id, group_key, name, salary, growth, display_order")
          .order("display_order", { ascending: true }),
      ]);

      const groups: PathGroup[] = ((groupRows as any[]) ?? []).map((g) => ({
        key: g.key,
        label: g.label,
        description: g.description,
        icon: g.icon,
        display_order: g.display_order,
        disciplines: ((discRows as any[]) ?? [])
          .filter((d) => d.group_key === g.key)
          .map((d) => ({
            id: d.id,
            name: d.name,
            salary: d.salary,
            growth: d.growth,
            display_order: d.display_order,
          })),
      }));

      setPathGroups(groups);
      setDataLoading(false);
    };

    loadGroupsAndDisciplines();
  }, []);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // ---- Discipline detail view ----
  if (group) {
    const pathGroup = pathGroups.find((g) => g.key === group);
    if (!pathGroup) {
      return (
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container py-16 text-center">
            <p className="text-muted-foreground">Path group not found.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/careers")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Careers
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8 max-w-4xl">
          <Button variant="ghost" size="sm" onClick={() => navigate("/careers")} className="mb-6 gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Careers
          </Button>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-wide text-foreground flex items-center gap-3">
              <span className="text-3xl">{pathGroup.icon}</span> {pathGroup.label}
            </h1>
            <p className="text-muted-foreground mt-2">{pathGroup.description}</p>
          </div>

          {pathGroup.disciplines.length === 0 ? (
            <p className="text-muted-foreground italic">No disciplines yet — add one in Supabase.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pathGroup.disciplines.map((discipline) => (
                <button
                  key={discipline.id}
                  onClick={() => navigate(`/path?category=${encodeURIComponent(discipline.name)}`)}
                  className="rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-accent/40 group"
                  style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}
                >
                  <h3 className="font-bold text-foreground text-lg mb-1 tracking-wide group-hover:text-accent transition-colors">
                    {discipline.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Explore scenarios and progress through 7 career levels.
                  </p>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs font-medium text-secondary">
                        <DollarSign className="h-3 w-3" /> Avg. {discipline.salary}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium text-secondary">
                        <TrendingUp className="h-3 w-3" /> {discipline.growth} Growth
                      </span>
                    </div>
                    <span className="flex items-center text-xs text-accent font-medium gap-1">
                      Enter <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ---- Main careers hub ----
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-5xl">
        <h1 className="text-3xl font-bold tracking-wide text-foreground mb-2">Careers</h1>
        <p className="text-muted-foreground mb-8">Choose a field, then dive into a discipline.</p>

        {pathGroups.length === 0 ? (
          <p className="text-muted-foreground italic">No career groups yet — add one in Supabase.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pathGroups.map((g) => {
              const topSalary = g.disciplines.reduce((max, d) => {
                const val = parseInt(d.salary.replace(/\D/g, ""));
                return val > max ? val : max;
              }, 0);
              const topGrowth = g.disciplines.reduce((max, d) => {
                const val = parseInt(d.growth.replace(/\D/g, ""));
                return val > max ? val : max;
              }, 0);

              return (
                <button
                  key={g.key}
                  onClick={() => navigate(`/careers/${g.key}`)}
                  className="rounded-xl border border-border bg-card text-left transition-all hover:border-accent/40 group overflow-hidden"
                  style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}
                >
                  <div className="p-8 pb-5">
                    <span className="text-4xl mb-4 block">{g.icon}</span>
                    <h3 className="font-bold text-foreground text-xl mb-2 tracking-wide group-hover:text-accent transition-colors">
                      {g.label}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{g.description}</p>
                  </div>
                  <div className="px-8 py-3 border-t border-border bg-card/50 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs font-medium text-secondary">
                      <DollarSign className="h-3 w-3" /> Up to ${topSalary}k
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-secondary">
                      <TrendingUp className="h-3 w-3" /> +{topGrowth}% Growth
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Careers;

