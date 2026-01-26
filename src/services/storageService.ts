import { FridgeItem, ShoppingItem } from '../types';

const STORAGE_KEY_PREFIX = 'fridge_whisperer_';

export const storageService = {
  saveData: (kitchenId: string, inventory: FridgeItem[], shoppingList: ShoppingItem[]) => {
    const data = JSON.stringify({ inventory, shoppingList, lastUpdate: Date.now() });
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${kitchenId}`, data);
  },

  loadData: (kitchenId: string) => {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${kitchenId}`);
    if (!raw) return { inventory: [], shoppingList: [] };
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Storage parse error", e);
      return { inventory: [], shoppingList: [] };
    }
  },

  clearData: () => {
    localStorage.clear();
  }
};