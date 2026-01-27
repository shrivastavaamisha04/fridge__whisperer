export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            fridge_items: {
                Row: {
                    id: string
                    household_id: string
                    name: string
                    category: string
                    emoji: string
                    quantity: string
                    added_at: number
                    expires_at: number
                }
                Insert: {
                    id: string
                    household_id: string
                    name: string
                    category: string
                    emoji: string
                    quantity: string
                    added_at: number
                    expires_at: number
                }
                Update: {
                    id?: string
                    household_id?: string
                    name?: string
                    category?: string
                    emoji?: string
                    quantity?: string
                    added_at?: number
                    expires_at?: number
                }
            }
            shopping_items: {
                Row: {
                    id: string
                    household_id: string
                    name: string
                    emoji: string
                }
                Insert: {
                    id: string
                    household_id: string
                    name: string
                    emoji: string
                }
                Update: {
                    id?: string
                    household_id?: string
                    name?: string
                    emoji?: string
                }
            }
        }
    }
}
