// app/api/reel-builder/route.ts — Multi-Clip Reel Builder

import { NextRequest, NextResponse } from "next/server";
import { generateText, generateVideo } from "@/lib/gemini";
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
      case "plan_scenes": {
        const { theme, clipCount = 3 } = params;

        const prompt = `Create an Instagram Reel concept with ${clipCount} scenes about: "${theme}"

For EACH scene provide:
1. Scene number
2. Visual prompt in English for AI video generation (max 2 sentences, cinematic, Swiss Alps style)
3. German text overlay for the video
4. Duration: 8 seconds

IMPORTANT: Respond ONLY with valid JSON, no markdown, no backticks, no explanation. Just the raw JSON array:
[{"scene":1,"prompt":"English visual prompt","overlay":"German overlay text","duration":8},{"scene":2,"prompt":"English visual prompt","overlay":"German overlay text","duration":8},{"scene":3,"prompt":"English visual prompt","overlay":"German overlay text","duration":8}]`;

        const result = await generateText(prompt, SYSTEM_PROMPT);

        let scenes = null;
        try {
          scenes = JSON.parse(result.trim());
        } catch {
          try {
            const match = result.match(/\[[\s\S]*?\]/);
            if (match) {
              scenes = JSON.parse(match[0]);
            }
          } catch {
            try {
              const cleaned = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
              scenes = JSON.parse(cleaned);
            } catch {
              scenes = null;
            }
          }
        }

        if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
          scenes = [
            { scene: 1, prompt: "Cinematic drone shot over Swiss Alpine meadows at golden hour, mist rising from valleys, a small elegant sign reading Alpenwiese visible on a wooden post, a broccoli sits on a rustic table in the foreground. Theme: " + theme, overlay: "Schweizer Qualitaet aus den Alpen", duration: 8 },
            { scene: 2, prompt: "Close-up of hands carefully examining premium herbs in a clean Swiss laboratory setting, natural window light, an Alpenwiese branded label visible, a small broccoli decorative element on the desk. Theme: " + theme, overlay: "Medizinisch. Praezise. Fair.", duration: 8 },
            { scene: 3, prompt: "Wide shot of a happy person walking through a green Swiss meadow towards snow-capped mountains, holding a small branded Alpenwiese bag, a broccoli pattern visible on their scarf. Theme: " + theme, overlay: "Alpenwiese - Gut und Guenstig", duration: 8 },
          ];
        }

        return NextResponse.json({ success: true, scenes });
      }

      case "generate_clip": {
        const { prompt, sceneIndex, aspectRatio = "9:16", duration = 8 } = params;

        const video = await generateVideo(prompt, {
          aspectRatio,
          durationSeconds: duration,
        });

        return NextResponse.json({
          success: true,
          sceneIndex,
          video: { url: video.url, mimeType: video.mimeType },
        });
      }

      case "refine_clip": {
        const { originalPrompt, feedback, sceneIndex } = params;

        const refinementPrompt = "Original video prompt: " + originalPrompt + "\nUser feedback: " + feedback + "\nCreate an IMPROVED English video prompt incorporating the feedback.\nKeep Swiss Alps style, cinematic, professional. Include Alpenwiese branding and broccoli element.\nRespond ONLY with the new prompt, nothing else.";

        const improvedPrompt = await generateText(refinementPrompt, SYSTEM_PROMPT);

        const video = await generateVideo(improvedPrompt.trim(), {
          aspectRatio: "9:16",
          durationSeconds: 8,
        });

        return NextResponse.json({
          success: true,
          sceneIndex,
          improvedPrompt: improvedPrompt.trim(),
          video: { url: video.url, mimeType: video.mimeType },
        });
      }

      case "generate_caption": {
        const { scenes, theme } = params;

        const overlays = scenes.map((s: any) => s.overlay).join(" | ");
        const captionPrompt = "Erstelle eine Instagram Reel-Caption fuer ein " + scenes.length + "-Szenen Video zum Thema: " + theme + ".\nDie Szenen zeigen: " + overlays + "\nMax 2200 Zeichen, mit Hook, Emojis, Brokkoli-Humor, Lidl-Bezug, und 5-8 Hashtags.";

        const caption = await generateText(captionPrompt, SYSTEM_PROMPT);

        return NextResponse.json({ success: true, caption });
      }

      default:
        return NextResponse.json({ success: false, error: "Unbekannte Aktion: " + action }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

