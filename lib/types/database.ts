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
            profiles: {
                Row: {
                    id: string
                    email: string
                    plan: 'tam_paket' | 'yarim_paket' | 'giris_paket'
                    restaurant_name: string | null
                    happy_hour_start: string | null
                    happy_hour_end: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    plan: 'tam_paket' | 'yarim_paket' | 'giris_paket'
                    restaurant_name?: string | null
                    happy_hour_start?: string | null
                    happy_hour_end?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    plan?: 'tam_paket' | 'yarim_paket' | 'giris_paket'
                    restaurant_name?: string | null
                    happy_hour_start?: string | null
                    happy_hour_end?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    price: number
                    happy_hour_price: number | null
                    image_url: string | null
                    category: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    price: number
                    happy_hour_price?: number | null
                    image_url?: string | null
                    category?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    price?: number
                    happy_hour_price?: number | null
                    image_url?: string | null
                    category?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            zones: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    created_at?: string
                }
            }
            tables: {
                Row: {
                    id: string
                    zone_id: string
                    user_id: string
                    table_number: string
                    status: 'available' | 'occupied' | 'reserved'
                    created_at: string
                }
                Insert: {
                    id?: string
                    zone_id: string
                    user_id: string
                    table_number: string
                    status?: 'available' | 'occupied' | 'reserved'
                    created_at?: string
                }
                Update: {
                    id?: string
                    zone_id?: string
                    user_id?: string
                    table_number?: string
                    status?: 'available' | 'occupied' | 'reserved'
                    created_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    user_id: string
                    table_id: string | null
                    status: 'open' | 'closed' | 'cancelled'
                    total_amount: number
                    created_at: string
                    closed_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    table_id?: string | null
                    status?: 'open' | 'closed' | 'cancelled'
                    total_amount?: number
                    created_at?: string
                    closed_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    table_id?: string | null
                    status?: 'open' | 'closed' | 'cancelled'
                    total_amount?: number
                    created_at?: string
                    closed_at?: string | null
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string | null
                    product_name: string
                    price_snapshot: number
                    quantity: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id?: string | null
                    product_name: string
                    price_snapshot: number
                    quantity?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string | null
                    product_name?: string
                    price_snapshot?: number
                    quantity?: number
                    created_at?: string
                }
            }
            pdf_menus: {
                Row: {
                    id: string
                    user_id: string
                    file_name: string
                    file_url: string
                    file_size: number
                    qr_code_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    file_name: string
                    file_url: string
                    file_size: number
                    qr_code_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    file_name?: string
                    file_url?: string
                    file_size?: number
                    qr_code_url?: string | null
                    created_at?: string
                }
            }
        }
    }
}
