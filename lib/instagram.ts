// lib/instagram.ts — Meta Graph API Integration for Instagram
// IMPORTANT: Uses graph.facebook.com (not graph.instagram.com) for Page Token compatibility

const GRAPH_API_VERSION = "v25.0";
const GRAPH_API_BASE = "https://graph.facebook.com/" + GRAPH_API_VERSION;

function getToken() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) throw new Error("INSTAGRAM_ACCESS_TOKEN nicht gesetzt");
  return token;
}

function getAccountId() {
  const id = process.env.INSTAGRAM_ACCOUNT_ID;
  if (!id) throw new Error("INSTAGRAM_ACCOUNT_ID nicht gesetzt");
  return id;
}

// --- PUBLISHING ---

export async function publishImagePost(imageUrl: string, caption: string) {
  const token = getToken();
  const accountId = getAccountId();

  // Step 1: Create media container
  const containerRes = await fetch(GRAPH_API_BASE + "/" + accountId + "/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: caption,
      access_token: token,
    }),
  });
  const container = await containerRes.json();
  if (container.error) throw new Error("Container error: " + container.error.message);

  // Step 2: Wait for container to be ready
  await waitForContainer(container.id, token);

  // Step 3: Publish
  const publishRes = await fetch(GRAPH_API_BASE + "/" + accountId + "/media_publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: container.id,
      access_token: token,
    }),
  });
  const published = await publishRes.json();
  if (published.error) throw new Error("Publish error: " + published.error.message);

  return { success: true, mediaId: published.id };
}

export async function publishReel(videoUrl: string, caption: string, coverUrl?: string) {
  const token = getToken();
  const accountId = getAccountId();

  const body: Record<string, string> = {
    media_type: "REELS",
    video_url: videoUrl,
    caption: caption,
    access_token: token,
  };
  if (coverUrl) body.cover_url = coverUrl;

  const containerRes = await fetch(GRAPH_API_BASE + "/" + accountId + "/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const container = await containerRes.json();
  if (container.error) throw new Error("Reel container error: " + container.error.message);

  await waitForContainer(container.id, token, 60);

  const publishRes = await fetch(GRAPH_API_BASE + "/" + accountId + "/media_publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: container.id,
      access_token: token,
    }),
  });
  const published = await publishRes.json();
  if (published.error) throw new Error("Reel publish error: " + published.error.message);

  return { success: true, mediaId: published.id };
}

export async function publishCarousel(items: { imageUrl: string }[], caption: string) {
  const token = getToken();
  const accountId = getAccountId();

  const childIds: string[] = [];
  for (const item of items) {
    const res = await fetch(GRAPH_API_BASE + "/" + accountId + "/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: item.imageUrl,
        is_carousel_item: true,
        access_token: token,
      }),
    });
    const child = await res.json();
    if (child.error) throw new Error("Carousel child error: " + child.error.message);
    childIds.push(child.id);
  }

  const containerRes = await fetch(GRAPH_API_BASE + "/" + accountId + "/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption: caption,
      access_token: token,
    }),
  });
  const container = await containerRes.json();
  if (container.error) throw new Error("Carousel error: " + container.error.message);

  const publishRes = await fetch(GRAPH_API_BASE + "/" + accountId + "/media_publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: container.id,
      access_token: token,
    }),
  });
  const published = await publishRes.json();
  return { success: true, mediaId: published.id };
}

// --- COMMENTS ---

export async function postComment(mediaId: string, message: string) {
  const token = getToken();
  const res = await fetch(GRAPH_API_BASE + "/" + mediaId + "/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message, access_token: token }),
  });
  return res.json();
}

export async function replyToComment(commentId: string, message: string) {
  const token = getToken();
  const res = await fetch(GRAPH_API_BASE + "/" + commentId + "/replies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message, access_token: token }),
  });
  return res.json();
}

export async function getComments(mediaId: string) {
  const token = getToken();
  const res = await fetch(
    GRAPH_API_BASE + "/" + mediaId + "/comments?fields=id,text,timestamp,username&access_token=" + token
  );
  return res.json();
}

// --- INSIGHTS ---

export async function getAccountInsights(period: string) {
  const token = getToken();
  const accountId = getAccountId();
  const metrics = "impressions,reach,accounts_engaged,profile_views";
  const res = await fetch(
    GRAPH_API_BASE + "/" + accountId + "/insights?metric=" + metrics + "&period=" + period + "&access_token=" + token
  );
  return res.json();
}

export async function getMediaInsights(mediaId: string) {
  const token = getToken();
  const metrics = "impressions,reach,engagement,saved";
  const res = await fetch(
    GRAPH_API_BASE + "/" + mediaId + "/insights?metric=" + metrics + "&access_token=" + token
  );
  return res.json();
}

export async function getRecentMedia(limit: number) {
  const token = getToken();
  const accountId = getAccountId();
  const res = await fetch(
    GRAPH_API_BASE + "/" + accountId + "/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=" + limit + "&access_token=" + token
  );
  return res.json();
}

// --- HASHTAG SEARCH ---

export async function searchHashtag(hashtag: string) {
  const token = getToken();
  const accountId = getAccountId();

  const searchRes = await fetch(
    GRAPH_API_BASE + "/ig_hashtag_search?user_id=" + accountId + "&q=" + encodeURIComponent(hashtag) + "&access_token=" + token
  );
  const searchData = await searchRes.json();
  if (!searchData.data?.[0]?.id) return { data: [] };

  const hashtagId = searchData.data[0].id;
  const mediaRes = await fetch(
    GRAPH_API_BASE + "/" + hashtagId + "/recent_media?user_id=" + accountId + "&fields=id,caption,media_type,timestamp,permalink&access_token=" + token
  );
  return mediaRes.json();
}

// --- HELPERS ---

async function waitForContainer(containerId: string, token: string, maxWaitSec: number = 30) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitSec * 1000) {
    const res = await fetch(
      GRAPH_API_BASE + "/" + containerId + "?fields=status_code&access_token=" + token
    );
    const data = await res.json();
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") throw new Error("Container processing failed");
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Container processing timeout");
}

export async function refreshToken() {
  const token = getToken();
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("META_APP_ID or META_APP_SECRET not set");

  const res = await fetch(
    GRAPH_API_BASE + "/oauth/access_token?grant_type=fb_exchange_token&client_id=" + appId + "&client_secret=" + appSecret + "&fb_exchange_token=" + token
  );
  return res.json();
}
