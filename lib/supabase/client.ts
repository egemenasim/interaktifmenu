import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'

export function createClient() {
    return createClientComponentClient<Database>()
}
