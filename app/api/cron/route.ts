// app/api/cron/route.ts — Autopilot Cron Job
// Vercel Cron: runs every 30 minutes
// Configure in vercel.json: { "crons": [{ "path": "/api/cron", "schedule": "*/30 * * * *" }] }

import { NextRequest, NextResponse } from "next/server";
import { searchHashtag, postComment, getRecentMedia } from "@/lib/instagram";
import { generateText } from "@/lib/gemini";
import { BRAND, SYSTEM_PROMPT } from "@/lib/brand";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [];

  try {
    // ─── 1. Search Cannabis hashtags and engage ───
    for (const keyword of BRAND.autopilot.keywords.cannabis.slice(0, 3)) {
      try {
        const results = await searchHashtag(keyword.replace(/\s+/g, ""));
        const posts = results.data?.slice(0, 2) || [];

        for (const post of posts) {
          // Generate contextual comment
          const comment = await generateText(
            `Schreibe einen kurzen, freundlichen Instagram-Kommentar (max 2 Sätze) zum Thema "${keyword}". 
             Erwähne Alpenwiese, Schweizer Qualität und faire Preise. Brokkoli-Humor wenn passend.
             Kein "kaufen" oder "bestellen". Nur Information und Community.`,
            SYSTEM_PROMPT
          );

          if (comment && comment.length > 10 && comment.length < 300) {
            await postComment(post.id, comment);
            log.push(`💬 Kommentar bei ${post.permalink || post.id}: "${comment.slice(0, 50)}..."`);
          }
        }
      } catch (e: any) {
        log.push(`⚠️ Hashtag "${keyword}" Fehler: ${e.message}`);
      }

      // Rate limiting delay
      await new Promise((r) => setTimeout(r, 3000));
    }

    // ─── 2. Search Brokkoli posts ───
    for (const keyword of BRAND.autopilot.keywords.brokkoli.slice(0, 2)) {
      try {
        const results = await searchHashtag(keyword.replace(/[^a-zA-Z0-9äöüß]/g, ""));
        const posts = results.data?.slice(0, 2) || [];

        for (const post of posts) {
          const comment = await generateText(
            `Schreibe einen witzigen Instagram-Kommentar (max 2 Sätze) auf einen Post über Brokkoli.
             Spiele auf die Doppelbedeutung an: Brokkoli als Gemüse UND als Cannabis-Synonym.
             Erwähne Alpenwiese und Schweizer Alpen. Humorvoll, nie plump.`,
            SYSTEM_PROMPT
          );

          if (comment && comment.length > 10 && comment.length < 300) {
            await postComment(post.id, comment);
            log.push(`🥦 Brokkoli-Kommentar: "${comment.slice(0, 50)}..."`);
          }
        }
      } catch (e: any) {
        log.push(`⚠️ Brokkoli "${keyword}" Fehler: ${e.message}`);
      }
      await new Promise((r) => setTimeout(r, 3000));
    }

    // ─── 3. Search Lidl posts and support ───
    try {
      const lidlResults = await searchHashtag("lidl");
      const lidlPosts = lidlResults.data?.slice(0, 1) || [];

      for (const post of lidlPosts) {
        const comment = await generateText(
          `Schreibe einen kurzen, sympathischen Kommentar (max 2 Sätze) unter einen Lidl-Post.
           Betone die Gemeinsamkeit: Gut & Günstig. Erwähne Alpenwiese als das "Lidl der Cannabis-Welt".
           Freundlich, witzig, nie aufdringlich.`,
          SYSTEM_PROMPT
        );

        if (comment && comment.length > 10 && comment.length < 300) {
          await postComment(post.id, comment);
          log.push(`💙 Lidl-Kommentar: "${comment.slice(0, 50)}..."`);
        }
      }
    } catch (e: any) {
      log.push(`⚠️ Lidl-Suche Fehler: ${e.message}`);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      actions: log.length,
      log,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, log },
      { status: 500 }
    );
  }
}
