import type { Handler } from "@netlify/functions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(statusCode: number, body: Record<string, unknown>) {
  const bodyStr = JSON.stringify(body);
  console.log(`[generate-story] Responding ${statusCode}:`, bodyStr.slice(0, 300));
  return {
    statusCode,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: bodyStr,
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    console.log("[generate-story] Received request, body length:", (event.body || "").length);

    let prompt: string | undefined;
    try {
      const parsed = JSON.parse(event.body || "{}");
      prompt = parsed?.prompt;
    } catch (parseErr) {
      console.error("[generate-story] Failed to parse request body:", parseErr);
      return jsonResponse(400, { error: "Invalid JSON in request body" });
    }

    if (!prompt) {
      console.error("[generate-story] Missing prompt in request body");
      return jsonResponse(400, { error: "Missing prompt" });
    }

    const apiKey = process.env["GEMINI_API_KEY"];
    console.log("[generate-story] GEMINI_API_KEY present:", !!apiKey, "length:", apiKey?.length ?? 0);

    if (!apiKey) {
      console.error("[generate-story] GEMINI_API_KEY is not set");
      return jsonResponse(500, {
        error: "GEMINI_API_KEY not configured — set it in Netlify Site Settings > Environment Variables and redeploy.",
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    console.log("[generate-story] Calling Gemini API, prompt length:", prompt.length);

    let geminiRes: Response;
    try {
      geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 800,
          },
        }),
      });
    } catch (fetchErr) {
      console.error("[generate-story] fetch() to Gemini failed:", fetchErr);
      return jsonResponse(502, {
        error: `Network error reaching Gemini API: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`,
      });
    }

    console.log("[generate-story] Gemini HTTP status:", geminiRes.status);

    const rawText = await geminiRes.text();
    console.log("[generate-story] Gemini raw response length:", rawText.length);
    console.log("[generate-story] Gemini raw response (first 500 chars):", rawText.slice(0, 500));

    if (!geminiRes.ok) {
      let geminiMessage = `Gemini returned HTTP ${geminiRes.status}`;
      try {
        const parsed = JSON.parse(rawText);
        if (parsed?.error?.message) geminiMessage = parsed.error.message;
        else if (parsed?.error?.status) geminiMessage = `${parsed.error.status}: ${geminiMessage}`;
      } catch {
        geminiMessage = rawText.slice(0, 300) || geminiMessage;
      }
      console.error("[generate-story] Gemini error:", geminiMessage);
      return jsonResponse(502, { error: `Gemini API error: ${geminiMessage}` });
    }

    let geminiData: Record<string, unknown>;
    try {
      geminiData = JSON.parse(rawText);
    } catch (jsonErr) {
      console.error("[generate-story] Failed to parse Gemini JSON response:", jsonErr);
      return jsonResponse(502, {
        error: `Gemini returned non-JSON response: ${rawText.slice(0, 200)}`,
      });
    }

    console.log("[generate-story] Gemini response top-level keys:", Object.keys(geminiData));

    const candidates = geminiData?.candidates as Array<Record<string, unknown>> | undefined;
    const story = (candidates?.[0]?.content as Record<string, unknown> | undefined)
      ?.parts as Array<Record<string, unknown>> | undefined;
    const storyText = (story?.[0]?.text as string) || "";

    console.log("[generate-story] Extracted story length:", storyText.length);

    if (!storyText) {
      console.error("[generate-story] Empty story — full Gemini response:", JSON.stringify(geminiData));
      const finishReason = (candidates?.[0]?.finishReason as string) || "unknown";
      return jsonResponse(502, {
        error: `Gemini returned no content (finishReason: ${finishReason}). The content may have been filtered.`,
      });
    }

    return jsonResponse(200, { story: storyText });
  } catch (err) {
    console.error("[generate-story] Unhandled exception:", err);
    return jsonResponse(500, {
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
};
