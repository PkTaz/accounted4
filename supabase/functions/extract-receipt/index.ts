import { encodeBase64 as toBase64 } from "jsr:@std/encoding@1/base64";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const APPROVED_CATEGORIES = [
  "Supplies",
  "Meals",
  "Utilities",
  "Equipment",
  "Software",
  "Fuel",
  "Repairs",
  "Other",
] as const;

const EXTRACTION_PROMPT = `You extract data from receipt images for a small business tax app.

Return ONLY valid JSON with this exact shape (no markdown, no extra keys):
{
  "vendor": string | null,
  "receipt_date": "YYYY-MM-DD" | null,
  "total": number | null,
  "category": string | null,
  "notes": string | null,
  "ai_confidence": number
}

Rules:
- Do not guess unreadable values — use null when unsure.
- total must be the final receipt total as a number (no currency symbols).
- category must be exactly one of: ${APPROVED_CATEGORIES.join(", ")} — or null if unsure.
- notes: brief description of the purchase, or null.
- ai_confidence: 0 to 1 reflecting how confident you are in the overall extraction.
- receipt_date must be YYYY-MM-DD or null.`;

type AiExtraction = {
  vendor: string | null;
  receipt_date: string | null;
  total: number | null;
  category: string | null;
  notes: string | null;
  ai_confidence: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return toBase64(new Uint8Array(buffer));
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00"));
}

function validateExtraction(raw: unknown): AiExtraction {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI returned invalid JSON structure.");
  }

  const obj = raw as Record<string, unknown>;

  const vendor = obj.vendor === null || typeof obj.vendor === "string" ? obj.vendor : null;
  const receipt_date =
    obj.receipt_date === null || typeof obj.receipt_date === "string" ? obj.receipt_date : null;
  const total = typeof obj.total === "number" && Number.isFinite(obj.total) ? obj.total : null;
  const notes = obj.notes === null || typeof obj.notes === "string" ? obj.notes : null;

  let category: string | null =
    obj.category === null || typeof obj.category === "string" ? obj.category : null;
  if (category && !APPROVED_CATEGORIES.includes(category as (typeof APPROVED_CATEGORIES)[number])) {
    category = null;
  }

  let ai_confidence = typeof obj.ai_confidence === "number" ? obj.ai_confidence : 0;
  if (!Number.isFinite(ai_confidence)) ai_confidence = 0;
  ai_confidence = Math.min(1, Math.max(0, ai_confidence));

  if (receipt_date && !isValidDate(receipt_date)) {
    throw new Error("AI returned an invalid receipt_date.");
  }

  if (total !== null && total < 0) {
    throw new Error("AI returned an invalid total.");
  }

  return { vendor, receipt_date, total, category, notes, ai_confidence };
}

function parseOpenAiContent(content: string): AiExtraction {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI response was not valid JSON.");
  }
  return validateExtraction(parsed);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !openaiKey) {
      return jsonResponse({ error: "Server configuration error." }, 500);
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser(jwt);

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const body = await req.json();
    const image_path = body?.image_path;

    if (typeof image_path !== "string" || !image_path.trim()) {
      return jsonResponse({ error: "image_path is required." }, 400);
    }

    if (!image_path.startsWith(`${user.id}/`)) {
      return jsonResponse({ error: "You can only access your own receipt images." }, 403);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("receipt-images")
      .download(image_path);

    if (downloadError || !fileData) {
      return jsonResponse({ error: "Could not load receipt image." }, 404);
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    const mimeType = image_path.endsWith(".png") ? "image/png" : "image/jpeg";

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACTION_PROMPT },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI error:", errText);
      let detail = "AI service failed.";
      try {
        const parsed = JSON.parse(errText);
        detail = parsed?.error?.message ?? detail;
      } catch {
        // keep default
      }
      return jsonResponse(
        { error: `OpenAI error: ${detail}. Check API key and billing.` },
        502
      );
    }

    const openaiJson = await openaiResponse.json();
    const content = openaiJson?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return jsonResponse({ error: "AI returned an empty response." }, 502);
    }

    const extraction = parseOpenAiContent(content);
    return jsonResponse(extraction);
  } catch (err) {
    console.error("extract-receipt error:", err);
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return jsonResponse({ error: message }, 400);
  }
});
