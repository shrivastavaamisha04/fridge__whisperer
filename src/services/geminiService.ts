import { GoogleGenAI, Type } from "@google/genai";
import { FoodInfoResponse } from "../types";
import { FALLBACK_FOOD_DATA } from "../constants";

export interface ParsedItem {
  name: string;         // English normalised name
  localName: string;    // as spoken / original script
  emoji: string;
  category: string;
  shelfLifeDays: number;
  quantity: string;     // e.g. "1 kg", "500 gm"
}

// Parse a multi-item voice transcript into individual fridge items
export async function parseItemList(transcript: string, langCode: string): Promise<ParsedItem[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a kitchen assistant for an Indian household app. The user spoke in language code "${langCode}".
Voice transcript: "${transcript}"

Extract EACH food/grocery item mentioned. For each:
- name: English normalised name (e.g. "Milk", "Tomatoes")
- localName: exact name as spoken — preserve original script/language if non-English (e.g. "दूध", "টমেটো"). If already English, same as name.
- emoji: single most relevant food emoji
- category: one of [Fruit, Vegetable, Dairy, Meat, Bakery, Pantry, Other]
- shelfLifeDays: realistic days fresh in fridge
- quantity: extract from speech in ANY language and normalise:
  "ek kilo"/"एक किलो"/"এক কেজি" → "1 kg"
  "do kilo"/"দুই কেজি" → "2 kg"
  "paanch sau gram"/"পাঁচশো গ্রাম" → "500 gm"
  "ek litre"/"এক লিটার" → "1 litre"
  If no quantity mentioned → "500 gm"

Return ONLY a valid JSON array, no markdown.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name:          { type: Type.STRING },
              localName:     { type: Type.STRING },
              emoji:         { type: Type.STRING },
              category:      { type: Type.STRING },
              shelfLifeDays: { type: Type.INTEGER },
              quantity:      { type: Type.STRING },
            },
            required: ["name", "localName", "emoji", "category", "shelfLifeDays", "quantity"],
          },
        },
      },
    });
    const text = response.text || "[]";
    const parsed = JSON.parse(text) as ParsedItem[];
    return parsed.length > 0 ? parsed : [];
  } catch (error) {
    console.warn("parseItemList error, falling back:", error);
    const info = await getFoodInfo(transcript);
    return [{
      name: transcript.trim(),
      localName: transcript.trim(),
      emoji: info.emoji,
      category: info.category,
      shelfLifeDays: info.days,
      quantity: "500 gm",
    }];
  }
}

// Parse a voice transcript into shopping list items (name + emoji only)
export async function parseShoppingItems(transcript: string, langCode: string): Promise<Array<{ name: string; emoji: string }>> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a kitchen assistant for an Indian household. The user spoke in language code "${langCode}".
Voice transcript: "${transcript}"

Extract EACH grocery/shopping item mentioned. For each:
- name: English normalised name
- emoji: single most relevant emoji

Return ONLY a valid JSON array, no markdown.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name:  { type: Type.STRING },
              emoji: { type: Type.STRING },
            },
            required: ["name", "emoji"],
          },
        },
      },
    });
    const text = response.text || "[]";
    return JSON.parse(text) as Array<{ name: string; emoji: string }>;
  } catch (error) {
    console.warn("parseShoppingItems error:", error);
    return [{ name: transcript.trim(), emoji: "🛍️" }];
  }
}

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