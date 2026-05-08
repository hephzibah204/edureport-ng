import { loadConfig } from "../config.js";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};

export async function generateJson<T>(params: {
  system: string;
  prompt: string;
}): Promise<T> {
  const cfg = loadConfig();
  if (!cfg.AI_ENABLED) throw new Error("AI is disabled");
  if (!cfg.AI_API_KEY) throw new Error("AI_API_KEY is not configured");

  const url = cfg.AI_BASE_URL.replace(/\/$/, "") + "/chat/completions";
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), cfg.AI_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: cfg.AI_MODEL,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.prompt }
        ]
      })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI request failed: ${res.status} ${text}`.slice(0, 400));
    }
    const data = (await res.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI response was empty");
    return JSON.parse(content) as T;
  } finally {
    clearTimeout(to);
  }
}

