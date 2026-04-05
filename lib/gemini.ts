// lib/gemini.ts — Google Gemini API Integration (Images + Videos)

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY nicht gesetzt");
  return key;
}

// ─── IMAGE GENERATION (Nano Banana 2 / Gemini 3.1 Flash Image) ───

export async function generateImage(prompt: string, options?: {
  aspectRatio?: "1:1" | "9:16" | "16:9" | "4:3" | "3:4";
}) {
  const apiKey = getApiKey();
  const model = "gemini-2.0-flash-exp"; // Nano Banana 2

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate an image: ${prompt}. 
                Style: Professional, clean, Swiss Alpine aesthetic. 
                Brand colors: deep forest green, meadow green, white, gold accents.
                ${options?.aspectRatio === "9:16" ? "Portrait orientation for Instagram Reels/Stories." : ""}
                ${options?.aspectRatio === "1:1" ? "Square format for Instagram feed." : ""}
                Do NOT include any cannabis leaves, smoking imagery, or drug references.
                Focus on: Alpine landscapes, clean medical aesthetics, nature, Swiss quality.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          imageSizes: options?.aspectRatio === "9:16" ? "PORTRAIT" : 
                      options?.aspectRatio === "1:1" ? "SQUARE" : "LANDSCAPE",
        },
      }),
    }
  );

  const data = await res.json();

  // Extract image from response
  const imagePart = data.candidates?.[0]?.content?.parts?.find(
    (p: any) => p.inlineData?.mimeType?.startsWith("image/")
  );

  if (!imagePart) {
    throw new Error("No image generated. Response: " + JSON.stringify(data));
  }

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
}

// ─── VIDEO GENERATION (Veo 2 / Veo 3.1) ───

export async function generateVideo(prompt: string, options?: {
  model?: "veo-2.0-generate-001" | "veo-3.1-generate-preview";
  aspectRatio?: "16:9" | "9:16";
  durationSeconds?: 4 | 6 | 8;
  imageBase64?: string;
  imageMimeType?: string;
}) {
  const apiKey = getApiKey();
  const model = options?.model || "veo-2.0-generate-001";

  const requestBody: any = {
    instances: [
      {
        prompt: `${prompt}. 
          Cinematic quality, smooth camera movements.
          Brand aesthetic: Swiss Alps, green meadows, clean medical look.
          NO smoking, NO drug imagery, NO cannabis leaves.
          Professional, premium, nature-focused.`,
      },
    ],
    parameters: {
      aspectRatio: options?.aspectRatio || "9:16",
      sampleCount: 1,
      durationSeconds: options?.durationSeconds || 8,
    },
  };

  // Image-to-Video: add reference image
  if (options?.imageBase64 && options?.imageMimeType) {
    requestBody.instances[0].image = {
      bytesBase64Encoded: options.imageBase64,
      mimeType: options.imageMimeType,
    };
  }

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${model}:predict?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  );

  const data = await res.json();

  // Veo returns an operation for async processing
  if (data.name) {
    // Poll for completion
    return await pollVideoOperation(data.name, apiKey);
  }

  // Direct response with video
  const videoPart = data.predictions?.[0];
  if (!videoPart) {
    throw new Error("No video generated. Response: " + JSON.stringify(data));
  }

  return {
    base64: videoPart.bytesBase64Encoded,
    mimeType: videoPart.mimeType || "video/mp4",
    url: videoPart.uri,
  };
}

async function pollVideoOperation(operationName: string, apiKey: string, maxWaitSec = 120) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitSec * 1000) {
    const res = await fetch(
      `${GEMINI_API_BASE}/${operationName}?key=${apiKey}`
    );
    const data = await res.json();

    if (data.done) {
      const video = data.response?.predictions?.[0];
      if (!video) throw new Error("Video operation completed but no video returned");
      return {
        base64: video.bytesBase64Encoded,
        mimeType: video.mimeType || "video/mp4",
        url: video.uri,
      };
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Video generation timeout after " + maxWaitSec + "s");
}

// ─── CONTENT GENERATION (Gemini for text) ───

export async function generateText(prompt: string, systemPrompt?: string) {
  const apiKey = getApiKey();
  const model = "gemini-2.0-flash";

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
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
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ─── UPLOAD TO PUBLICLY ACCESSIBLE URL ───
// Instagram requires media to be hosted on a public URL
// In production, upload to Google Cloud Storage, Cloudinary, or similar

export async function uploadMediaForInstagram(
  base64Data: string,
  mimeType: string,
  filename: string
): Promise<string> {
  // Option 1: Upload to a public bucket
  // For now, we return a placeholder — in production, integrate with:
  // - Google Cloud Storage
  // - Cloudinary (free tier available)
  // - Vercel Blob Storage
  
  // TODO: Implement actual upload
  // Example with Cloudinary:
  // const cloudinary = require('cloudinary').v2;
  // const result = await cloudinary.uploader.upload(`data:${mimeType};base64,${base64Data}`);
  // return result.secure_url;

  throw new Error(
    "Media upload not configured. Set up Cloudinary or Google Cloud Storage. " +
    "See README.md for instructions."
  );
}
