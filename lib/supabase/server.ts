import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

export function createClient() {
    const cookieStore = cookies()
    return createServerComponentClient<Database>({ cookies: () => cookieStore })
}
