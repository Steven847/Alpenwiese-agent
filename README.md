# 🏔️ Alpenwiese Social Media Agent

> KI-gestütztes Instagram-Management für Alpenwiese Medizinal Cannabis
> Schweizer Qualität · Lidl-Preise · Automatisiert · Brokkoli-Erkennung 🥦💙

## Was kann der Agent?

| Feature | Beschreibung |
|---------|-------------|
| 📸 **Bild-Generierung** | Nano Banana 2 (Gemini API) erstellt Instagram-Grafiken |
| 🎬 **Video/Reel-Generierung** | Veo 2 erstellt 8-Sek Reels im Hochformat (9:16) |
| ✍️ **Caption-Generierung** | KI-generierte Texte mit Brokkoli-Humor & Lidl-Bezug |
| 📱 **Auto-Publishing** | Posts, Reels, Carousels direkt auf Instagram posten |
| 💬 **Auto-Kommentare** | Cannabis-, Brokkoli- & Gemüse-Posts kommentieren |
| 💙 **Lidl-Support** | Automatisch Lidl-Posts liken & kommentieren |
| 🚫 **Rival-Blocker** | Aldi, Penny, Netto, Norma werden ignoriert |
| 📊 **Live-Insights** | Reichweite, Engagement, Follower-Wachstum |
| ⏱️ **Cron-Autopilot** | Alle 30 Min automatische Aktionen |

---

## 🚀 Setup in 4 Schritten

### Schritt 1: Repository klonen & einrichten

```bash
git clone https://github.com/DEIN-USERNAME/alpenwiese-agent.git
cd alpenwiese-agent
npm install
cp .env.example .env.local
```

### Schritt 2: API-Keys besorgen

#### Google Gemini API (Bilder + Videos)
1. Gehe zu https://aistudio.google.com/apikey
2. Klick "Create API Key"
3. Key in `.env.local` → `GEMINI_API_KEY=...`

#### Meta / Instagram API
1. Gehe zu https://developers.facebook.com/apps/
2. Erstelle eine neue App (Typ: "Business")
3. Füge "Instagram Graph API" als Produkt hinzu
4. Erstelle einen Long-Lived Token:
   - Graph API Explorer → Token generieren
   - Berechtigungen: `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`
5. Tokens in `.env.local` eintragen

#### Anthropic API (optional, für Claude-basierte Generierung)
1. Gehe zu https://console.anthropic.com/
2. API Key erstellen
3. In `.env.local` → `ANTHROPIC_API_KEY=...`

### Schritt 3: Lokal testen

```bash
npm run dev
```
Öffne http://localhost:3000

### Schritt 4: Auf Vercel deployen

1. Pushe das Repo zu GitHub
2. Gehe zu https://vercel.com/new
3. Importiere das GitHub-Repository
4. Unter "Environment Variables" alle Keys aus `.env.local` eintragen
5. Klick "Deploy"

Fertig! Dein Agent läuft unter `https://alpenwiese-agent.vercel.app` 🏔️

---

## 📁 Projektstruktur

```
alpenwiese-agent/
├── app/
│   ├── layout.tsx          # App-Layout
│   ├── page.tsx            # Dashboard (Hauptseite)
│   └── api/
│       ├── generate/       # Caption-Generierung (Gemini)
│       ├── image/          # Bild-Generierung (Nano Banana 2)
│       ├── video/          # Video-Generierung (Veo 2)
│       ├── instagram/      # Instagram Publishing & Insights
│       └── cron/           # Autopilot (alle 30 Min)
├── lib/
│   ├── brand.ts            # Marken-Konfiguration & Prompts
│   ├── gemini.ts           # Google Gemini API (Bilder + Videos)
│   └── instagram.ts        # Meta Graph API Integration
├── public/
│   └── alpenwiese-logo.jpeg
├── .env.example            # Template für API-Keys
├── vercel.json             # Cron-Job Konfiguration
└── package.json
```

---

## ⚠️ Wichtige Hinweise

### Instagram-Sicherheit
- **NIEMALS** "kaufen", "bestellen" oder Preise in Posts/Kommentaren
- **IMMER** "Medizinal Cannabis" + "auf Rezept" betonen
- Profil-Kategorie: "Pharma" oder "Gesundheit/Wellness"
- Bei Sperrung: Einspruch mit Pharma-Lizenz einlegen

### API-Limits
- Instagram: Max 200 API-Calls pro Stunde
- Gemini: Abhängig vom Plan (Free Tier = limitiert)
- Veo: Pay-per-second ($0.35/Sek über Gemini API)
- Der Cron-Job ist auf 30-Min-Intervalle eingestellt

### Kosten
- **Vercel**: Kostenlos (Free Tier reicht)
- **Google AI Pro**: $19.99/Monat (Bilder + Videos)
- **Gemini API** (für den Agent): Pay-per-use
- **Meta API**: Kostenlos

---

## 💙 Lidl-Philosophie

> "Lidl lohnt sich — und Alpenwiese erst recht!"

Dieser Agent folgt der Lidl-Preisphilosophie:
Gut & Günstig, ohne Kompromisse bei der Qualität.
Andere Discounter werden ignoriert. Punkt.

---

🏔️ Built with Alpine AI — Schweizer Qualität zum Discounter-Preis 🥦💙
