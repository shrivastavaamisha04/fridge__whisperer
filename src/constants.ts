
export const DEFAULT_HOUSEHOLD_ID = 'my-happy-home';

export const FALLBACK_FOOD_DATA: Record<string, { days: number; category: string; emoji: string }> = {
  'milk': { days: 7, category: 'Dairy', emoji: '🥛' },
  'eggs': { days: 21, category: 'Dairy', emoji: '🥚' },
  'strawberries': { days: 4, category: 'Fruit', emoji: '🍓' },
  'strawberry': { days: 4, category: 'Fruit', emoji: '🍓' },
  'spinach': { days: 5, category: 'Vegetable', emoji: '🥬' },
  'chicken': { days: 2, category: 'Meat', emoji: '🍗' },
  'bread': { days: 6, category: 'Bakery', emoji: '🍞' },
  'bananas': { days: 5, category: 'Fruit', emoji: '🍌' },
  'banana': { days: 5, category: 'Fruit', emoji: '🍌' },
  'apples': { days: 30, category: 'Fruit', emoji: '🍎' },
  'apple': { days: 30, category: 'Fruit', emoji: '🍎' },
  'yogurt': { days: 14, category: 'Dairy', emoji: '🍦' },
  'avocado': { days: 4, category: 'Fruit', emoji: '🥑' },
  'fish': { days: 2, category: 'Meat', emoji: '🐟' },
  'beef': { days: 3, category: 'Meat', emoji: '🥩' },
  'tomatoes': { days: 7, category: 'Vegetable', emoji: '🍅' },
  'onions': { days: 14, category: 'Vegetable', emoji: '🧅' },
  'garlic': { days: 90, category: 'Vegetable', emoji: '🧄' },
  'lemon': { days: 14, category: 'Fruit', emoji: '🍋' },
  'basil': { days: 5, category: 'Vegetable', emoji: '🌿' },
  'grapes': { days: 7, category: 'Fruit', emoji: '🍇' },
  'grape': { days: 7, category: 'Fruit', emoji: '🍇' },
  'carrots': { days: 21, category: 'Vegetable', emoji: '🥕' },
  'carrot': { days: 21, category: 'Vegetable', emoji: '🥕' },
  'potatoes': { days: 30, category: 'Vegetable', emoji: '🥔' },
  'potato': { days: 30, category: 'Vegetable', emoji: '🥔' },
  'juice': { days: 10, category: 'Beverages', emoji: '🧃' },
  'rice': { days: 180, category: 'Pantry', emoji: '🍚' },
};

export const CATEGORIES = ['Fruit', 'Vegetable', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Frozen', 'Beverages', 'Snacks', 'Household'];
