import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.image) {
    return NextResponse.json({ error: "image is required (base64)" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured. Add it to your .env file." },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: body.image, detail: "high" },
            },
            {
              type: "text",
              text: `You are an expert at describing human physical appearance for AI image generation prompts. Analyze this image and write an extremely detailed physical description of the person.

Be VERY specific and detailed about:
- Gender, precise estimated age
- Hair: exact color (not just "blonde" - specify shade like "warm honey blonde with subtle lighter highlights"), texture, length, style, parting
- Eyes: exact color, shape, lash length, brow shape and thickness
- Skin: exact tone (e.g. "light golden tan", "fair with warm peachy undertones"), texture, any freckles/beauty marks
- Face shape: jawline definition, cheekbone prominence, chin shape, forehead proportion
- Nose: size, shape, bridge width
- Lips: fullness, shape, natural color
- Body: build, proportions (if visible)
- Overall aesthetic vibe and energy

Write as ONE detailed paragraph in image-generation prompt style. Do NOT mention clothing, accessories, background, or setting - ONLY physical features. Be precise enough that someone could recreate this exact person from your description alone.`,
            },
          ],
        },
      ],
    });

    const description = response.choices[0]?.message?.content || "";

    return NextResponse.json({ description });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze image" },
      { status: 500 }
    );
  }
}
