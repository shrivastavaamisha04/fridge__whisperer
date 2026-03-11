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

// Strip trailing punctuation from a food name (danda, period, etc.)
function cleanName(s: string): string {
  return s.trim().replace(/[।.!?،؟]+$/, '').trim();
}

// Parse a multi-item voice transcript into individual fridge items
export async function parseItemList(transcript: string, langCode: string): Promise<ParsedItem[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Use plain JSON mode (no responseSchema) — array schemas can cause silent failures
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a kitchen assistant for an Indian household app. The user spoke in language code "${langCode}".
Voice transcript: "${transcript}"

Extract EACH food/grocery item mentioned and return a JSON array. For each item:
- "name": English normalised name (e.g. "Milk", "Carrot", "Tomatoes")
- "localName": exact name as spoken — preserve original script if non-English (e.g. "दूध", "গাজর"). If already English, same as name.
- "emoji": single most relevant food emoji
- "category": one of Fruit, Vegetable, Dairy, Meat, Bakery, Pantry, Other
- "shelfLifeDays": realistic integer days fresh in fridge
- "quantity": normalise from any language — "ek kilo"/"एक किलो" → "1 kg", "paanch sau gram" → "500 gm", default "500 gm"

Return ONLY the raw JSON array with no markdown fences. Example: [{"name":"Carrot","localName":"गाजर","emoji":"🥕","category":"Vegetable","shelfLifeDays":21,"quantity":"500 gm"}]`,
      config: {
        responseMimeType: "application/json",
      },
    });
    const text = (response.text || "").trim();
    // Strip any accidental markdown fences
    const json = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(json) as ParsedItem[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
  } catch (error) {
    console.error("parseItemList error:", error);
    // Fallback: split by commas / semicolons / Hindi conjunctions / Devanagari danda
    const parts = transcript
      .split(/[,;।\n]|\s+और\s+|\s+aur\s+|\s+and\s+/i)
      .map(cleanName)
      .filter(Boolean);
    const segments = parts.length > 0 ? parts : [cleanName(transcript)];
    return Promise.all(segments.map(async part => {
      const info = await getFoodInfo(part);
      const isNonEnglish = /[^\x00-\x7F]/.test(part);
      return {
        name: part,          // will be corrected in confirmAddToFridge if non-English
        localName: isNonEnglish ? part : part,
        emoji: info.emoji,
        category: info.category,
        shelfLifeDays: info.days,
        quantity: "500 gm",
      };
    }));
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

Extract EACH grocery/shopping item mentioned and return a JSON array. For each:
- "name": English normalised name
- "emoji": single most relevant emoji

Return ONLY the raw JSON array, no markdown. Example: [{"name":"Onion","emoji":"🧅"},{"name":"Tomato","emoji":"🍅"}]`,
      config: {
        responseMimeType: "application/json",
      },
    });
    const text = (response.text || "").trim();
    const json = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(json) as Array<{ name: string; emoji: string }>;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
  } catch (error) {
    console.error("parseShoppingItems error:", error);
    // Fallback: split by commas
    const parts = transcript
      .split(/[,;।\n]|\s+और\s+|\s+aur\s+|\s+and\s+/i)
      .map(cleanName)
      .filter(Boolean);
    return (parts.length > 0 ? parts : [cleanName(transcript)]).map(p => ({ name: p, emoji: "🛍️" }));
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