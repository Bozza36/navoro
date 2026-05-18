import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Star, TrendingUp, BookOpen, Zap, Trophy, Crown, Medal } from "lucide-react";
import LevelBadge from "@/components/LevelBadge";
import ActivePathsSection from "@/components/ActivePathsSection";

const LEVELS = ["Explorer", "Apprentice", "Practitioner", "Specialist", "Professional", "Expert", "Leader"] as const;
const XP_PER_LEVEL = 200;
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

interface LeaderboardEntry {
  display_name: string | null;
  total_xp: number;
  current_level: string;
  user_id: string;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    total_xp: number;
    streak_count: number;
    current_level: string;
    display_name: string | null;
    is_pro: boolean;
    last_lesson_date: string | null;
  } | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("total_xp, streak_count, current_level, display_name, is_pro, last_lesson_date")
        .eq("user_id", user.id)
        .single();
      if (profileData) setProfile(profileData);

      const { count: completed } = await supabase
        .from("user_lesson_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true);
      setCompletedCount(completed ?? 0);

      const { data: lb } = await supabase
        .from("profiles")
        .select("display_name, total_xp, current_level, user_id")
        .order("total_xp", { ascending: false })
        .limit(10);
      if (lb) setLeaderboard(lb);
    };
    fetchData();
  }, [user]);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center text-muted-foreground">Loading your path...</div>
      </div>
    );
  }

  const levelIndex = LEVELS.indexOf(profile.current_level as typeof LEVELS[number]);
  const xpInCurrentLevel = profile.total_xp % XP_PER_LEVEL;
  const levelProgress = (xpInCurrentLevel / XP_PER_LEVEL) * 100;

  const today = new Date();
  const dayOfWeek = today.getDay();
  const streakDays = new Set<number>();
  for (let i = 0; i < Math.min(profile.streak_count, 7); i++) {
    streakDays.add((7 + dayOfWeek - i) % 7);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-wide text-foreground">
            Welcome back, {profile.display_name || "Explorer"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Your next step is ready.</p>
        </div>

        {/* Active Paths — directly under hero */}
        <div className="mb-8">
          <ActivePathsSection userId={user!.id} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Streak Beacon */}
            <Card className="border-accent/20 gold-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center gold-glow">
                      <Zap className="h-7 w-7 text-accent" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{profile.streak_count}</p>
                      <p className="text-sm text-muted-foreground">day streak</p>
                    </div>
                  </div>
                  <Flame className="h-6 w-6 text-accent animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  {DAYS.map((day, i) => {
                    const dayIndex = i === 6 ? 0 : i + 1;
                    const active = streakDays.has(dayIndex);
                    return (
                      <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                          active
                            ? "bg-accent text-accent-foreground gold-glow"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <Zap className="h-4 w-4" />
                        </div>
                        <span className="text-xs text-muted-foreground">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-5 text-center">
                  <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Star className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{profile.total_xp}</p>
                  <p className="text-xs text-muted-foreground">Path XP</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 text-center">
                  <div className="mx-auto mb-2">
                    <LevelBadge level={levelIndex + 1} size="sm" />
                  </div>
                  <Badge className="bg-primary text-primary-foreground text-xs">{profile.current_level}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">Level {levelIndex + 1}/{LEVELS.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 text-center">
                  <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-secondary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
            </div>

            {/* Level Progress - Mint Green */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Level Progress</span>
                  <span className="text-xs text-muted-foreground">{xpInCurrentLevel}/{XP_PER_LEVEL} XP</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${levelProgress}%`,
                      background: "hsl(150 40% 81%)",
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pro Upsell */}
            {!profile.is_pro && (
              <Card className="border-accent/30 overflow-hidden">
                <CardContent className="p-5 flex items-center gap-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-accent/10" />
                  <Crown className="h-8 w-8 text-accent flex-shrink-0 relative z-10" />
                  <div className="flex-1 relative z-10">
                    <p className="font-bold text-foreground">Unlock all paths with Pro</p>
                    <p className="text-sm text-muted-foreground">Ad-free learning, all levels, LinkedIn certificates</p>
                  </div>
                  <Button
                    className="bg-accent text-accent-foreground hover:bg-accent/90 relative z-10 gold-glow"
                    onClick={() => navigate("/pro")}
                  >
                    Go Pro
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button size="lg" onClick={() => navigate("/path")} className="flex-1">
                Continue your path
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/careers")} className="flex-1">
                Explore careers
              </Button>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-accent" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No learners yet</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, i) => {
                      const isCurrentUser = entry.user_id === user?.id;
                      return (
                        <div
                          key={entry.user_id}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                            isCurrentUser ? "bg-accent/10 border border-accent/20" : ""
                          }`}
                        >
                          <span className={`text-sm font-bold w-5 text-center ${
                            i === 0 ? "text-accent" : "text-muted-foreground"
                          }`}>
                            {i + 1}
                          </span>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                          }`}>
                            {(entry.display_name || "?")[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {entry.display_name || "Anonymous"}
                              {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{entry.total_xp} XP</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
