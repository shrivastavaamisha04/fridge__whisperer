import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { FoodInfoResponse } from "../types";
import { FALLBACK_FOOD_DATA } from "../constants";

export async function getFoodInfo(foodName: string): Promise<FoodInfoResponse> {
  const normalized = foodName.toLowerCase().trim();
  if (FALLBACK_FOOD_DATA[normalized]) return FALLBACK_FOOD_DATA[normalized];

  const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            days: { type: SchemaType.NUMBER },
            category: { type: SchemaType.STRING },
            emoji: { type: SchemaType.STRING },
          },
          required: ["days", "category", "emoji"],
        },
      },
    });

    const result = await model.generateContent(
      `Provide grocery item info for "${foodName}". Include estimated days to expiry, category, and one emoji.`
    );
    const text = result.response.text();
    return JSON.parse(text) as FoodInfoResponse;
  } catch (error) {
    console.warn("Gemini AI error, using fallback:", error);
    return { days: 5, category: "Grocery", emoji: "🍱" };
  }
}