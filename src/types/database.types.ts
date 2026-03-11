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
                    local_name: string | null
                    local_lang: string | null
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
                    local_name?: string | null
                    local_lang?: string | null
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
                    local_name?: string | null
                    local_lang?: string | null
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
            household_members: {
                Row: {
                    household_id: string
                    user_name: string
                    joined_at: number
                }
                Insert: {
                    household_id: string
                    user_name: string
                    joined_at: number
                }
                Update: {
                    household_id?: string
                    user_name?: string
                    joined_at?: number
                }
            }
        }
    }
}
