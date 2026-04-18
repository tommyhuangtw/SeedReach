const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface ExtractedInfo {
  lineId: string | null;
  email: string | null;
  phone: string | null;
  categories: string[];
  contentType: string | null;
  collaboration: string | null;
}

/**
 * Use a fast LLM to extract structured contact info and insights from
 * an Instagram KOL's biography text.
 *
 * Batches multiple bios in a single call for efficiency.
 */
export async function extractInfoFromBios(
  profiles: { username: string; biography: string; externalUrl: string }[]
): Promise<Map<string, ExtractedInfo>> {
  const result = new Map<string, ExtractedInfo>();

  if (!OPENROUTER_API_KEY || profiles.length === 0) {
    return result;
  }

  // Filter out profiles with empty bios
  const withBios = profiles.filter((p) => p.biography.trim().length > 0);
  if (withBios.length === 0) return result;

  // Batch into groups of 15 to keep prompt size manageable
  const batchSize = 15;
  for (let i = 0; i < withBios.length; i += batchSize) {
    const batch = withBios.slice(i, i + batchSize);
    const batchResult = await extractBatch(batch);
    for (const [key, value] of batchResult) {
      result.set(key, value);
    }
  }

  return result;
}

async function extractBatch(
  profiles: { username: string; biography: string; externalUrl: string }[]
): Promise<Map<string, ExtractedInfo>> {
  const result = new Map<string, ExtractedInfo>();

  const profileTexts = profiles
    .map(
      (p, i) =>
        `[${i + 1}] @${p.username}\nBio: ${p.biography}${p.externalUrl ? `\nLink: ${p.externalUrl}` : ""}`
    )
    .join("\n\n");

  const prompt = `You are analyzing Instagram KOL (influencer) bios. Extract structured info from each profile.

For each profile, extract:
1. **lineId**: LINE ID if mentioned (patterns: LINE:xxx, LINE ID:xxx, Line @xxx, 加LINE, 官方LINE, etc.). Return null if not found.
2. **email**: Email address if mentioned in bio text. Return null if not found.
3. **phone**: Phone number if mentioned (Taiwan format: 09xx-xxx-xxx or similar). Return null if not found.
4. **categories**: Content categories/niches (e.g. ["母嬰","育兒"], ["健康","營養"], ["美妝","保養"], ["健身","運動"], ["美食","料理"]). Infer from bio content. Max 3 categories.
5. **contentType**: What type of content creator (e.g. "部落客", "營養師", "醫師", "健身教練", "媽媽KOL", "美妝師"). Return null if unclear.
6. **collaboration**: Any collaboration/business inquiry info mentioned (e.g. "合作請私訊", "業配洽談信箱", "邀約請email"). Return null if not mentioned.

IMPORTANT: Be careful with LINE IDs - they often appear as @xxx or after LINE/line keywords. Don't confuse Instagram handles with LINE IDs.

Profiles:
${profileTexts}

Respond ONLY with a JSON array (no markdown, no code fences) where each element has:
{"username":"...","lineId":"...","email":"...","phone":"...","categories":[...],"contentType":"...","collaboration":"..."}

Use null for missing values. Array order must match profile order.`;

  const maxRetries = 2;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-lite-preview",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
          max_tokens: 4000,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`OpenRouter API error (attempt ${attempt}/${maxRetries}):`, res.status, errText);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        return result;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        return result;
      }

      // Parse JSON - handle potential markdown fences
      const jsonStr = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(jsonStr) as Array<{
        username: string;
        lineId: string | null;
        email: string | null;
        phone: string | null;
        categories: string[];
        contentType: string | null;
        collaboration: string | null;
      }>;

      for (const item of parsed) {
        result.set(item.username, {
          lineId: item.lineId || null,
          email: item.email || null,
          phone: item.phone || null,
          categories: item.categories || [],
          contentType: item.contentType || null,
          collaboration: item.collaboration || null,
        });
      }
      break; // Success, exit retry loop
    } catch (error) {
      console.error(`LLM extraction error (attempt ${attempt}/${maxRetries}):`, error);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
    }
  }

  return result;
}
