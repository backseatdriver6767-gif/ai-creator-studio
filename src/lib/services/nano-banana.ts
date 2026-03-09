// Nano Banana 2 image generation via Google Gemini API
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

function apiKey() {
  return process.env.GOOGLE_AI_API_KEY!;
}

export interface ImageGenerationResult {
  imageUrl: string; // base64 data URI or URL
  mimeType: string;
}

export async function generateImage(
  prompt: string,
  options: {
    aspectRatio?: "1:1" | "9:16" | "16:9" | "4:3" | "3:4";
    numberOfImages?: number;
  } = {}
): Promise<ImageGenerationResult[]> {
  const res = await fetch(
    `${BASE_URL}/models/gemini-2.0-flash-exp:generateContent?key=${apiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          responseMimeType: "image/png",
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`Nano Banana generateImage failed: ${res.status}`);
  const data = await res.json();

  const images: ImageGenerationResult[] = [];
  for (const candidate of data.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData) {
        images.push({
          imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          mimeType: part.inlineData.mimeType,
        });
      }
    }
  }
  return images;
}

export async function editImage(
  imageBase64: string,
  imageMimeType: string,
  prompt: string
): Promise<ImageGenerationResult[]> {
  const res = await fetch(
    `${BASE_URL}/models/gemini-2.0-flash-exp:generateContent?key=${apiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: imageMimeType,
                  data: imageBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          responseMimeType: "image/png",
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`Nano Banana editImage failed: ${res.status}`);
  const data = await res.json();

  const images: ImageGenerationResult[] = [];
  for (const candidate of data.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData) {
        images.push({
          imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          mimeType: part.inlineData.mimeType,
        });
      }
    }
  }
  return images;
}

export async function batchGenerate(
  prompts: string[]
): Promise<ImageGenerationResult[][]> {
  return Promise.all(prompts.map((p) => generateImage(p)));
}
