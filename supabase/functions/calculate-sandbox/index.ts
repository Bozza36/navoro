import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

interface SandboxInput {
  lesson_id: string;
  sliders: Record<string, number>; // e.g. { budget: 70, time: 50, quality: 80 }
}

interface SliderConfig {
  name: string;
  label: string;
  min: number;
  max: number;
  optimal: number;
  weight: number;
}

interface SandboxContent {
  scenario: string;
  diagram_label: string;
  sandbox_type: "single_variable" | "multi_variable" | "time_risk" | "system_strategy";
  sliders: SliderConfig[];
  outcome_text: Record<string, string>; // grade -> narrative
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lesson_id, sliders }: SandboxInput = await req.json();

    // Fetch lesson
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lesson_id)
      .single();

    if (lessonError || !lesson) {
      return new Response(JSON.stringify({ error: "Lesson not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = lesson.content as unknown as SandboxContent;
    const sliderConfigs = content.sliders || [];

    // Calculate score based on distance from optimal values
    let totalScore = 0;
    let totalWeight = 0;

    for (const config of sliderConfigs) {
      const value = sliders[config.name] ?? 50;
      const distance = Math.abs(value - config.optimal);
      const maxDistance = config.max - config.min;
      const normalizedScore = Math.max(0, 1 - distance / maxDistance) * 100;
      totalScore += normalizedScore * config.weight;
      totalWeight += config.weight;
    }

    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;

    // Determine grade
    let grade: string;
    if (finalScore >= 85) grade = "excellent";
    else if (finalScore >= 65) grade = "good";
    else if (finalScore >= 40) grade = "fair";
    else grade = "poor";

    // Calculate XP
    const xpMultiplier = finalScore / 100;
    const xpEarned = Math.max(
      Math.floor(lesson.xp_reward * 0.25),
      Math.round(lesson.xp_reward * xpMultiplier)
    );

    const outcomeNarrative = content.outcome_text?.[grade] || 
      `Your decision scored ${finalScore}/100. ${grade === "excellent" ? "Outstanding work!" : grade === "good" ? "Solid decision-making." : grade === "fair" ? "Room for improvement." : "Consider revisiting your approach."}`;

    // Save progress
    await supabase.from("user_lesson_progress").upsert({
      user_id: user.id,
      lesson_id,
      completed: true,
      selected_choice: finalScore,
      xp_earned: xpEarned,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,lesson_id" });

    // Update profile
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

      const newXp = profile.total_xp + xpEarned;
      const levels = ["Explorer", "Apprentice", "Practitioner", "Specialist", "Professional", "Expert", "Leader"];
      const newLevelIndex = Math.min(Math.floor(newXp / 200), 6);

      await supabase.from("profiles").update({
        total_xp: newXp,
        streak_count: newStreak,
        last_lesson_date: today,
        current_level: levels[newLevelIndex],
      }).eq("user_id", user.id);
    }

    return new Response(JSON.stringify({
      score: finalScore,
      grade,
      xp_earned: xpEarned,
      narrative: outcomeNarrative,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
