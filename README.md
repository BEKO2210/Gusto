# GUSTO – Setup-Anleitung

GUSTO ist eine minimalistische, KI-gestützte Einkaufs-App. Der API-Key bleibt
**immer server-side** in einer Netlify Function — Nutzer der App geben
nur ihr Wunschgericht ein, sonst nichts.

## Architektur

```
Browser  ──►  Netlify  ──►  /api/recipe (Netlify Function)  ──►  LLM-Provider
                                  │
                                  └─ Env Var: LLM_API_KEY  (nie im Browser!)
```

Netlify deployt automatisch bei jedem Push auf `main`. Bei Pull-Requests
gibt es eine Deploy-Preview-URL.

---

## 1. Kostenlosen LLM-Provider waehlen

Die Function spricht jeden **OpenAI-kompatiblen** Endpoint an. Empfehlungen:

### Variante A: OpenRouter (empfohlen, einfachster Start)
- Anmelden: https://openrouter.ai/
- Im Dashboard unter **Keys** einen API-Key erzeugen.
- Kostenlose Modelle (Suffix `:free`), z.B. `meta-llama/llama-3.3-70b-instruct:free`,
  `nvidia/llama-3.1-nemotron-70b-instruct:free`, `google/gemini-2.0-flash-exp:free`.
- In `netlify.toml` ist OpenRouter bereits voreingestellt.

### Variante B: NVIDIA Build (50 RPM Free Tier)
- Anmelden: https://build.nvidia.com/
- API-Key erzeugen (oben rechts → **Get API Key**).
- In `netlify.toml` umstellen:
  ```toml
  [build.environment]
  LLM_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
  LLM_MODEL   = "meta/llama-3.3-70b-instruct"
  ```

Andere kompatible Provider (Groq, Together, DeepInfra, Mistral …) funktionieren
genauso — nur `LLM_API_URL` und `LLM_MODEL` anpassen.

---

## 2. LLM_API_KEY in Netlify hinterlegen (einmalig)

1. https://app.netlify.com/ → dein Projekt **el-gusto** oeffnen.
2. **Site settings → Environment variables → Add a variable**.
3. Variable anlegen:
   - **Key**: `LLM_API_KEY`
   - **Value**: dein API-Key vom Provider (Schritt 1)
   - **Scopes**: alle Haken setzen (Builds + Functions + Runtime).
4. Optional, falls du auch fuer Deploy-Previews aktiv haben willst:
   denselben Key zusaetzlich fuer **Deploy Previews** scope freigeben.

> Wichtig: Diese Env Var wird ausschliesslich serverseitig gelesen.
> Sie taucht nicht im Browser-Bundle auf — der Key bleibt geheim.

Alternativ kannst du den Key auch via Netlify CLI setzen:
```bash
npx netlify env:set LLM_API_KEY dein-key-hier
```

### Warum nicht GitHub Secrets?
Netlify deployt direkt aus deinem GitHub-Repo, ohne GitHub Actions
dazwischen. Env Vars werden deshalb in Netlify selbst hinterlegt — das
ist genauso sicher (server-side, nie im Browser) und einfacher.

---

## 3. Deployen

Push auf `main` → Netlify baut & deployt automatisch.
Erste Deploy-URL: `https://el-gusto.netlify.app/` (bzw. deine Custom Domain).

PRs bekommen automatisch eine Preview-URL, die du im PR-Kommentar findest.

---

## 4. Lokale Entwicklung (optional)

```bash
npm install
npx netlify env:set LLM_API_KEY dein-key   # einmalig, lokal
npm run dev                                 # netlify dev: Vite + Functions auf :8888
```

Browser: http://localhost:8888

`netlify dev` startet Vite und die Functions auf demselben Port und kuemmert
sich automatisch um die `/api/recipe` → Function-Weiterleitung.

---

## 5. Provider/Modell wechseln ohne Code-Aenderung

Nur `netlify.toml` editieren (`LLM_API_URL`, `LLM_MODEL`), pushen, fertig.
Den geheimen Key NIE in `netlify.toml` schreiben — nur als Env Var.

---

## 6. Anpassungen am Look

- `App.tsx` — Layout, Hero-Text, Beispiel-Gerichte.
- `index.html` — Titel, Farben (`--bg-color`, `--accent-color`), Schriftarten.
- `netlify/functions/recipe.ts` — `SYSTEM_PROMPT` aendert die KI-Persoenlichkeit
  (z.B. "nur Bio-Produkte vorschlagen").

---

## Struktur

```
netlify/functions/recipe.ts  Server-side LLM-Proxy (kein Key im Browser)
netlify.toml                 Build- & Function-Konfiguration + Redirects
services/recipeService.ts    Frontend-Client fuer /api/recipe
App.tsx, components/         React-UI
```
