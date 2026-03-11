
export interface FridgeItem {
  id: string;
  name: string;
  category: string;
  emoji: string;
  addedAt: number;
  expiresAt: number;
  quantity?: string;
  localName?: string;  // name as spoken (e.g. "दूध", "টমেটো")
  localLang?: string;  // language it was added in (e.g. "hi-IN", "bn-IN")
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