// src/pages/Profile.tsx
// Adds the DHF Portfolio card to the profile, alongside the existing stats.
// Everything else is unchanged from the previous version.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import LevelBadge from "@/components/LevelBadge";
import DhfPortfolioCard from "@/components/DhfPortfolioCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Crown, LogOut, Star, Zap } from "lucide-react";

const LEVELS = ["Explorer", "Apprentice", "Practitioner", "Specialist", "Professional", "Expert", "Leader"] as const;

const Profile = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) setProfile(data);
      const { count } = await supabase
        .from("user_lesson_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true);
      setCompleted(count ?? 0);
    })();
  }, [user]);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  const levelIndex = LEVELS.indexOf(profile.current_level as typeof LEVELS[number]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-wide text-foreground mb-6">Profile</h1>

        <Card className="mb-6">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center text-3xl font-bold text-accent gold-glow">
              {(profile.display_name || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{profile.display_name || "Anonymous"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-primary text-primary-foreground">{profile.current_level}</Badge>
                {profile.is_pro && <Badge className="bg-accent text-accent-foreground"><Crown className="h-3 w-3 mr-1" />Pro</Badge>}
              </div>
            </div>
            <LevelBadge level={levelIndex + 1} size="lg" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-5 text-center">
              <Star className="h-5 w-5 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{profile.total_xp}</p>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Zap className="h-5 w-5 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{profile.streak_count}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Award className="h-5 w-5 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{completed}</p>
              <p className="text-xs text-muted-foreground">Scenarios</p>
            </CardContent>
          </Card>
        </div>

        {/* DHF Portfolio — populated as the user completes Document Builder tasks */}
        <div className="mb-6">
          <DhfPortfolioCard />
        </div>

        {!profile.is_pro && (
          <Card className="border-accent/30 mb-6">
            <CardContent className="p-5 flex items-center gap-4">
              <Crown className="h-8 w-8 text-accent" />
              <div className="flex-1">
                <p className="font-bold text-foreground">Unlock all 5 career levels</p>
                <p className="text-sm text-muted-foreground">Ad-free simulations, all paths, LinkedIn-ready credentials.</p>
              </div>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gold-glow" onClick={() => navigate("/pro")}>
                Go Pro
              </Button>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </main>
    </div>
  );
};

export default Profile;
