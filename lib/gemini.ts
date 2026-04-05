// lib/gemini.ts — Google Gemini API Integration (Images + Videos)
// CORRECTED: Uses proper model names and imageConfig parameters

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
  const model = "gemini-3.1-flash-image-preview";

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
                Do NOT include any cannabis leaves, smoking imagery, or drug references.
                Focus on: Alpine landscapes, clean medical aesthetics, nature, Swiss quality.`,
              },
            ],
          },
        ],
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

  // Extract image from response
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

// ─── VIDEO GENERATION (Veo 2 / Veo 3.1) ───

export async function generateVideo(prompt: string, options?: {
  model?: "veo-2.0-generate-001" | "veo-3.1-generate-preview";
  aspectRatio?: "16:9" | "9:16";
  durationSeconds?: 4 | 6 | 8;
}) {
  const apiKey = getApiKey();
  const model = options?.model || "veo-2.0-generate-001";

  const requestBody = {
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

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${model}:predict?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(`Veo API error: ${data.error.message}`);
  }

  // Veo returns an operation for async processing
  if (data.name) {
    return await pollVideoOperation(data.name, apiKey);
  }

  const videoPart = data.predictions?.[0];
  if (!videoPart) {
    throw new Error("No video generated.");
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
  throw new Error("Video generation timeout");
}

// ─── TEXT GENERATION (for captions) ───

export async function generateText(prompt: string, systemPrompt?: string) {
  const apiKey = getApiKey();
  const model = "gemini-2.5-flash";

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 2048,
    },
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
