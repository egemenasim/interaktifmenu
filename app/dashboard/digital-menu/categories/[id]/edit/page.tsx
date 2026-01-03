import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CategoryEditClient from './category-edit-client'

export default async function CategoryEditPage({ params }: { params: { id: string } }) {
    const supabase = createClient()

    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    // Fetch category
    const { data: category } = await supabase
        .from('categories')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', session.user.id)
        .single()

    if (!category) {
        notFound()
    }

    return <CategoryEditClient category={category} />
}
