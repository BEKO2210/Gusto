/**
 * GUSTO Worker — serviert die statische App (via ASSETS) und proxyt
 * Rezept-Anfragen an einen OpenAI-kompatiblen LLM-Provider.
 * Der API-Key bleibt server-side und wird nie an den Browser ausgeliefert.
 */

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  LLM_API_KEY: string;
  LLM_API_URL?: string;
  LLM_MODEL?: string;
  LLM_REFERER?: string;
}

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

async function handleRecipe(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!env.LLM_API_KEY) {
    return jsonResponse(
      { error: 'Server-Konfigurationsfehler: LLM_API_KEY fehlt.' },
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
  const servings = Number.isFinite(servingsNum) && servingsNum >= 1 && servingsNum <= 50
    ? Math.floor(servingsNum)
    : 0;

  if (!dish || dish.length > 200 || !servings) {
    return jsonResponse({ error: 'Ungültige Eingabe (Gericht oder Personenzahl).' }, 400);
  }

  const url = env.LLM_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
  const model = env.LLM_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';

  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${env.LLM_API_KEY}`,
      'content-type': 'application/json',
      'http-referer': env.LLM_REFERER || 'https://gusto.app',
      'x-title': 'GUSTO',
    },
    body: JSON.stringify({
      model,
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

  if (!upstream.ok) {
    const text = await upstream.text();
    console.error('LLM upstream error', upstream.status, text);
    return jsonResponse(
      { error: `LLM-Anbieter antwortete mit Status ${upstream.status}.` },
      502,
    );
  }

  const payload = (await upstream.json()) as any;
  const content: string | undefined = payload?.choices?.[0]?.message?.content;
  if (!content) {
    return jsonResponse({ error: 'Keine Antwort vom LLM erhalten.' }, 502);
  }

  let parsed: ShoppingListData;
  try {
    parsed = JSON.parse(extractJson(content));
  } catch (err) {
    console.error('JSON parse failed', err, content);
    return jsonResponse({ error: 'Antwort konnte nicht als JSON geparst werden.' }, 502);
  }

  if (!parsed?.ingredients?.length) {
    return jsonResponse({ error: 'Antwort enthielt keine Zutaten.' }, 502);
  }

  return jsonResponse(parsed);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/recipe') {
      return handleRecipe(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
