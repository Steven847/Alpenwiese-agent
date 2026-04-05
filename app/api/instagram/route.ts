// app/api/instagram/route.ts — Instagram Publishing Endpoint

import { NextRequest, NextResponse } from "next/server";
import {
  publishImagePost,
  publishReel,
  publishCarousel,
  getRecentMedia,
  getAccountInsights,
  searchHashtag,
  postComment,
} from "@/lib/instagram";

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json();

    switch (action) {
      case "publish_image": {
        const result = await publishImagePost(params.imageUrl, params.caption);
        return NextResponse.json(result);
      }

      case "publish_reel": {
        const result = await publishReel(params.videoUrl, params.caption, params.coverUrl);
        return NextResponse.json(result);
      }

      case "publish_carousel": {
        const result = await publishCarousel(params.items, params.caption);
        return NextResponse.json(result);
      }

      case "comment": {
        const result = await postComment(params.mediaId, params.message);
        return NextResponse.json(result);
      }

      case "get_media": {
        const result = await getRecentMedia(params.limit || 20);
        return NextResponse.json(result);
      }

      case "get_insights": {
        const result = await getAccountInsights(params.period || "day");
        return NextResponse.json(result);
      }

      case "search_hashtag": {
        const result = await searchHashtag(params.hashtag);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unbekannte Aktion: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const [media, insights] = await Promise.allSettled([
      getRecentMedia(10),
      getAccountInsights("day"),
    ]);

    return NextResponse.json({
      media: media.status === "fulfilled" ? media.value : null,
      insights: insights.status === "fulfilled" ? insights.value : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
