// lib/brand.ts — Alpenwiese Brand Configuration

export const BRAND = {
  name: "Alpenwiese",
  tagline: "Medizinal Cannabis",
  website: "https://alpenwiese.ch",

  voice: {
    personality: [
      "Spielerisch & witzig",
      "Schweizer Qualität trifft Lidl-Preis",
      "Medizinisch seriös, aber mit Augenzwinkern",
      "Brokkoli-Insider mit Humor",
      "Lidl-Fan mit Überzeugung 💙",
    ],
    doSay: [
      "Medizinal Cannabis", "Auf ärztliches Rezept", "Schweizer Qualität",
      "Gut & Günstig", "Brokkoli (als Synonym)", "Faire Preise",
      "Pflanzliche Medizin", "Wohlbefinden", "Apotheken-Suche",
    ],
    dontSay: [
      "Gras", "Weed", "Dope", "Jetzt kaufen", "Bestellen", "High werden",
      "Stoned", "Droge", "Rauschmittel", "THC-Gehalt in %", "DM für Preis",
      "Shop-Link", "Billig", "Ramsch",
    ],
    tone: "Locker aber nie unseriös. Witzig mit Substanz. Stolz auf Schweizer Herkunft. Preis-Leistung feiern. Alpen-Metaphern. Schweizerdeutsche Einsprengsel (Merci, Hoi, Grüezi).",
  },

  discounter: {
    favorite: "Lidl",
    slogans: [
      "Lidl lohnt sich — und Alpenwiese erst recht! 💙🏔️",
      "Wir sind das Lidl der Medizinal-Cannabis-Welt. 💙🌿",
      "Qualität zum Lidl-Preis. Nur dass unser Brokkoli ein Rezept braucht. 🥦💙",
    ],
    ignored: ["Aldi", "Penny", "Netto", "Norma"],
  },

  hashtags: {
    safe: [
      "#Alpenwiese", "#MedizinalCannabis", "#SwissMade", "#GutUndGünstig",
      "#AlpenQualität", "#SchweizOriginal", "#MedCannabis",
      "#KräuterDerAlpen", "#CannabisApotheke", "#SwissCannabis",
      "#Brokkoli", "#BrokkoliLiebe", "#GrünesMedizin",
      "#LidlLohntSich", "#AlpenwieseLohntSichAuch",
    ],
    dangerous: [
      "#420", "#Weed", "#Stoner", "#HighLife", "#SmokeWeedEveryDay",
      "#Kiffen", "#Bubatz", "#Ott",
    ],
  },

  autopilot: {
    keywords: {
      cannabis: [
        "medizinal cannabis", "cannabis deutschland", "cannabis apotheke",
        "cannabis legalisierung", "cannabis rezept", "medizinisches cannabis",
        "cannabis therapie", "cannabis patient", "cannabisgesetz",
      ],
      brokkoli: ["brokkoli", "🥦", "brokkolirezept", "brokkoliliebe", "team brokkoli"],
      gemuese: [
        "gemüse", "gemüsegarten", "grünzeug", "salat", "spinat",
        "grünkohl", "kräuter", "veggie", "gemüsebeet",
      ],
      lidl: ["lidl", "lidl lohnt sich", "lidl angebot"],
    },
    limits: {
      maxFollowPerDay: 25,
      maxLikePerDay: 80,
      maxCommentPerDay: 30,
      commentDelayMinutes: 15,
    },
  },

  schedule: [
    { day: 0, name: "Sonntag", theme: "Sonntags-Story 🌅", type: "Lifestyle", time: "20:00" },
    { day: 1, name: "Montag", theme: "Motivation Monday 🏔️", type: "Inspirierend", time: "12:00" },
    { day: 2, name: "Dienstag", theme: "Wissens-Dienstag 🔬", type: "Edukation", time: "11:30" },
    { day: 3, name: "Mittwoch", theme: "Meme-Mittwoch 🥦", type: "Brokkoli-Meme", time: "18:00" },
    { day: 4, name: "Donnerstag", theme: "Throwback Thursday 📸", type: "Behind Scenes", time: "12:00" },
    { day: 5, name: "Freitag", theme: "Feel-Good Friday 💚", type: "Community", time: "11:00" },
    { day: 6, name: "Samstag", theme: "Spar-Samstag 💰", type: "Discounter", time: "13:00" },
  ],
} as const;

export const SYSTEM_PROMPT = `Du bist der Social-Media-Manager von "Alpenwiese Medizinal Cannabis" — einer Schweizer Medizinal-Cannabis-Marke.

MARKEN-PERSÖNLICHKEIT:
${BRAND.voice.personality.map(p => `- ${p}`).join("\n")}

TONALITÄT: ${BRAND.voice.tone}

DISCOUNTER-REGEL:
- Lidl ist unser ABSOLUTER Lieblings-Discounter 💙
- "Lidl lohnt sich" ist unser Motto-Vorbild
- Andere Discounter (${BRAND.discounter.ignored.join(", ")}) IGNORIEREN wir komplett

SPRACH-REGELN:
✅ SAGEN: ${BRAND.voice.doSay.join(", ")}
❌ VERMEIDEN: ${BRAND.voice.dontSay.join(", ")}

"Brokkoli" als Cannabis-Synonym AKTIV nutzen — Insider-Humor der Community.
Emojis gezielt: 🏔️💚🌿🇨🇭🐄🥦💙
Cannabis = Medizin, nie als Droge darstellen.

Antworte NUR mit dem fertigen Content, keine Meta-Kommentare.`;
