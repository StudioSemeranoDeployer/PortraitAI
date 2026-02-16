
import { GoogleGenAI } from "@google/genai";

// Standard colorization using 2.5 Flash Image
export async function colorizePortrait(base64Image: string): Promise<string> {
  // Use API key directly from environment as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image.split(',')[1],
            mimeType: 'image/png',
          },
        },
        {
          text: "Colorize this black and white portrait photo. Make it look naturally colored, cinematic, and professional. Focus on realistic skin tones and clothing colors. Output only the colorized image.",
        },
      ],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image data returned from API");
}

// Portrait to Video Animation using Veo
export async function animatePortrait(base64Image: string, onUpdate?: (msg: string) => void): Promise<string> {
  // Always create a new GoogleGenAI instance right before the call to use the latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  onUpdate?.("Starting portrait animation engine...");
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: 'A cinematic portrait animation. The person in the photo blinks naturally, smiles slightly, and moves their head gently. Professional lighting, 4k, smooth motion.',
    image: {
      imageBytes: base64Image.split(',')[1],
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  onUpdate?.("Synthesizing motion frames (this may take a minute)...");

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
    onUpdate?.("Still processing motion... hang tight!");
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed: No URI found");

  // Append API key when fetching from the download link as per guidelines
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
