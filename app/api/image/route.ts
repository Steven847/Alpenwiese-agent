// app/api/image/route.ts — Image Generation Endpoint (Nano Banana 2)

import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { prompt, aspectRatio } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt erforderlich" },
        { status: 400 }
      );
    }

    const image = await generateImage(prompt, { aspectRatio });

    return NextResponse.json({
      success: true,
      image: {
        base64: image.base64,
        mimeType: image.mimeType,
        dataUrl: `data:${image.mimeType};base64,${image.base64}`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
