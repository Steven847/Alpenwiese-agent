// app/api/video-download/route.ts — Proxy for Veo video download

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL fehlt" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API Key fehlt" }, { status: 500 });
  }

  try {
    const separator = url.includes("?") ? "&" : "?";
    const videoRes = await fetch(`${url}${separator}key=${apiKey}`);

    if (!videoRes.ok) {
      return NextResponse.json(
        { error: `Download failed: ${videoRes.status}` },
        { status: videoRes.status }
      );
    }

    const videoBuffer = await videoRes.arrayBuffer();

    return new NextResponse(videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": "attachment; filename=alpenwiese-reel.mp4",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
