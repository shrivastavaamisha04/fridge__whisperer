import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { FridgeItem, ShoppingItem } from '../types';

// These will be populated by the user in .env.local
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

export const supabaseService = {
    // Subscribe to real-time changes for a specific household
    subscribe: (householdId: string, onUpdate: (payload: any) => void) => {
        if (!householdId) return () => { };

        const channel = supabase
            .channel(`room:${householdId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'fridge_items', filter: `household_id=eq.${householdId}` },
                (payload) => onUpdate(payload)
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'shopping_items', filter: `household_id=eq.${householdId}` },
                (payload) => onUpdate(payload)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    // Fetch all data for the household
    fetchData: async (householdId: string) => {
        if (!householdId) return { inventory: [], shoppingList: [] };

        const [fridgeRes, shopRes] = await Promise.all([
            supabase.from('fridge_items').select('*').eq('household_id', householdId),
            supabase.from('shopping_items').select('*').eq('household_id', householdId)
        ]);

        if (fridgeRes.error || shopRes.error) {
            const err = fridgeRes.error || shopRes.error;
            console.error("Supabase fetchData error:", err);
            if (err?.code === 'PGRST205') {
                alert("Setup Required: The database tables don't exist yet.");
            } else {
                alert(`Failed to load data: ${err?.message}`);
            }
            return { inventory: [], shoppingList: [] };
        }

        // Map DB types back to App types
        const inventory: FridgeItem[] = (fridgeRes.data || []).map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            emoji: item.emoji,
            quantity: item.quantity,
            addedAt: item.added_at,
            expiresAt: item.expires_at,
            localName: item.local_name ?? undefined,
            localLang: item.local_lang ?? undefined,
        }));

        const shoppingList: ShoppingItem[] = (shopRes.data || []).map(item => ({
            id: item.id,
            name: item.name,
            emoji: item.emoji
        }));

        return { inventory, shoppingList };
    },

    // --- Fridge Operations ---
    addItem: async (item: FridgeItem, householdId: string) => {
        const { error } = await supabase.from('fridge_items').insert({
            id: item.id,
            household_id: householdId,
            name: item.name,
            category: item.category || 'Other',
            emoji: item.emoji || '📦',
            quantity: item.quantity || '500 gm',
            added_at: item.addedAt,
            expires_at: item.expiresAt,
            local_name: item.localName || null,
            local_lang: item.localLang || null,
        });
        if (error) throw new Error(error.message);
    },

    removeItem: async (itemId: string) => {
        const { error } = await supabase.from('fridge_items').delete().eq('id', itemId);
        if (error) throw new Error(error.message);
    },

    updateItemQuantity: async (itemId: string, quantity: string) => {
        const { error } = await supabase.from('fridge_items').update({ quantity }).eq('id', itemId);
        if (error) throw new Error(error.message);
    },

    // --- Shopping List Operations ---
    addShoppingItem: async (item: ShoppingItem, householdId: string) => {
        const { error } = await supabase.from('shopping_items').insert({
            id: item.id,
            household_id: householdId,
            name: item.name,
            emoji: item.emoji || '🛍️'
        });
        if (error) throw new Error(error.message);
    },

    removeShoppingItem: async (itemId: string) => {
        const { error } = await supabase.from('shopping_items').delete().eq('id', itemId);
        if (error) throw new Error(error.message);
    },

    // --- Household Members ---
    upsertMember: async (householdId: string, userName: string) => {
        const { error } = await supabase.from('household_members').upsert({
            household_id: householdId,
            user_name: userName,
            joined_at: Date.now()
        }, { onConflict: 'household_id,user_name' });
        if (error) console.error('Failed to upsert member:', error.message);
    },

    fetchMembers: async (householdId: string): Promise<string[]> => {
        const { data, error } = await supabase
            .from('household_members')
            .select('user_name')
            .eq('household_id', householdId)
            .order('joined_at', { ascending: true });
        if (error) { console.error('Failed to fetch members:', error.message); return []; }
        return (data || []).map(r => r.user_name);
    }
};
