
import { GoogleGenAI } from "@google/genai";

// Standard colorization using 2.5 Flash Image
export async function colorizePortrait(base64Image: string): Promise<string> {
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
export async function animatePortrait(
  base64Image: string, 
  onUpdate?: (msg: string) => void,
  orientation: '16:9' | '9:16' = '16:9'
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  onUpdate?.("Starting portrait animation engine...");
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: 'A high-end cinematic portrait animation. The person blinks naturally, moves their head subtly, and displays a very gentle, realistic facial expression. The lighting is cinematic and the background remains steady. 4k resolution feel, smooth temporal consistency.',
    image: {
      imageBytes: base64Image.split(',')[1],
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: orientation
    }
  });

  onUpdate?.("Synthesizing motion frames (this may take a minute)...");

  let pollCount = 0;
  while (!operation.done) {
    pollCount++;
    await new Promise(resolve => setTimeout(resolve, pollCount > 5 ? 10000 : 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
    
    // Rotate reassuring messages
    if (pollCount % 3 === 0) {
      onUpdate?.("Still processing motion... hang tight!");
    } else if (pollCount % 3 === 1) {
      onUpdate?.("Refining facial animations and temporal flow...");
    } else {
      onUpdate?.("Finalizing cinematic export...");
    }
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed: No URI found");

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
