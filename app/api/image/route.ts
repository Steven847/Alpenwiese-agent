// app/api/image/route.ts — Image Generation + Editing (Nano Banana 2)

import { NextRequest, NextResponse } from "next/server";
import { generateImage, refineImage } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, aspectRatio, action, originalPrompt, feedback, originalBase64, originalMimeType } = body;

    if (action === "refine") {
      if (!feedback) {
        return NextResponse.json({ success: false, error: "Feedback erforderlich" }, { status: 400 });
      }

      const result = await refineImage(
        originalPrompt || "",
        feedback,
        originalBase64 || undefined,
        originalMimeType || undefined
      );

      return NextResponse.json({
        success: true,
        image: {
          base64: result.base64,
          mimeType: result.mimeType,
          dataUrl: "data:" + result.mimeType + ";base64," + result.base64,
        },
        improvedPrompt: result.improvedPrompt,
      });
    }

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt erforderlich" }, { status: 400 });
    }

    const image = await generateImage(prompt, { aspectRatio });

    return NextResponse.json({
      success: true,
      image: {
        base64: image.base64,
        mimeType: image.mimeType,
        dataUrl: "data:" + image.mimeType + ";base64," + image.base64,
      },
      prompt,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
