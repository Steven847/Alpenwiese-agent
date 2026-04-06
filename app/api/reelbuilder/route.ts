// app/api/reelbuilder/route.ts — Multi-Clip Reel Builder with Visual Consistency

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

        const prompt = "Create an Instagram Reel concept with " + clipCount + " scenes about: " + theme + "\n\n" +
"CRITICAL VISUAL CONSISTENCY RULES:\n" +
"All scenes MUST feel like they belong to the SAME video. They must share:\n" +
"- SAME color palette throughout (e.g. warm golden tones, or cool blue-green tones)\n" +
"- SAME time of day and lighting (e.g. all golden hour, or all morning light)\n" +
"- SAME location or connected locations (e.g. all in the same Alpine valley)\n" +
"- SAME camera style (e.g. all slow cinematic movements, or all handheld)\n" +
"- SAME visual mood and atmosphere\n" +
"- Each scene prompt must explicitly mention the shared visual style\n\n" +
"NARRATIVE STRUCTURE:\n" +
"- Scene 1: HOOK - Attention-grabbing opening that introduces the setting\n" +
"- Scene 2: STORY - Develops the theme, shows detail or action\n" +
"- Scene 3: PAYOFF - Emotional conclusion, brand message, call-to-action moment\n" +
"The scenes must tell a coherent STORY with a beginning, middle, and end.\n\n" +
"BRAND RULES:\n" +
"- Swiss Alps aesthetic, photorealistic, professional cinema look\n" +
"- Include Alpenwiese branding (sign, label, or text) in at least one scene\n" +
"- Include a broccoli reference in at least one scene\n" +
"- NO cannabis, smoking, drugs, NO children or minors\n\n" +
"For EACH scene provide:\n" +
"1. scene: Scene number\n" +
"2. prompt: Detailed English visual prompt for AI video generation (3-4 sentences, include specific camera movement, lighting, colors, and atmosphere. REPEAT the shared visual style keywords in every prompt)\n" +
"3. overlay: Short German text overlay for the video (max 8 words)\n" +
"4. duration: 8\n\n" +
"Respond ONLY with valid JSON array, no markdown, no backticks:\n" +
'[{"scene":1,"prompt":"detailed prompt here","overlay":"German text","duration":8},{"scene":2,"prompt":"detailed prompt here","overlay":"German text","duration":8},{"scene":3,"prompt":"detailed prompt here","overlay":"German text","duration":8}]';

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
            { scene: 1, prompt: "Cinematic slow drone shot rising over a misty Swiss Alpine valley at golden hour. Warm amber and deep green color palette. Soft morning fog rolls between pine trees. A rustic wooden sign reading Alpenwiese is visible at the edge of a meadow. Shot on Arri Alexa, shallow depth of field, 24fps cinematic motion. Theme: " + theme, overlay: "Willkommen in den Alpen", duration: 8 },
            { scene: 2, prompt: "Continuing the same golden hour lighting and warm amber-green color palette. Close-up tracking shot of hands carefully arranging fresh herbs and a bright green broccoli on a clean wooden table in a Swiss mountain cabin. Same misty Alpine valley visible through the window. Soft natural window light matches the outdoor scenes. Cinematic 24fps, shallow focus. Theme: " + theme, overlay: "Schweizer Praezision", duration: 8 },
            { scene: 3, prompt: "Same golden hour, same Alpine valley from scene 1 but now from ground level. A person walks peacefully through the green meadow towards snow-capped mountains, carrying a small Alpenwiese branded bag. Same warm amber and deep green color palette. Camera slowly pulls back to reveal the full mountain panorama. Cinematic, emotional, 24fps. Theme: " + theme, overlay: "Alpenwiese - Natuerlich fair", duration: 8 },
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

        const refinementPrompt = "Original video prompt: " + originalPrompt + "\n\nUser feedback: " + feedback + "\n\nCreate an IMPROVED English video prompt that incorporates the feedback.\nIMPORTANT: Keep the SAME color palette, lighting, time of day, and visual atmosphere as the original.\nKeep Swiss Alps style, cinematic, professional. Include Alpenwiese branding and broccoli element where appropriate.\nNO children, NO cannabis leaves, NO smoking.\nRespond ONLY with the new prompt, nothing else.";

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
        const captionPrompt = "Erstelle eine Instagram Reel-Caption fuer ein " + scenes.length + "-Szenen Video zum Thema: " + theme + ".\nDie Szenen zeigen: " + overlays + "\nMax 2200 Zeichen, mit Hook, Emojis, Brokkoli-Humor, Lidl-Bezug, und 5-8 Hashtags.\nDie Caption soll die Geschichte des Reels erzaehlen und zum Interagieren einladen.";

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
