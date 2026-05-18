import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import GraphicPlaceholder from "@/components/GraphicPlaceholder";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Layers, Heart, Briefcase } from "lucide-react";

const PATH_GROUPS = [
  {
    slug: "engineering",
    name: "Engineering",
    description: "Design, build, and innovate across core engineering disciplines.",
    categories: ["Mechanical", "Biomedical", "Civil", "Aerospace"],
    icon: Layers,
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    description: "Navigate clinical, research, and informatics career paths.",
    categories: ["Surgical Residency", "Medical Research", "Health Informatics"],
    icon: Heart,
  },
  {
    slug: "business-tech",
    name: "Business & Tech",
    description: "Lead at the intersection of technology, ethics, and strategy.",
    categories: ["Product Management", "AI Ethics", "Corporate Law"],
    icon: Briefcase,
  },
];

const Browse = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { group } = useParams<{ group?: string }>();
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      const { data } = await supabase.from("lessons").select("category");
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((l) => { counts[l.category] = (counts[l.category] || 0) + 1; });
        setLessonCounts(counts);
      }
    };
    fetchCounts();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const activeGroup = group ? PATH_GROUPS.find((g) => g.slug === group) : null;

  // Discipline detail view
  if (activeGroup) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8 max-w-4xl">
          <button
            onClick={() => navigate("/browse")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Learning Paths
          </button>

          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center">
              <activeGroup.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide text-foreground">{activeGroup.name}</h1>
              <p className="text-sm text-muted-foreground">{activeGroup.description}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeGroup.categories.map((cat) => {
              const count = lessonCounts[cat] || 0;
              return (
                <Card
                  key={cat}
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/path?category=${encodeURIComponent(cat)}`)}
                >
                  <GraphicPlaceholder label={cat} className="h-32 rounded-none" />
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground mb-2">{cat}</h3>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {count > 0 ? `${count} lessons` : "Coming soon"}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // Top-level groups view
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-wide text-foreground mb-1">Learning Paths</h1>
        <p className="text-muted-foreground mb-10">Step-by-step paths to mastery</p>

        <div className="space-y-5">
          {PATH_GROUPS.map((g) => {
            const totalLessons = g.categories.reduce((sum, cat) => sum + (lessonCounts[cat] || 0), 0);
            return (
              <Card
                key={g.slug}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate(`/browse/${g.slug}`)}
              >
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-primary flex-shrink-0 flex items-center justify-center">
                    <g.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-foreground mb-0.5">{g.name}</h2>
                    <p className="text-sm text-muted-foreground">{g.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-xs">{g.categories.length} disciplines</Badge>
                      {totalLessons > 0 && (
                        <Badge variant="secondary" className="text-xs">{totalLessons} lessons</Badge>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Browse;
