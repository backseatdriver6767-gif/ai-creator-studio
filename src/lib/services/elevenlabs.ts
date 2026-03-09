const BASE_URL = "https://api.elevenlabs.io/v1";

function headers() {
  return {
    "xi-api-key": process.env.ELEVENLABS_API_KEY!,
    "Content-Type": "application/json",
  };
}

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url: string;
}

export interface VoiceDesignResult {
  voice_id: string;
  name: string;
  preview_url: string;
}

export async function listVoices(): Promise<Voice[]> {
  const res = await fetch(`${BASE_URL}/voices`, { headers: headers() });
  if (!res.ok) throw new Error(`ElevenLabs listVoices failed: ${res.status}`);
  const data = await res.json();
  return data.voices;
}

export async function getVoice(voiceId: string): Promise<Voice> {
  const res = await fetch(`${BASE_URL}/voices/${voiceId}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`ElevenLabs getVoice failed: ${res.status}`);
  return res.json();
}

export async function designVoice(prompt: string, name: string): Promise<VoiceDesignResult> {
  // Step 1: Generate voice preview from text description
  const res = await fetch(`${BASE_URL}/text-to-voice/design`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      voice_description: prompt,
      text: "Hello! I'm so excited to be working with you today. Let me show you exactly what I can do with this amazing voice. I think you're really going to love it once you hear everything.",
      auto_generate_text: false,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs designVoice failed (${res.status}): ${body}`);
  }
  const data = await res.json();

  // Get the first preview's generated voice ID
  const preview = data.previews?.[0];
  if (!preview) throw new Error("No voice previews generated");

  // Step 2: Save the voice from the preview
  const createRes = await fetch(`${BASE_URL}/text-to-voice`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      voice_name: name,
      voice_description: prompt,
      generated_voice_id: preview.generated_voice_id,
    }),
  });
  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`ElevenLabs createVoice failed (${createRes.status}): ${body}`);
  }
  const voice = await createRes.json();
  return {
    voice_id: voice.voice_id,
    name: voice.name,
    preview_url: voice.preview_url || "",
  };
}

export async function generateSpeech(
  voiceId: string,
  text: string,
  options: {
    model_id?: string;
    stability?: number;
    similarity_boost?: number;
  } = {}
): Promise<ArrayBuffer> {
  const res = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      text,
      model_id: options.model_id || "eleven_multilingual_v2",
      voice_settings: {
        stability: options.stability ?? 0.75,
        similarity_boost: options.similarity_boost ?? 0.75,
      },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs generateSpeech failed: ${res.status}`);
  return res.arrayBuffer();
}
