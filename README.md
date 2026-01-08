
# GUSTO – Produktions-Guide

GUSTO ist eine minimalistische, KI-gestützte Einkaufs-App. Diese Anleitung hilft dir, die App heute Abend live zu bringen und nach deinen Wünschen anzupassen.

## 🚀 Schnellstart (Deployment)

Um die App sicher zu hosten, ohne deinen Google API-Key preiszugeben, empfehle ich **Vercel** oder **Netlify**.

1.  **Repository hochladen**: Lade deinen Code auf GitHub/GitLab hoch.
2.  **Projekt verbinden**: Verbinde das Repo mit Vercel/Netlify.
3.  **Umgebungsvariablen (WICHTIG)**: 
    *   Gehe in die Einstellungen deines Projekts (Dashboard).
    *   Suche nach **Environment Variables**.
    *   Füge eine neue Variable hinzu:
        *   Name: `API_KEY`
        *   Wert: `DEIN_GOOGLE_GEMINI_API_KEY`
4.  **Deploy**: Klicke auf "Deploy". Die App ist nun unter einer sicheren URL (HTTPS) erreichbar.

## 🛠 Anpassungen (Customizing)

### 1. Namen ändern
Möchtest du "GUSTO" durch einen anderen Namen ersetzen, ändere ihn an diesen Stellen:
*   `metadata.json`: Ändere `"name"`.
*   `index.html`: Ändere den `<title>`.
*   `App.tsx`: Suche nach `GUSTO.` (Zeile ~57) und dem Footer-Text.
*   `services/geminiService.ts`: Ändere den Namen im `systemInstruction` (Zeile 15), damit die KI weiß, wer sie ist.

### 2. Design & Farben
Die App nutzt Tailwind CSS. Die Hauptfarben sind in der `index.html` im `:root` Bereich definiert:
*   `--bg-color`: Hintergrundfarbe (aktuell Off-White `#fdfdfd`).
*   `--accent-color`: Akzentfarbe (aktuell `#1a1a1a`).

### 3. KI-Verhalten anpassen
In `services/geminiService.ts` kannst du im `systemInstruction` Block (ab Zeile 14) die "Persönlichkeit" des Assistenten ändern. Du kannst z.B. hinzufügen: "Antworte immer sehr höflich" oder "Schlage nur Bio-Produkte vor".

## 🔒 Sicherheit
Der API-Key wird direkt über `process.env.API_KEY` bezogen. 
*   **Lokal**: Erstelle eine Datei namens `.env` im Hauptverzeichnis (nicht hochladen!) mit dem Inhalt: `API_KEY=dein_key`.
*   **Server**: Nutze niemals einen hartcodierten Key im Code. Trage ihn immer im Dashboard deines Hosters ein.

## 📂 Struktur
*   `/components`: UI-Elemente (Karten, Ladebildschirm).
*   `/services`: Logik für die Kommunikation mit Google Gemini.
*   `App.tsx`: Das Herzstück und Layout der Anwendung.
*   `types.ts`: Definition der Datenstrukturen.

Viel Erfolg beim Launch heute Abend! 🥂
