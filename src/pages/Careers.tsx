import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, TrendingUp, DollarSign } from "lucide-react";

interface DisciplineInfo {
  name: string;
  salary: string;
  growth: string;
}

const PATH_GROUPS = [
  {
    key: "Engineering",
    label: "Engineering",
    description: "Design, build, and innovate across hardware and infrastructure.",
    icon: "🔧",
    disciplines: [
      { name: "Mechanical", salary: "$95k", growth: "+9%" },
      { name: "Biomedical", salary: "$98k", growth: "+10%" },
      { name: "Civil", salary: "$89k", growth: "+7%" },
      { name: "Aerospace", salary: "$122k", growth: "+6%" },
    ] as DisciplineInfo[],
  },
  {
    key: "Healthcare",
    label: "Healthcare",
    description: "Practice medicine, research, and health systems at scale.",
    icon: "🏥",
    disciplines: [
      { name: "Surgical Residency", salary: "$130k", growth: "+4%" },
      { name: "Medical Research", salary: "$105k", growth: "+17%" },
      { name: "Health Informatics", salary: "$102k", growth: "+22%" },
    ] as DisciplineInfo[],
  },
  {
    key: "Business & Tech",
    label: "Business & Tech",
    description: "Lead products, navigate AI ethics, and shape corporate strategy.",
    icon: "💼",
    disciplines: [
      { name: "Product Management", salary: "$140k", growth: "+12%" },
      { name: "AI Ethics", salary: "$115k", growth: "+25%" },
      { name: "Corporate Law", salary: "$160k", growth: "+5%" },
    ] as DisciplineInfo[],
  },
];

const Careers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { group } = useParams();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);



  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Discipline detail view
  if (group) {
    const pathGroup = PATH_GROUPS.find((g) => g.key === group);
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pathGroup.disciplines.map((discipline) => (
              <button
                key={discipline.name}
                onClick={() => navigate(`/path?category=${encodeURIComponent(discipline.name)}`)}
                className="rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-accent/40 group"
                style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}
              >
                <h3 className="font-bold text-foreground text-lg mb-1 tracking-wide group-hover:text-accent transition-colors">{discipline.name}</h3>
                <p className="text-sm text-muted-foreground">Explore scenarios and progress through 7 career levels.</p>
                {/* Salary & Growth Ticker */}
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
        </main>
      </div>
    );
  }

  // Main Careers hub
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-5xl">
        <h1 className="text-3xl font-bold tracking-wide text-foreground mb-2">Careers</h1>
        <p className="text-muted-foreground mb-8">Choose a field, then dive into a discipline.</p>

        {/* Career Path Groups */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PATH_GROUPS.map((group) => {
            const topSalary = group.disciplines.reduce((max, d) => {
              const val = parseInt(d.salary.replace(/\D/g, ""));
              return val > max ? val : max;
            }, 0);
            const topGrowth = group.disciplines.reduce((max, d) => {
              const val = parseInt(d.growth.replace(/\D/g, ""));
              return val > max ? val : max;
            }, 0);

            return (
              <button
                key={group.key}
                onClick={() => navigate(`/careers/${group.key}`)}
                className="rounded-xl border border-border bg-card text-left transition-all hover:border-accent/40 group overflow-hidden"
                style={{ boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.3)" }}
              >
                <div className="p-8 pb-5">
                  <span className="text-4xl mb-4 block">{group.icon}</span>
                  <h3 className="font-bold text-foreground text-xl mb-2 tracking-wide group-hover:text-accent transition-colors">
                    {group.label}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{group.description}</p>
                </div>
                {/* Salary & Growth Ticker Footer */}
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
      </main>
    </div>
  );
};

export default Careers;
