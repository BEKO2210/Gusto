# GUSTO – Setup-Anleitung

GUSTO ist eine minimalistische, KI-gestützte Einkaufs-App. Der API-Key bleibt
**immer server-side** in einer Netlify Function — Nutzer der App geben
nur ihr Wunschgericht ein, sonst nichts.

## Architektur

```
Browser  ──►  Netlify  ──►  /api/recipe (Netlify Function)  ──►  Primary  (OpenRouter)
                                                                 ↓ falls Fehler
                                                                Fallback (NVIDIA Build)
```

- **Primary**: OpenRouter (kostenlose Modelle mit `:free`-Suffix)
- **Fallback**: NVIDIA Build (50 RPM Free Tier) — wird automatisch genutzt
  wenn OpenRouter scheitert (Rate Limit, Outage, Modell entfernt).

Netlify deployt automatisch bei jedem Push auf `main`.

---

## 1. Zwei kostenlose Provider-Keys holen

### Primary: OpenRouter
- https://openrouter.ai/ → einloggen → **Keys → Create Key**
- Key kopieren (`sk-or-v1-...`).

### Fallback: NVIDIA Build
- https://build.nvidia.com/ → einloggen → oben rechts **Get API Key**
- Key kopieren (`nvapi-...`).

Beide sind **kostenlos**, keine Kreditkarte erforderlich.

---

## 2. Beide Keys in Netlify hinterlegen

1. https://app.netlify.com/ → dein Projekt **el-gusto** oeffnen.
2. Linke Sidebar: **Project configuration → Environment variables**.
3. Auf **Add a variable** klicken und nacheinander zwei Variablen anlegen:

   | Key                    | Value                | Scopes                          |
   | ---------------------- | -------------------- | ------------------------------- |
   | `LLM_API_KEY`          | OpenRouter-Key       | Builds + Functions + Runtime    |
   | `LLM_FALLBACK_API_KEY` | NVIDIA-Key           | Builds + Functions + Runtime    |

   Bei "Sensitive variable" den Haken setzen — dann ist der Wert maskiert.
   Bei "Deploy contexts" auf **All deploy contexts** stehen lassen.

4. Anschliessend **Deploys → Trigger deploy → Deploy site** klicken,
   damit der Build die neuen Variablen aufnimmt.

> Die Default-URLs und Modelle stehen in `netlify.toml` und brauchen
> normalerweise nicht angepasst zu werden.

---

## 3. Alte Variablen aufraeumen (einmalig)

Falls dein Netlify-Projekt aus einer aelteren Version Variablen wie
`STRIPE_*`, `JWT_SECRET`, `GEMINI_API_KEY`, `DOMAIN`,
`NETLIFY_DATABASE_URL*`, `VITE_STRIPE_*` enthaelt — die werden
**nicht mehr** verwendet und koennen geloescht werden:

1. Pro Variable rechts den Pfeil/Options-Button → **Delete**.
2. Optional auch die **Neon-Extension** entfernen (links unter
   *Extensions → Neon → Remove*) wenn du keine Datenbank brauchst.

Es bleiben am Ende nur diese zwei (plus optional `LLM_*_URL` /
`LLM_*_MODEL` falls du Provider/Modelle ueberschreiben willst):
- `LLM_API_KEY`
- `LLM_FALLBACK_API_KEY`

---

## 4. Provider/Modell wechseln (optional)

`netlify.toml` editieren — die Werte sind dort dokumentiert. Geheime Keys
NIE in `netlify.toml` schreiben, nur als Env Var.

Andere kostenlose Modelle bei OpenRouter:
- `meta-llama/llama-3.3-70b-instruct:free` (Default)
- `nvidia/llama-3.1-nemotron-70b-instruct:free`
- `google/gemini-2.0-flash-exp:free`
- `openrouter/free` (Auto-Router der irgendein freies Modell waehlt)

Liste: https://openrouter.ai/collections/free-models

---

## 5. Lokale Entwicklung (optional)

```bash
npm install
npx netlify env:set LLM_API_KEY dein-openrouter-key
npx netlify env:set LLM_FALLBACK_API_KEY dein-nvidia-key
npm run dev   # netlify dev: Vite + Functions auf :8888
```

Browser: http://localhost:8888

---

## 6. KI-Verhalten anpassen

`SYSTEM_PROMPT` in `netlify/functions/recipe.ts` aendern (z.B.
"nur Bio-Produkte vorschlagen", "antworte auf Englisch"), pushen, fertig.

---

## Struktur

```
netlify/functions/recipe.ts  Server-side LLM-Proxy mit Fallback (kein Key im Browser)
netlify.toml                 Build- & Function-Konfiguration + Redirects
services/recipeService.ts    Frontend-Client fuer /api/recipe
App.tsx, components/         React-UI
```
