
export interface FridgeItem {
  id: string;
  name: string;
  category: string;
  emoji: string;
  addedAt: number;
  expiresAt: number;
  quantity?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  // Added optional emoji field to ShoppingItem
  emoji?: string;
}

export interface HouseholdData {
  inventory: FridgeItem[];
  shoppingList: ShoppingItem[];
  lastModifiedBy?: string;
  lastAction?: string;
}

export interface FoodInfoResponse {
  days: number;
  category: string;
  emoji: string;
}