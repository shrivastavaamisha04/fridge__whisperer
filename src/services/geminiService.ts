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

// Translate a non-English food word to its English name via Gemini
async function translateToEnglish(ai: GoogleGenAI, localWord: string): Promise<string> {
  try {
    const resp = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Translate this food item to English. Reply with ONLY 1-3 English words, no punctuation, no explanation. Input: "${localWord}"`,
    });
    const raw = (resp.text || '').trim().replace(/["""'.,!?]/g, '').trim();
    // Only accept if response starts with a Latin letter (guards against Hindi/etc. slipping through)
    const match = raw.match(/^[A-Za-z][A-Za-z\s]{0,40}/);
    return match ? match[0].trim() : localWord;
  } catch {
    return localWord;
  }
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
- "name": MUST be the English name only. Translate from any language. NEVER put Hindi/Devanagari/Bengali/Tamil/any non-Latin script in this field. Examples: "दूध"→"Milk", "टमाटर"→"Tomato", "गाजर"→"Carrot", "प्याज"→"Onion", "आलू"→"Potato", "दही"→"Yogurt"
- "localName": the exact word as spoken, in the original script (e.g. "टमाटर", "দুধ"). If the user spoke in English, set localName same as name.
- "emoji": single most relevant food emoji
- "category": one of Fruit, Vegetable, Dairy, Meat, Bakery, Pantry, Other
- "shelfLifeDays": realistic integer days fresh in fridge
- "quantity": normalise from any language — "ek kilo"/"एक किलो" → "1 kg", "paanch sau gram" → "500 gm", default "500 gm"

CRITICAL RULE: "name" field must ALWAYS be English. This is non-negotiable.
Return ONLY the raw JSON array with no markdown fences.
Example input: "टमाटर और गाजर"
Example output: [{"name":"Tomato","localName":"टमाटर","emoji":"🍅","category":"Vegetable","shelfLifeDays":7,"quantity":"500 gm"},{"name":"Carrot","localName":"गाजर","emoji":"🥕","category":"Vegetable","shelfLifeDays":21,"quantity":"500 gm"}]`,
      config: {
        responseMimeType: "application/json",
      },
    });
    const text = (response.text || "").trim();
    // Strip any accidental markdown fences
    const json = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(json) as ParsedItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [];

    console.log('[Gemini parseItemList] raw result:', JSON.stringify(parsed));

    // Post-process: if "name" is non-English (Gemini ignored our instruction), translate it
    const processed = await Promise.all(parsed.map(async (item) => {
      const nameIsNonEnglish = /[^\x00-\x7F]/.test(item.name);
      if (nameIsNonEnglish) {
        // Gemini put local script in "name" — save it as localName and translate
        const localWord = item.name;
        if (!item.localName || item.localName === item.name) {
          item.localName = localWord;
        }
        item.name = await translateToEnglish(ai, localWord);
        console.log(`[Gemini parseItemList] auto-translated "${localWord}" → "${item.name}"`);
      }
      return item;
    }));

    return processed;
  } catch (error) {
    console.error("parseItemList error, using fallback:", error);
    // Fallback: split by commas / semicolons / Hindi conjunctions / Devanagari danda
    const parts = transcript
      .split(/[,;।\n]|\s+और\s+|\s+aur\s+|\s+and\s+/i)
      .map(cleanName)
      .filter(Boolean);
    const segments = parts.length > 0 ? parts : [cleanName(transcript)];
    return Promise.all(segments.map(async part => {
      const info = await getFoodInfo(part);
      const isNonEnglish = /[^\x00-\x7F]/.test(part);
      // For non-English parts, try to get an English name
      const englishName = isNonEnglish ? await translateToEnglish(ai, part) : part;
      return {
        name: englishName,
        localName: isNonEnglish ? part : englishName,
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
- "name": English name only (translate from any language — "टमाटर"→"Tomato", "दूध"→"Milk", etc.)
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
      model: "gemini-2.0-flash",
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
