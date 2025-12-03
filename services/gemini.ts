import { GoogleGenAI, Type } from "@google/genai";
import { ShapeType, ParticleTheme } from '../types';

// WARNING: In a real production app, never expose keys on client.
// This is for demonstration with the user's local env key.
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateThemeFromPrompt = async (prompt: string): Promise<ParticleTheme | null> => {
  if (!apiKey) {
    console.warn("No API Key provided");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a particle theme based on this description: "${prompt}". 
      Return a JSON object with a hex color code, a label, and the most fitting shape from this list: 
      [Sphere, Heart, Flower, Saturn, Buddha, Fireworks].`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            color: { type: Type.STRING, description: "Hex color code e.g. #FF0000" },
            label: { type: Type.STRING, description: "Short display name for the theme" },
            shape: { type: Type.STRING, enum: Object.values(ShapeType) }
          },
          required: ["color", "label", "shape"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const data = JSON.parse(text);
    return {
      color: data.color,
      shape: data.shape as ShapeType,
      label: data.label
    };
  } catch (error) {
    console.error("Gemini generation error:", error);
    return null;
  }
};
