import { GoogleGenAI, Type } from "@google/genai";
import { FoodInfoResponse } from "../types";
import { FALLBACK_FOOD_DATA } from "../constants";

export async function getFoodInfo(foodName: string): Promise<FoodInfoResponse> {
  const normalized = foodName.toLowerCase().trim();
  if (FALLBACK_FOOD_DATA[normalized]) return FALLBACK_FOOD_DATA[normalized];

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a food identification assistant for an Indian household app.
The food item name may be in any language — English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, or transliterated (e.g. "doodh", "tamatar", "chawal").
Identify the food item: "${foodName}"
Return:
- days: realistic shelf life in days when stored correctly in a fridge or pantry
- category: one of Fruit, Vegetable, Dairy, Meat, Bakery, Pantry, Other
- emoji: the single most recognisable emoji for this food item`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            days: { type: Type.INTEGER },
            category: { type: Type.STRING },
            emoji: { type: Type.STRING },
          },
          required: ["days", "category", "emoji"],
        },
      },
    });
    const text = response.text || "{}";
    return JSON.parse(text) as FoodInfoResponse;
  } catch (error) {
    console.warn("Gemini AI error, using fallback:", error);
    return { days: 5, category: "Grocery", emoji: "🍱" };
  }
}