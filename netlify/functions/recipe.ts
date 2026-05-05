/**
 * GUSTO Netlify Function — proxyt Rezept-Anfragen an einen
 * OpenAI-kompatiblen LLM-Provider, mit automatischem Fallback auf einen
 * zweiten Provider falls der erste fehlschlaegt (Rate Limit, Outage, …).
 *
 * Primary:  LLM_API_KEY  + LLM_API_URL  + LLM_MODEL
 * Fallback: LLM_FALLBACK_API_KEY + LLM_FALLBACK_API_URL + LLM_FALLBACK_MODEL
 *
 * Der API-Key bleibt server-side in Netlify Environment Variables und
 * wird nie an den Browser ausgeliefert.
 *
 * Erreichbar unter: /api/recipe (per Redirect aus netlify.toml).
 */

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  category: string;
}

interface ShoppingListData {
  dishName: string;
  servings: number;
  ingredients: Ingredient[];
  notes?: string;
}

interface ProviderConfig {
  label: string;
  url: string;
  apiKey: string;
  model: string;
}

const SYSTEM_PROMPT = `Du bist GUSTO, ein hochmoderner Kulinarik-Experte.
Deine Mission: Erstelle extrem präzise Einkaufslisten.
REGELN:
1. Kategorisiere nach Supermarkt-Logik (z.B. 'Gemüse & Kräuter', 'Fleisch & Fisch', 'Milchprodukte', 'Gewürze & Öle').
2. Berechne Mengen exakt für die angegebene Personenzahl.
3. Gib einen kurzen 'Gusto-Tipp' (max 20 Wörter) zur Qualität der Zutaten oder Zubereitung im Feld "notes".
4. Antworte ausschließlich mit gültigem JSON auf Deutsch nach folgendem Schema:
{
  "dishName": string,
  "servings": number,
  "ingredients": [{ "name": string, "quantity": string, "unit": string, "category": string }],
  "notes": string
}
Keine Erklärungen, kein Markdown, nur das JSON-Objekt.`;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function extractJson(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }
  return raw.trim();
}

function buildProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  if (process.env.LLM_API_KEY) {
    providers.push({
      label: 'primary',
      url: process.env.LLM_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: process.env.LLM_API_KEY,
      model: process.env.LLM_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
    });
  }

  if (process.env.LLM_FALLBACK_API_KEY) {
    providers.push({
      label: 'fallback',
      url:
        process.env.LLM_FALLBACK_API_URL ||
        'https://integrate.api.nvidia.com/v1/chat/completions',
      apiKey: process.env.LLM_FALLBACK_API_KEY,
      model: process.env.LLM_FALLBACK_MODEL || 'meta/llama-3.3-70b-instruct',
    });
  }

  return providers;
}

async function callProvider(
  provider: ProviderConfig,
  dish: string,
  servings: number,
  timeoutMs: number,
): Promise<{ ok: true; data: ShoppingListData } | { ok: false; error: string; status?: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  let upstream: Response;
  try {
    upstream = await fetch(provider.url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${provider.apiKey}`,
        'content-type': 'application/json',
        'http-referer': process.env.LLM_REFERER || 'https://el-gusto.netlify.app',
        'x-title': 'GUSTO',
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Erstelle eine professionelle Einkaufsliste für "${dish}" für ${servings} Personen.`,
          },
        ],
      }),
    });
  } catch (err) {
    clearTimeout(timer);
    const isAbort = (err as Error)?.name === 'AbortError';
    const elapsed = Date.now() - startedAt;
    return {
      ok: false,
      error: isAbort
        ? `Timeout nach ${elapsed}ms (Limit ${timeoutMs}ms)`
        : `Network error: ${(err as Error).message}`,
    };
  }
  clearTimeout(timer);

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    return {
      ok: false,
      status: upstream.status,
      error: `HTTP ${upstream.status} ${text.slice(0, 200)}`,
    };
  }

  let payload: any;
  try {
    payload = await upstream.json();
  } catch {
    return { ok: false, error: 'Antwort war kein gueltiges JSON.' };
  }

  const content: string | undefined = payload?.choices?.[0]?.message?.content;
  if (!content) {
    return { ok: false, error: 'Antwort enthielt keinen Inhalt.' };
  }

  let parsed: ShoppingListData;
  try {
    parsed = JSON.parse(extractJson(content));
  } catch {
    return { ok: false, error: 'Rezept-JSON konnte nicht geparst werden.' };
  }

  if (!parsed?.ingredients?.length) {
    return { ok: false, error: 'Antwort enthielt keine Zutaten.' };
  }

  return { ok: true, data: parsed };
}

export default async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const providers = buildProviders();
  if (providers.length === 0) {
    return jsonResponse(
      { error: 'Server-Konfigurationsfehler: kein LLM_API_KEY hinterlegt.' },
      500,
    );
  }

  let body: { dish?: unknown; servings?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Ungültiger Request-Body.' }, 400);
  }

  const dish = typeof body.dish === 'string' ? body.dish.trim() : '';
  const servingsNum = Number(body.servings);
  const servings =
    Number.isFinite(servingsNum) && servingsNum >= 1 && servingsNum <= 50
      ? Math.floor(servingsNum)
      : 0;

  if (!dish || dish.length > 200 || !servings) {
    return jsonResponse({ error: 'Ungültige Eingabe (Gericht oder Personenzahl).' }, 400);
  }

  // Per-Provider Timeouts: Primary kurz, damit bei Outage/Hang schnell zum
  // Fallback gewechselt wird. Summe bleibt unter Netlify Function-Limit.
  const PRIMARY_TIMEOUT_MS = Number(process.env.LLM_PRIMARY_TIMEOUT_MS) || 9000;
  const FALLBACK_TIMEOUT_MS = Number(process.env.LLM_FALLBACK_TIMEOUT_MS) || 12000;

  const errors: string[] = [];
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    const timeout = i === 0 ? PRIMARY_TIMEOUT_MS : FALLBACK_TIMEOUT_MS;
    const start = Date.now();
    const result = await callProvider(provider, dish, servings, timeout);
    const elapsed = Date.now() - start;
    if (result.ok === true) {
      console.log(`[${provider.label}] ok in ${elapsed}ms (model=${provider.model})`);
      return jsonResponse(result.data);
    }
    const msg = result.error;
    console.error(`[${provider.label}] ${provider.url} failed in ${elapsed}ms:`, msg);
    errors.push(`${provider.label}: ${msg}`);
  }

  return jsonResponse(
    {
      error: 'Alle LLM-Anbieter sind aktuell nicht erreichbar. Bitte spaeter erneut versuchen.',
      details: errors,
    },
    502,
  );
};

export const config = {
  path: '/api/recipe',
};
