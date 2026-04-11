// app/api/wochenplan/route.ts — Weekly Content Planner

import { NextRequest, NextResponse } from "next/server";
import { generateText, generateImage } from "@/lib/gemini";
import { SYSTEM_PROMPT, BRAND } from "@/lib/brand";

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const { action, ...params } = body;

  try {
    switch (action) {
      case "generate_week": {
        const prompt = "Erstelle einen Instagram Content-Plan fuer die naechsten 7 Tage fuer Alpenwiese Medizinal Cannabis.\n\n" +
          "Fuer JEDEN Tag erstelle:\n" +
          "1. day: Wochentag (Montag bis Sonntag)\n" +
          "2. theme: Tageslogo/Motto\n" +
          "3. type: post, story, oder reel\n" +
          "4. caption: Fertige Instagram-Caption (mit Emojis, Brokkoli-Humor, Lidl-Bezug, 3-5 Hashtags)\n" +
          "5. imagePrompt: Englischer Prompt fuer Bildgenerierung (photorealistic, Swiss Alps, include Alpenwiese badge and broccoli)\n" +
          "6. time: Beste Posting-Zeit\n\n" +
          "Orientiere dich an diesem Wochenplan:\n" +
          "Mo: Motivation, Di: Wissen, Mi: Meme/Humor, Do: Behind Scenes, Fr: Community, Sa: Discounter/Spar, So: Lifestyle\n\n" +
          "Respond ONLY with valid JSON array, no markdown:\n" +
          '[{"day":"Montag","theme":"...","type":"post","caption":"...","imagePrompt":"...","time":"12:00"},...]';

        const result = await generateText(prompt, SYSTEM_PROMPT);

        let plan = null;
        try {
          plan = JSON.parse(result.trim());
        } catch {
          try {
            const match = result.match(/\[[\s\S]*?\]/);
            if (match) plan = JSON.parse(match[0]);
          } catch {
            try {
              const cleaned = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
              plan = JSON.parse(cleaned);
            } catch {
              plan = null;
            }
          }
        }

        if (!plan || !Array.isArray(plan)) {
          plan = BRAND.schedule.map(s => ({
            day: s.name,
            theme: s.theme,
            type: s.type === "Brokkoli-Meme" ? "reel" : "post",
            caption: "Caption wird generiert...",
            imagePrompt: "Swiss Alpine meadow with Alpenwiese branding, broccoli element, photorealistic",
            time: s.time,
          }));
        }

        return NextResponse.json({ success: true, plan });
      }

      case "generate_day_image": {
        const { imagePrompt } = params;
        const image = await generateImage(imagePrompt, { aspectRatio: "1:1" });
        return NextResponse.json({
          success: true,
          image: {
            base64: image.base64,
            mimeType: image.mimeType,
            dataUrl: "data:" + image.mimeType + ";base64," + image.base64,
          },
        });
      }

      case "export_csv": {
        const { plan } = params;
        // Generate CSV for Meta Business Suite import
        let csv = "Date,Time,Caption,Media Type\n";
        const today = new Date();
        for (let i = 0; i < plan.length; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];
          const caption = (plan[i].caption || "").replace(/"/g, '""');
          csv += '"' + dateStr + '","' + (plan[i].time || "12:00") + '","' + caption + '","' + (plan[i].type || "post") + '"\n';
        }
        return NextResponse.json({ success: true, csv });
      }

      default:
        return NextResponse.json({ success: false, error: "Unbekannte Aktion: " + action }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

