import { prisma } from "@/lib/prisma";
import { PersonaStatus } from "@/generated/prisma/client";
import * as elevenlabs from "@/lib/services/elevenlabs";
import * as nanoBanana from "@/lib/services/nano-banana";
import * as arcads from "@/lib/services/arcads";

export interface PersonaConfig {
  name: string;
  description: string;
  appearance: string;
  voicePrompt: string;
  niche?: string;
}

// Generate reference images for a persona using Nano Banana / Gemini
export async function generateReferenceImages(
  personaId: string,
  appearance: string,
  count: number = 4
): Promise<string[]> {
  const prompts = [
    `Professional headshot photo of ${appearance}. Looking directly at camera, warm smile, studio lighting, clean background. Photorealistic, high quality.`,
    `${appearance} in a casual lifestyle setting, natural pose, speaking to camera. Instagram aesthetic, bright and airy. Photorealistic.`,
    `Close-up portrait of ${appearance}, three-quarter angle, confident expression, soft natural lighting. Social media influencer style. Photorealistic.`,
    `${appearance} sitting at a modern desk, speaking animatedly, hands gesturing. Content creator studio background. Photorealistic.`,
  ];

  const results = await nanoBanana.batchGenerate(prompts.slice(0, count));
  const imageUrls = results
    .flat()
    .map((r) => r.imageUrl)
    .filter(Boolean);

  await prisma.aIPersona.update({
    where: { id: personaId },
    data: { imageUrls },
  });

  return imageUrls;
}

// Design a custom voice for the persona via ElevenLabs Voice Design v3
export async function designPersonaVoice(
  personaId: string,
  voicePrompt: string,
  name: string
): Promise<{ voiceId: string }> {
  const result = await elevenlabs.designVoice(voicePrompt, `${name} Voice`);

  await prisma.aIPersona.update({
    where: { id: personaId },
    data: {
      voiceConfig: {
        voiceId: result.voice_id,
        voiceName: result.name,
        voicePrompt,
        previewUrl: result.preview_url,
      },
    },
  });

  return { voiceId: result.voice_id };
}

// Select an Arcads actor for the persona
export async function selectArcadsActor(
  personaId: string,
  actorId: string
): Promise<void> {
  await prisma.aIPersona.update({
    where: { id: personaId },
    data: { arcadsActorId: actorId },
  });
}

// List available Arcads actors for selection
export async function listAvailableActors() {
  return arcads.listActors();
}

// Full persona creation workflow
export async function buildPersona(config: PersonaConfig): Promise<string> {
  // 1. Create the persona record
  const persona = await prisma.aIPersona.create({
    data: {
      name: config.name,
      description: config.description,
      appearance: config.appearance,
      status: PersonaStatus.DRAFT,
    },
  });

  // 2. Generate reference images
  await generateReferenceImages(persona.id, config.appearance);

  // 3. Design voice
  await designPersonaVoice(persona.id, config.voicePrompt, config.name);

  // 4. Activate the persona
  await prisma.aIPersona.update({
    where: { id: persona.id },
    data: { status: PersonaStatus.ACTIVE },
  });

  return persona.id;
}
