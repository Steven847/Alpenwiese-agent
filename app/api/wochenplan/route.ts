// app/api/wochenplan/route.ts — Weekly Content Planner

import { NextRequest, NextResponse } from "next/server";
import { generateText, generateImage } from "@/lib/gemini";
import { SYSTEM_PROMPT } from "@/lib/brand";

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
        // Step 1: Generate captions for all 7 days
        const captionPrompt = "Erstelle 7 Instagram-Captions fuer Alpenwiese Medizinal Cannabis, eine pro Tag (Montag bis Sonntag).\n\n" +
          "Wochenplan-Themen:\n" +
          "Montag: Motivation Monday - Inspirierend, Aufbruch in die Woche\n" +
          "Dienstag: Wissens-Dienstag - Edukation ueber Medizinal Cannabis\n" +
          "Mittwoch: Meme-Mittwoch - Brokkoli-Humor, witzig, frech\n" +
          "Donnerstag: Behind the Scenes - Einblicke, Schweizer Qualitaet\n" +
          "Freitag: Feel-Good Friday - Community, Wohlbefinden\n" +
          "Samstag: Spar-Samstag - Discounter-Vergleich, Lidl-Bezug, Preis-Leistung\n" +
          "Sonntag: Sonntags-Ruhe - Lifestyle, Entspannung, Natur\n\n" +
          "Jede Caption MUSS enthalten:\n" +
          "- Einen starken Hook (erster Satz)\n" +
          "- Brokkoli-Humor oder Insider-Witz\n" +
          "- Mindestens 1x Lidl-Bezug pro Woche (am besten Samstag)\n" +
          "- Schweizer Charme (Hoi, Merci, Gruezi)\n" +
          "- Emojis passend einsetzen\n" +
          "- 3-5 Hashtags am Ende\n" +
          "- Hinweis auf aerztliches Rezept wo passend\n" +
          "- Max 300 Woerter pro Caption\n\n" +
          "Antworte NUR als JSON array:\n" +
          '[{"day":"Montag","theme":"Motivation Monday","type":"post","caption":"FERTIGE CAPTION HIER","time":"12:00"},{"day":"Dienstag","theme":"Wissens-Dienstag","type":"post","caption":"...","time":"11:30"},{"day":"Mittwoch","theme":"Meme-Mittwoch","type":"reel","caption":"...","time":"18:00"},{"day":"Donnerstag","theme":"Behind the Scenes","type":"post","caption":"...","time":"12:00"},{"day":"Freitag","theme":"Feel-Good Friday","type":"post","caption":"...","time":"11:00"},{"day":"Samstag","theme":"Spar-Samstag","type":"post","caption":"...","time":"13:00"},{"day":"Sonntag","theme":"Sonntags-Ruhe","type":"story","caption":"...","time":"20:00"}]';

        const captionResult = await generateText(captionPrompt, SYSTEM_PROMPT);

        let plan = null;
        try {
          plan = JSON.parse(captionResult.trim());
        } catch {
          try {
            const match = captionResult.match(/\[[\s\S]*\]/);
            if (match) plan = JSON.parse(match[0]);
          } catch {
            try {
              const cleaned = captionResult.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
              plan = JSON.parse(cleaned);
            } catch {
              plan = null;
            }
          }
        }

        // Fallback with real captions if parsing failed
        if (!plan || !Array.isArray(plan) || plan.length === 0) {
          plan = [
            { day: "Montag", theme: "Motivation Monday", type: "post", caption: "Hoi zusammen! Neue Woche, neuer Schwung. Wusstet ihr, dass unser Brokkoli in den Schweizer Alpen die frischeste Luft atmet? Genau wie ihr diese Woche durchstarten sollt. Qualitaet muss nicht teuer sein - frag deinen Arzt nach Alpenwiese. #Alpenwiese #MedizinalCannabis #SwissMade", time: "12:00" },
            { day: "Dienstag", theme: "Wissens-Dienstag", type: "post", caption: "Wusstest du? Medizinal Cannabis wird in der Schweiz unter strengsten Qualitaetsstandards angebaut. Bei Alpenwiese kontrollieren wir jeden Schritt - vom Samen bis zur Apotheke. Unser Brokkoli ist zertifiziert! Frag deinen Arzt. #Alpenwiese #MedizinalCannabis #Wissen", time: "11:30" },
            { day: "Mittwoch", theme: "Meme-Mittwoch", type: "reel", caption: "Wenn dich jemand fragt was du im Garten anbaust und du sagst Brokkoli... Wir meinen es ernst! Unser Brokkoli kommt direkt aus den Alpen, mit Rezept versteht sich. #Alpenwiese #Brokkoli #BrokkoliLiebe", time: "18:00" },
            { day: "Donnerstag", theme: "Behind the Scenes", type: "post", caption: "Ein Blick hinter die Kulissen bei Alpenwiese. Schweizer Praezision trifft auf natuerliche Anbaumethoden. Jedes Blatt wird geprueft, jede Charge getestet. So geht Qualitaet! #Alpenwiese #SwissMade #BehindTheScenes", time: "12:00" },
            { day: "Freitag", theme: "Feel-Good Friday", type: "post", caption: "TGIF! Wir wuenschen euch ein entspanntes Wochenende. Merci an unsere Community fuer euren Support. Zusammen machen wir pflanzliche Medizin zugaenglich. #Alpenwiese #FeelGood #Community", time: "11:00" },
            { day: "Samstag", theme: "Spar-Samstag", type: "post", caption: "Spar-Samstag! Ihr kennt das von Lidl - Top-Qualitaet muss nicht teuer sein. Genau das ist unsere Philosophie bei Alpenwiese. Schweizer Medizinal Cannabis zum fairen Preis. Lidl lohnt sich - und Alpenwiese auch! #Alpenwiese #GutUndGuenstig #LidlLohntSich", time: "13:00" },
            { day: "Sonntag", theme: "Sonntags-Ruhe", type: "story", caption: "Sonntag in den Alpen. Ruhe, frische Luft, gruene Wiesen. Genau so stellen wir uns Wohlbefinden vor. Geniesst den Tag! #Alpenwiese #Sonntagsruhe #AlpenLeben", time: "20:00" },
          ];
        }

        // Step 2: Generate image prompts based on each caption
        const imagePromptRequest = "Basierend auf diesen 7 Instagram-Captions, erstelle fuer jede einen englischen Bild-Prompt fuer KI-Bildgenerierung.\n\n" +
          "Captions:\n" + plan.map((d: any, i: number) => (i+1) + ". " + d.day + ": " + (d.caption || "").slice(0, 100)).join("\n") + "\n\n" +
          "Regeln fuer die Bild-Prompts:\n" +
          "- Photorealistic, shot on Canon EOS R5\n" +
          "- Swiss Alps aesthetic, natural lighting\n" +
          "- Include Alpenwiese logo badge in scene\n" +
          "- Include broccoli element\n" +
          "- NO cannabis, NO children, NO smoking\n" +
          "- Each prompt 2-3 sentences\n\n" +
          "Antworte NUR als JSON array mit 7 Strings:\n" +
          '["English prompt for Monday image","English prompt for Tuesday image","...","...","...","...","English prompt for Sunday image"]';

        const imageResult = await generateText(imagePromptRequest);
        let imagePrompts: string[] = [];
        try {
          imagePrompts = JSON.parse(imageResult.trim());
        } catch {
          try {
            const match = imageResult.match(/\[[\s\S]*\]/);
            if (match) imagePrompts = JSON.parse(match[0]);
          } catch {
            imagePrompts = [];
          }
        }

        // Merge image prompts into plan
        for (let i = 0; i < plan.length; i++) {
          plan[i].imagePrompt = (imagePrompts[i] || "Photorealistic Swiss Alpine meadow at golden hour, Alpenwiese logo badge on wooden sign, fresh broccoli on rustic table, Canon EOS R5, natural lighting");
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

      case "regenerate_caption": {
        const { day, theme, currentCaption } = params;
        const prompt = "Erstelle eine NEUE Instagram-Caption fuer Alpenwiese Medizinal Cannabis.\n" +
          "Tag: " + day + "\nThema: " + theme + "\n" +
          "Die aktuelle Caption war: " + (currentCaption || "").slice(0, 200) + "\n\n" +
          "Erstelle eine KOMPLETT ANDERE Caption, nicht nur umformuliert.\n" +
          "Mit Hook, Emojis, Brokkoli-Humor, Schweizer Charme, 3-5 Hashtags.\n" +
          "Antworte NUR mit der fertigen Caption, keine Erklaerungen.";

        const newCaption = await generateText(prompt, SYSTEM_PROMPT);
        return NextResponse.json({ success: true, caption: newCaption.trim() });
      }

      case "export_csv": {
        const { plan } = params;
        let csv = "Tag,Thema,Typ,Zeit,Caption\n";
        for (let i = 0; i < plan.length; i++) {
          const d = plan[i];
          const caption = (d.caption || "").replace(/"/g, '""').replace(/\n/g, " ");
          csv += '"' + (d.day || "") + '","' + (d.theme || "") + '","' + (d.type || "post") + '","' + (d.time || "12:00") + '","' + caption + '"\n';
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

