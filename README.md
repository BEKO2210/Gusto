# GUSTO – Setup-Anleitung

GUSTO ist eine minimalistische, KI-gestützte Einkaufs-App. Der API-Key bleibt
**immer server-side** in einem Cloudflare Worker — Nutzer der App geben
nur ihr Wunschgericht ein, sonst nichts.

## Architektur

```
Browser  ──►  Cloudflare Worker (statische App + /api/recipe)  ──►  LLM-Provider
                       │
                       └─ Secret: LLM_API_KEY  (nie im Browser!)
```

Deployment passiert automatisch per **GitHub Actions** bei jedem Push auf `main`.

---

## 1. Kostenlosen LLM-Provider waehlen

Der Worker spricht jeden **OpenAI-kompatiblen** Endpoint an. Empfehlungen:

### Variante A: OpenRouter (empfohlen, einfachster Start)
- Anmelden: https://openrouter.ai/
- Im Dashboard unter **Keys** einen API-Key erzeugen.
- Kostenlose Modelle (Suffix `:free`), z.B. `meta-llama/llama-3.3-70b-instruct:free`,
  `nvidia/llama-3.1-nemotron-70b-instruct:free`, `google/gemini-2.0-flash-exp:free`.
- In `wrangler.toml` ist OpenRouter bereits voreingestellt.

### Variante B: NVIDIA Build (50 RPM Free Tier)
- Anmelden: https://build.nvidia.com/
- API-Key erzeugen (oben rechts → **Get API Key**).
- In `wrangler.toml` umstellen:
  ```toml
  [vars]
  LLM_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
  LLM_MODEL   = "meta/llama-3.3-70b-instruct"
  ```

Andere kompatible Provider (Groq, Together, DeepInfra, Mistral …) funktionieren
genauso — nur `LLM_API_URL` und `LLM_MODEL` anpassen.

---

## 2. Cloudflare-Account vorbereiten (kostenlos)

1. Account anlegen: https://dash.cloudflare.com/sign-up
2. **Account-ID** kopieren (rechte Sidebar im Dashboard).
3. **API-Token** erzeugen unter
   *My Profile → API Tokens → Create Token → "Edit Cloudflare Workers"*.
   Berechtigungen: `Account → Workers Scripts → Edit`.

---

## 3. GitHub-Secrets eintragen

Im GitHub-Repo unter **Settings → Secrets and variables → Actions → New repository secret**
genau diese drei Secrets anlegen:

| Name                    | Wert                                              |
| ----------------------- | ------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Token aus Schritt 2.3                             |
| `CLOUDFLARE_ACCOUNT_ID` | Account-ID aus Schritt 2.2                        |
| `LLM_API_KEY`           | API-Key vom LLM-Provider (Schritt 1)              |

Das war's. Beim naechsten Push auf `main` deployt die GitHub Action
(`.github/workflows/deploy.yml`) die App automatisch.

Nach dem ersten Deploy ist die App erreichbar unter:
`https://gusto.<dein-cloudflare-subdomain>.workers.dev`

---

## 4. Lokale Entwicklung (optional)

```bash
npm install
cp .dev.vars.example .dev.vars   # LLM_API_KEY eintragen
npm run worker                   # Terminal 1 — Worker auf :8787
npm run dev                      # Terminal 2 — Vite auf :3000 (proxyt /api → :8787)
```

Browser auf `http://localhost:3000` öffnen.

---

## 5. Provider/Modell wechseln ohne Code-Aenderung

Nur `wrangler.toml` editieren (`LLM_API_URL`, `LLM_MODEL`), pushen, fertig.
Den geheimen Key NIE in `wrangler.toml` schreiben — nur als Secret.

---

## 6. Anpassungen am Look

- `App.tsx` — Layout, Hero-Text, Beispiel-Gerichte.
- `index.html` — Titel, Farben (`--bg-color`, `--accent-color`), Schriftarten.
- `worker/index.ts` — `SYSTEM_PROMPT` aendert die KI-Persoenlichkeit
  (z.B. "nur Bio-Produkte vorschlagen").

---

## Struktur

```
worker/index.ts              Cloudflare Worker (API + Static Assets)
wrangler.toml                Worker-Konfiguration
.github/workflows/deploy.yml Auto-Deploy bei Push auf main
services/recipeService.ts    Frontend-Client fuer /api/recipe
App.tsx, components/         React-UI
```
