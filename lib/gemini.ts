// lib/gemini.ts — Google Gemini API Integration (Images + Videos)
// Images: Nano Banana 2 (gemini-3.1-flash-image-preview) — photorealistic with branding
// Videos: Veo 2 / Veo 3.1 (predictLongRunning endpoint) — with branding
// Text: Gemini 2.5 Flash

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY nicht gesetzt");
  return key;
}

// ─── BRAND PROMPT ADDITIONS ───

const BRAND_IMAGE_RULES = `
CRITICAL STYLE RULES — follow these exactly:
- Style: PHOTOREALISTIC, shot on Canon EOS R5 or Sony A7IV, natural lighting
- This must look like a REAL PHOTOGRAPH, NOT like AI-generated art
- Use natural textures, real-world imperfections, authentic lighting with soft shadows
- Include subtle film grain, shallow depth of field where appropriate
- Color grading: Natural greens, warm earth tones, clean whites, subtle golden hour warmth

BRAND ELEMENTS — include these in EVERY image:
- Somewhere visible in the scene: a small elegant logo badge or label reading "Alpenwiese" in a clean serif font on a dark green background
- Somewhere in the scene: a fresh broccoli (Brokkoli) — either as a real vegetable, as a subtle decorative element, a sticker, a patch, or worked into the composition naturally
- The broccoli should feel intentional and playful, not random — it's an insider reference

ABSOLUTELY NO:
- Cannabis leaves, smoking, drug references, syringes, pills
- Overly smooth AI-looking skin or textures
- Plastic-looking objects or unrealistic lighting
- Generic stock photo aesthetics
`;

const BRAND_VIDEO_RULES = `
CRITICAL STYLE RULES:
- Cinematic quality, shot on professional cinema camera
- Natural lighting, real-world physics, authentic motion
- Swiss Alps aesthetic: green meadows, snow-capped mountains, clean air feeling
- Include subtle branding: "Alpenwiese" text visible on a sign, label, or product in at least one moment
- Include a broccoli reference somewhere: a broccoli on a table, in a basket, held by someone, or as a playful element
- Professional, premium, nature-focused — must look like a real commercial, NOT like AI

ABSOLUTELY NO: Cannabis leaves, smoking, drug imagery, unrealistic physics
`;

// ─── IMAGE GENERATION (Nano Banana 2) ───

export async function generateImage(prompt: string, options?: {
  aspectRatio?: "1:1" | "9:16" | "16:9" | "4:3" | "3:4";
  refinement?: string;
  skipBranding?: boolean;
}) {
  const apiKey = getApiKey();
  const model = "gemini-3.1-flash-image-preview";

  let fullPrompt = `Generate a photorealistic image: ${prompt}`;

  if (options?.refinement) {
    fullPrompt += `\n\nADDITIONAL REFINEMENT from user: ${options.refinement}`;
  }

  if (!options?.skipBranding) {
    fullPrompt += `\n\n${BRAND_IMAGE_RULES}`;
  }

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
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

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`);
  }

  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(
    (p: any) => p.inlineData?.mimeType?.startsWith("image/")
  );

  if (!imagePart) {
    const textPart = parts.find((p: any) => p.text);
    throw new Error(
      "No image generated." + (textPart ? ` Model said: ${textPart.text.slice(0, 200)}` : "")
    );
  }

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
}

// ─── IMAGE REFINEMENT ───

export async function refineImage(originalPrompt: string, feedback: string) {
  // Generate an improved prompt based on feedback
  const apiKey = getApiKey();
  const model = "gemini-2.5-flash";

  const refinementRequest = `The original image prompt was: "${originalPrompt}"

The user's feedback is: "${feedback}"

Create an IMPROVED image prompt that incorporates the feedback.
Keep the Alpenwiese brand style: photorealistic, Swiss Alps, elegant, premium.
Always include the Alpenwiese logo badge and a broccoli element.
Respond ONLY with the new prompt, no explanations.`;

  const body = {
    contents: [{ parts: [{ text: refinementRequest }] }],
    generationConfig: { maxOutputTokens: 500 },
  };

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  const improvedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || originalPrompt;

  // Generate image with improved prompt
  const image = await generateImage(improvedPrompt.trim(), { refinement: feedback });

  return {
    ...image,
    improvedPrompt: improvedPrompt.trim(),
  };
}

// ─── VIDEO GENERATION (Veo 2 / Veo 3.1) ───

export async function generateVideo(prompt: string, options?: {
  model?: "veo-2.0-generate-001" | "veo-3.1-generate-preview" | "veo-3.1-fast-generate-preview";
  aspectRatio?: "16:9" | "9:16";
  durationSeconds?: 4 | 6 | 8;
  imageBase64?: string;
  imageMimeType?: string;
}) {
  const apiKey = getApiKey();
  const model = options?.model || "veo-2.0-generate-001";

  const instance: any = {
    prompt: `${prompt}\n\n${BRAND_VIDEO_RULES}`,
  };

  if (options?.imageBase64 && options?.imageMimeType) {
    instance.image = {
      bytesBase64Encoded: options.imageBase64,
      mimeType: options.imageMimeType,
    };
  }

  const requestBody = {
    instances: [instance],
    parameters: {
      aspectRatio: options?.aspectRatio || "9:16",
      sampleCount: 1,
      durationSeconds: options?.durationSeconds || 8,
    },
  };

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${model}:predictLongRunning`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    }
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(`Veo API error: ${data.error.message}`);
  }

  if (data.name) {
    return await pollVideoOperation(data.name, apiKey);
  }

  throw new Error("Unexpected Veo response: " + JSON.stringify(data).slice(0, 200));
}

async function pollVideoOperation(operationName: string, apiKey: string, maxWaitSec = 180) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitSec * 1000) {
    const res = await fetch(
      `${GEMINI_API_BASE}/${operationName}`,
      { headers: { "x-goog-api-key": apiKey } }
    );
    const data = await res.json();

    if (data.done) {
      const gvr = data.response?.generateVideoResponse;
      if (gvr?.generatedSamples?.length > 0) {
        const sample = gvr.generatedSamples[0];
        return {
          base64: null,
          mimeType: "video/mp4",
          url: sample.video?.uri || null,
        };
      }

      const videos = data.response?.generatedSamples || data.response?.predictions || [];
      if (videos.length > 0) {
        const video = videos[0];
        return {
          base64: video.bytesBase64Encoded || null,
          mimeType: video.mimeType || "video/mp4",
          url: video.uri || video.video?.uri || null,
        };
      }

      const video = data.response?.video;
      if (video) {
        return {
          base64: video.bytesBase64Encoded || null,
          mimeType: video.mimeType || "video/mp4",
          url: video.uri || null,
        };
      }

      throw new Error("Video done but empty: " + JSON.stringify(data.response).slice(0, 300));
    }

    if (data.error) {
      throw new Error(`Video failed: ${data.error.message}`);
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Video timeout after " + maxWaitSec + "s");
}

// ─── TEXT GENERATION ───

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
    `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(`Gemini text error: ${data.error.message}`);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
