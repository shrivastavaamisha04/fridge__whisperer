import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { FoodInfoResponse } from "../types";
import { FALLBACK_FOOD_DATA } from "../constants";

export async function getFoodInfo(foodName: string): Promise<FoodInfoResponse> {
  const normalized = foodName.toLowerCase().trim();
  if (FALLBACK_FOOD_DATA[normalized]) return FALLBACK_FOOD_DATA[normalized];

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY || '');
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
      `Provide grocery item info for "${foodName}". 
      - Category: MUST be one of ['Fruit', 'Vegetable', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Frozen', 'Beverages', 'Snacks', 'Household'].
      - If unsure (e.g. rice, pasta), use 'Pantry'. For ice cream, use 'Frozen'.
      - Days: estimated days to expiry.
      - Emoji: The single most specific emoji for this exact food item. (e.g. for "Grapes" return "🍇", NOT "🍎" or "🥗").`
    );
    const text = result.response.text();
    return JSON.parse(text) as FoodInfoResponse;
  } catch (error) {
    console.warn("Gemini AI error/fallback:", error);
    // Defaulting to Vegetable is safer than Meat/Dairy, but might misclassify Fruits.
    // Ideally user inputs specific category, but for now we fallback to Vegetable.
    return { days: 7, category: "Vegetable", emoji: "🍱" };
  }
}