// lib/gemini.ts — Google Gemini API (Images + Videos + Text)
// Images: Nano Banana 2 (gemini-3.1-flash-image-preview) with image editing
// Videos: Veo 2 (predictLongRunning endpoint)
// Text: Gemini 2.5 Flash

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY nicht gesetzt");
  return key;
}

const BRAND_IMAGE_RULES = [
  "PHOTO STYLE: Shot on Canon EOS R5, natural lighting, shallow depth of field, subtle film grain.",
  "Must look like a REAL photograph — natural textures, real-world imperfections, authentic shadows.",
  "Color grading: Natural greens, warm earth tones, clean whites, golden hour warmth.",
  "BRAND: Include a small elegant badge or label reading Alpenwiese in dark green somewhere in the scene.",
  "BRAND: Include a fresh broccoli somewhere — as a vegetable, sticker, patch, or playful decoration.",
  "ABSOLUTELY NO: Cannabis leaves, smoking, drug references, syringes, pills.",
  "ABSOLUTELY NO: Children, minors, babies, kids, teenagers — no persons under 18.",
  "ABSOLUTELY NO: Overly smooth AI skin, plastic objects, unrealistic lighting, stock photo look.",
].join("\n");

const BRAND_VIDEO_RULES = [
  "Cinematic quality, professional cinema camera look, natural lighting.",
  "Swiss Alps aesthetic: green meadows, snow-capped mountains, clean air.",
  "Include Alpenwiese text on a sign, label, or product in at least one moment.",
  "Include a broccoli reference: on a table, in a basket, or as a playful element.",
  "Must look like a real commercial, NOT like AI generated.",
  "ABSOLUTELY NO: Cannabis leaves, smoking, drug imagery.",
  "ABSOLUTELY NO: Children, minors, babies, kids, teenagers — no persons under 18.",
].join("\n");

// --- IMAGE GENERATION ---

export async function generateImage(prompt: string, options?: {
  aspectRatio?: "1:1" | "9:16" | "16:9" | "4:3" | "3:4";
}) {
  const apiKey = getApiKey();
  const model = "gemini-3.1-flash-image-preview";
  const fullPrompt = "Generate a photorealistic image: " + prompt + "\n\n" + BRAND_IMAGE_RULES;

  const res = await fetch(
    GEMINI_API_BASE + "/models/" + model + ":generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: options?.aspectRatio || "1:1",
            imageSize: "1K",
          },
        },
      }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error("Gemini API error: " + data.error.message);

  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));

  if (!imagePart) {
    const textPart = parts.find((p: any) => p.text);
    throw new Error("No image generated." + (textPart ? " Model: " + textPart.text.slice(0, 200) : ""));
  }

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
}

// --- IMAGE REFINEMENT (sends original image back for editing) ---

export async function refineImage(originalPrompt: string, feedback: string, originalBase64?: string, originalMimeType?: string) {
  const apiKey = getApiKey();
  const model = "gemini-3.1-flash-image-preview";

  const editPrompt = "Edit this image based on the following feedback: " + feedback + "\n\nKeep the overall composition and style. " + BRAND_IMAGE_RULES;

  const contentParts: any[] = [];

  // If we have the original image, send it for editing
  if (originalBase64 && originalMimeType) {
    contentParts.push({
      inlineData: {
        mimeType: originalMimeType,
        data: originalBase64,
      },
    });
    contentParts.push({ text: editPrompt });
  } else {
    // Fallback: generate improved prompt and create new image
    const improvedPrompt = originalPrompt + ". Additional requirements: " + feedback;
    contentParts.push({ text: "Generate a photorealistic image: " + improvedPrompt + "\n\n" + BRAND_IMAGE_RULES });
  }

  const res = await fetch(
    GEMINI_API_BASE + "/models/" + model + ":generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: contentParts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K",
          },
        },
      }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error("Gemini refine error: " + data.error.message);

  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));

  if (!imagePart) {
    const textPart = parts.find((p: any) => p.text);
    throw new Error("No refined image." + (textPart ? " Model: " + textPart.text.slice(0, 200) : ""));
  }

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
    improvedPrompt: originalPrompt + " + " + feedback,
  };
}

// --- VIDEO GENERATION (Veo 2) ---

export async function generateVideo(prompt: string, options?: {
  model?: string;
  aspectRatio?: "16:9" | "9:16";
  durationSeconds?: 4 | 6 | 8;
}) {
  const apiKey = getApiKey();
  const model = options?.model || "veo-2.0-generate-001";

  const fullPrompt = prompt + "\n\n" + BRAND_VIDEO_RULES;

  const res = await fetch(
    GEMINI_API_BASE + "/models/" + model + ":predictLongRunning",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        instances: [{ prompt: fullPrompt }],
        parameters: {
          aspectRatio: options?.aspectRatio || "9:16",
          sampleCount: 1,
          durationSeconds: options?.durationSeconds || 8,
        },
      }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error("Veo API error: " + data.error.message);
  if (data.name) return await pollVideoOperation(data.name, apiKey);
  throw new Error("Unexpected Veo response: " + JSON.stringify(data).slice(0, 200));
}

async function pollVideoOperation(operationName: string, apiKey: string, maxWaitSec = 180) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitSec * 1000) {
    const res = await fetch(GEMINI_API_BASE + "/" + operationName, { headers: { "x-goog-api-key": apiKey } });
    const data = await res.json();

    if (data.done) {
      const gvr = data.response?.generateVideoResponse;
      if (gvr?.generatedSamples?.length > 0) {
        return { base64: null, mimeType: "video/mp4", url: gvr.generatedSamples[0].video?.uri || null };
      }
      const videos = data.response?.generatedSamples || data.response?.predictions || [];
      if (videos.length > 0) {
        const v = videos[0];
        return { base64: v.bytesBase64Encoded || null, mimeType: v.mimeType || "video/mp4", url: v.uri || v.video?.uri || null };
      }
      const v = data.response?.video;
      if (v) return { base64: v.bytesBase64Encoded || null, mimeType: v.mimeType || "video/mp4", url: v.uri || null };
      throw new Error("Video done but empty: " + JSON.stringify(data.response).slice(0, 300));
    }
    if (data.error) throw new Error("Video failed: " + data.error.message);
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Video timeout after " + maxWaitSec + "s");
}

// --- TEXT GENERATION ---

export async function generateText(prompt: string, systemPrompt?: string) {
  const apiKey = getApiKey();
  const model = "gemini-2.5-flash";

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 2048 },
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetch(
    GEMINI_API_BASE + "/models/" + model + ":generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error("Gemini text error: " + data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
