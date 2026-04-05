const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const REQUIRED_FIELDS = ["tag", "q", "choices", "correct", "explanation"];

function validateQuestion(q: unknown, index: number): string | null {
  if (typeof q !== "object" || q === null) return `Question ${index} is not an object`;
  const obj = q as Record<string, unknown>;
  for (const field of REQUIRED_FIELDS) {
    if (!(field in obj)) return `Question ${index} missing field "${field}"`;
  }
  if (!Array.isArray(obj.choices) || obj.choices.length !== 4) {
    return `Question ${index} must have exactly 4 choices`;
  }
  if (typeof obj.correct !== "number" || obj.correct < 0 || obj.correct > 3) {
    return `Question ${index} has invalid correct index`;
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topic, notes, mode, difficulty, count } = await req.json();

    if (!mode || !difficulty || !count) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject =
      mode === "topic"
        ? `about: "${topic}"`
        : `based ONLY on this text: "${notes}"`;

    const prompt = `Generate ${count} ${difficulty} multiple-choice quiz questions ${subject}.

Return ONLY a valid JSON array. Each object must have:
- "tag": short emoji + category label (e.g. "⚡ Concept")
- "q": the question string
- "choices": array of exactly 4 answer strings
- "correct": integer index 0–3 of the correct answer
- "explanation": 1–2 sentence explanation of why the correct answer is right

JSON only. No markdown. No preamble.`;

    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `Anthropic API error: ${response.status}`, details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Extract JSON array
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1) {
      return new Response(JSON.stringify({ error: "Failed to parse quiz from AI response", raw: text }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let questions: unknown[];
    try {
      questions = JSON.parse(text.slice(start, end + 1));
    } catch (parseErr) {
      return new Response(JSON.stringify({ error: "Malformed JSON in AI response", raw: text.slice(start, end + 1).substring(0, 500) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return new Response(JSON.stringify({ error: "AI returned empty or non-array response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const err = validateQuestion(questions[i], i);
      if (err) {
        return new Response(JSON.stringify({ error: err }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
