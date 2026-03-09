import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return _anthropic;
}

export interface ScriptResult {
  script: string;
  hook: string;
  callToAction: string;
  estimatedDuration: number;
}

export interface ContentIdeaResult {
  title: string;
  hook: string;
  concept: string;
  format: string;
  targetEmotion: string;
}

export async function generateScript(
  personaName: string,
  personaDescription: string,
  contentType: string,
  topic: string,
  niche: string,
  options: { duration?: number; platform?: string } = {}
): Promise<ScriptResult> {
  const msg = await getAnthropic().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a viral social media scriptwriter. Write a ${contentType.toLowerCase()} script for an AI persona.

PERSONA: ${personaName} - ${personaDescription}
NICHE: ${niche}
TOPIC: ${topic}
TARGET DURATION: ${options.duration || 7} seconds
PLATFORM: ${options.platform || "Instagram Reels"}

Requirements:
- STRICT ${options.duration || 7}-SECOND LIMIT. The script must be speakable in ${options.duration || 7} seconds at a natural, slightly fast pace. That means roughly ${Math.round((options.duration || 7) * 2.5)} words MAX.
- Start with a powerful hook in the first 1-2 seconds
- Keep it punchy, direct, and conversational
- Include a clear call-to-action (e.g. "Comment BLUEPRINT", "Link in bio")
- Focus on money/results hooks: income claims, ease of setup, "I did the hard work for you"
- Optimize for the platform's algorithm (engagement, watch time, shares)

Example tone for a 7-second blueprint promo:
"Make 10 grand a month copying my blueprint. This video was generated using it. Paste it into Claude Code and you're set. Comment BLUEPRINT."

Respond in JSON format:
{
  "script": "The full script text the persona will say",
  "hook": "The opening hook line",
  "callToAction": "The CTA at the end",
  "estimatedDuration": <seconds>
}`,
      },
    ],
  });

  const text =
    msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse script response");
  return JSON.parse(jsonMatch[0]);
}

export async function generateContentIdeas(
  personaName: string,
  niche: string,
  count: number = 10
): Promise<ContentIdeaResult[]> {
  const msg = await getAnthropic().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `Generate ${count} viral content ideas for an AI persona named ${personaName} in the "${niche}" niche.

Each idea should be designed for maximum engagement on Instagram Reels / TikTok.

Focus on:
- Pattern interrupt hooks
- Emotional triggers (curiosity, FOMO, aspiration)
- Trending formats (PSA, POV, storytime, tutorial, hot take)
- Shareability

Respond in JSON format as an array:
[{
  "title": "Short catchy title",
  "hook": "The opening hook (what they see/hear in first 2 seconds)",
  "concept": "Brief description of the content",
  "format": "REEL | STORY | POST | CAROUSEL",
  "targetEmotion": "curiosity | FOMO | aspiration | humor | shock"
}]`,
      },
    ],
  });

  const text =
    msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Failed to parse ideas response");
  return JSON.parse(jsonMatch[0]);
}

export async function generateCaptions(
  script: string,
  platform: string
): Promise<{ caption: string; hashtags: string[] }> {
  const msg = await getAnthropic().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `Write a ${platform} caption for this video script:

"${script}"

Requirements:
- Engaging caption that complements (not repeats) the video
- Include a CTA
- Suggest 15-20 relevant hashtags mixing popular and niche tags

Respond in JSON:
{
  "caption": "The caption text",
  "hashtags": ["#tag1", "#tag2", ...]
}`,
      },
    ],
  });

  const text =
    msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse captions response");
  return JSON.parse(jsonMatch[0]);
}
