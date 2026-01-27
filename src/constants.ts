
export const DEFAULT_HOUSEHOLD_ID = 'my-happy-home';

export const FALLBACK_FOOD_DATA: Record<string, { days: number; category: string; emoji: string }> = {
  // Fruits
  'apple': { days: 14, category: 'Fruit', emoji: '🍎' },
  'apples': { days: 14, category: 'Fruit', emoji: '🍎' },
  'banana': { days: 5, category: 'Fruit', emoji: '🍌' },
  'bananas': { days: 5, category: 'Fruit', emoji: '🍌' },
  'grapes': { days: 7, category: 'Fruit', emoji: '🍇' },
  'grape': { days: 7, category: 'Fruit', emoji: '🍇' },
  'strawberry': { days: 3, category: 'Fruit', emoji: '🍓' },
  'strawberries': { days: 3, category: 'Fruit', emoji: '🍓' },
  'blueberry': { days: 5, category: 'Fruit', emoji: '🫐' },
  'blueberries': { days: 5, category: 'Fruit', emoji: '🫐' },
  'orange': { days: 14, category: 'Fruit', emoji: '🍊' },
  'oranges': { days: 14, category: 'Fruit', emoji: '🍊' },
  'lemon': { days: 14, category: 'Fruit', emoji: '🍋' },
  'lime': { days: 14, category: 'Fruit', emoji: '🍋' },
  'avocado': { days: 3, category: 'Fruit', emoji: '🥑' },
  'tomato': { days: 7, category: 'Vegetable', emoji: '🍅' },
  'tomatoes': { days: 7, category: 'Vegetable', emoji: '🍅' },

  // Vegetables
  'carrot': { days: 21, category: 'Vegetable', emoji: '🥕' },
  'carrots': { days: 21, category: 'Vegetable', emoji: '🥕' },
  'potato': { days: 30, category: 'Vegetable', emoji: '🥔' },
  'potatoes': { days: 30, category: 'Vegetable', emoji: '🥔' },
  'onion': { days: 30, category: 'Vegetable', emoji: '🧅' },
  'onions': { days: 30, category: 'Vegetable', emoji: '🧅' },
  'garlic': { days: 90, category: 'Vegetable', emoji: '🧄' },
  'broccoli': { days: 5, category: 'Vegetable', emoji: '🥦' },
  'spinach': { days: 3, category: 'Vegetable', emoji: '🥬' },
  'lettuce': { days: 5, category: 'Vegetable', emoji: '🥬' },
  'cucumber': { days: 7, category: 'Vegetable', emoji: '🥒' },
  'pepper': { days: 7, category: 'Vegetable', emoji: '🫑' },
  'peppers': { days: 7, category: 'Vegetable', emoji: '🫑' },
  'corn': { days: 5, category: 'Vegetable', emoji: '🌽' },
  'mushroom': { days: 5, category: 'Vegetable', emoji: '🍄' },
  'mushrooms': { days: 5, category: 'Vegetable', emoji: '🍄' },
  'basil': { days: 5, category: 'Vegetable', emoji: '🌿' },

  // Dairy & Eggs
  'milk': { days: 7, category: 'Dairy', emoji: '🥛' },
  'cheese': { days: 14, category: 'Dairy', emoji: '🧀' },
  'butter': { days: 30, category: 'Dairy', emoji: '🧈' },
  'yogurt': { days: 14, category: 'Dairy', emoji: '🍦' },
  'cream': { days: 10, category: 'Dairy', emoji: '🥛' },
  'eggs': { days: 21, category: 'Dairy', emoji: '🥚' },
  'egg': { days: 21, category: 'Dairy', emoji: '🥚' },

  // Bakery
  'bread': { days: 7, category: 'Bakery', emoji: '🍞' },
  'bagel': { days: 5, category: 'Bakery', emoji: '🥯' },
  'croissant': { days: 3, category: 'Bakery', emoji: '🥐' },
  'tortilla': { days: 14, category: 'Bakery', emoji: '🌮' },
  'cake': { days: 3, category: 'Bakery', emoji: '🍰' },

  // Meat & Protein
  'chicken': { days: 3, category: 'Meat', emoji: '🍗' },
  'beef': { days: 3, category: 'Meat', emoji: '🥩' },
  'pork': { days: 3, category: 'Meat', emoji: '🥩' },
  'steak': { days: 3, category: 'Meat', emoji: '🥩' },
  'fish': { days: 2, category: 'Meat', emoji: '🐟' },
  'bacon': { days: 7, category: 'Meat', emoji: '🥓' },
  'ham': { days: 5, category: 'Meat', emoji: '🍖' },
  'sausage': { days: 7, category: 'Meat', emoji: '🌭' },

  // Pantry
  'rice': { days: 365, category: 'Pantry', emoji: '🍚' },
  'pasta': { days: 365, category: 'Pantry', emoji: '🍝' },
  'noodles': { days: 365, category: 'Pantry', emoji: '🍜' },
  'oil': { days: 365, category: 'Pantry', emoji: '🫗' },
  'salt': { days: 365, category: 'Pantry', emoji: '🧂' },
  'sugar': { days: 365, category: 'Pantry', emoji: '🍬' },
  'cereal': { days: 30, category: 'Pantry', emoji: '🥣' },
  'honey': { days: 365, category: 'Pantry', emoji: '🍯' },
  'jam': { days: 30, category: 'Pantry', emoji: '🍓' },

  // Beverages
  'water': { days: 30, category: 'Beverages', emoji: '💧' },
  'juice': { days: 10, category: 'Beverages', emoji: '🧃' },
  'soda': { days: 30, category: 'Beverages', emoji: '🥤' },
  'beer': { days: 30, category: 'Beverages', emoji: '🍺' },
  'wine': { days: 30, category: 'Beverages', emoji: '🍷' },
  'coffee': { days: 30, category: 'Beverages', emoji: '☕' },
  'tea': { days: 365, category: 'Beverages', emoji: '🫖' },

  // Frozen
  'ice cream': { days: 60, category: 'Frozen', emoji: '🍨' },
  'pizza': { days: 30, category: 'Frozen', emoji: '🍕' },
  'fries': { days: 60, category: 'Frozen', emoji: '🍟' },
};

export const CATEGORIES = ['Fruit', 'Vegetable', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Frozen', 'Beverages', 'Snacks', 'Household'];
