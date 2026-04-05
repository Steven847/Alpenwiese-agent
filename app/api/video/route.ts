// app/api/video/route.ts — Video Generation Endpoint (Veo 2 / 3.1)

import { NextRequest, NextResponse } from "next/server";
import { generateVideo } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { prompt, aspectRatio, duration, model } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt erforderlich" },
        { status: 400 }
      );
    }

    const video = await generateVideo(prompt, {
      model: model || "veo-2.0-generate-001",
      aspectRatio: aspectRatio || "9:16",
      durationSeconds: duration || 8,
    });

    return NextResponse.json({
      success: true,
      video: {
        url: video.url,
        mimeType: video.mimeType,
        hasBase64: !!video.base64,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
