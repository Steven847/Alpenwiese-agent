// app/api/generate/route.ts — Content Generation Endpoint

import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT, BRAND } from "@/lib/brand";
import { generateText } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { contentType, tone, topic } = await req.json();

    const typeInstructions: Record<string, string> = {
      post: `Instagram POST Caption (max 2200 Zeichen). Hook in erster Zeile, Emojis, CTA, 5-8 Hashtags aus: ${BRAND.hashtags.safe.slice(0, 8).join(" ")}. Brokkoli + Lidl Bezug einbauen.`,
      story: "Instagram STORY 3-4 Slides. Pro Slide: kurzer Text + Visual-Beschreibung. Interaktives Element (Poll/Quiz).",
      reel: "Instagram REEL-Konzept: Hook (erste 3 Sek), Ablauf, Text-Overlays, Sound-Vorschlag, Caption. Max 30 Sek.",
      comment: "5 verschiedene Kommentar-Antworten für: Lob, Frage, Kritik, Brokkoli-Insider, Lidl-Bezug. Max 2 Sätze pro Antwort.",
    };

    const prompt = `${typeInstructions[contentType] || typeInstructions.post}

Tonalität: ${tone || "witzig"}
Thema/Fokus: ${topic || "Freie Wahl — überrasch mich!"}

Erstelle jetzt den Content:`;

    const result = await generateText(prompt, SYSTEM_PROMPT);

    return NextResponse.json({ success: true, content: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
