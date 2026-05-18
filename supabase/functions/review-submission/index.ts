// AI-powered submission review for Navoro task stages.
// Returns a structured Performance Review with pass/needs-revision verdict,
// numeric score, and 3-5 feedback bullets.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReviewRequest {
  taskType: "document" | "briefing" | "meeting" | "lab" | "decision";
  taskTitle: string;
  scenario: string;
  reviewer?: string;
  rubric?: string[];
  submission: string; // user's free-text or serialized payload
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ReviewRequest;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const reviewer = body.reviewer ?? "Sarah Jenkins (Senior R&D)";
    const rubric =
      body.rubric?.length
        ? body.rubric
        : ["Technical accuracy", "Risk awareness", "Clarity", "Standards alignment"];

    const systemPrompt = `You are ${reviewer}, a senior engineering colleague at a medical-device company. \
You give crisp, professional Performance Reviews on a junior engineer's work. \
Tone: warm, direct, mentor-like. No fluff. Cite specifics from the submission. \
You MUST call the submit_review tool with your verdict — never reply in plain text.`;

    const userPrompt = `TASK (${body.taskType.toUpperCase()}): ${body.taskTitle}

SCENARIO BRIEFING:
${body.scenario}

RUBRIC: ${rubric.join(" | ")}

JUNIOR ENGINEER'S SUBMISSION:
"""
${body.submission}
"""

Score 0-100. Verdict "pass" if >= 70, otherwise "needs_revision". Write 3-5 short bullet items: each one specific, actionable, and grounded in their submission.`;

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "submit_review",
                description: "Submit the structured performance review.",
                parameters: {
                  type: "object",
                  properties: {
                    verdict: { type: "string", enum: ["pass", "needs_revision"] },
                    score: { type: "integer", minimum: 0, maximum: 100 },
                    headline: { type: "string", description: "One-sentence summary." },
                    feedback: {
                      type: "array",
                      minItems: 3,
                      maxItems: 5,
                      items: {
                        type: "object",
                        properties: {
                          kind: { type: "string", enum: ["strength", "issue", "suggestion"] },
                          text: { type: "string" },
                        },
                        required: ["kind", "text"],
                      },
                    },
                  },
                  required: ["verdict", "score", "headline", "feedback"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "submit_review" } },
        }),
      },
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Top up your workspace to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI review failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("AI did not return a structured review");
    const review = JSON.parse(call.function.arguments);

    return new Response(
      JSON.stringify({ ...review, reviewer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("review-submission error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
