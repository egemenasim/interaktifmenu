import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductForm from '@/components/digital-menu/product-form'

export default async function NewProductPage() {
    const supabase = createClient()

    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    // Get user profile for tier check
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

    // Check if user has access to digital menu
    if (profile && profile.plan !== 'tam_paket' && profile.plan !== 'yarim_paket') {
        redirect('/dashboard')
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Ürün Ekle</h1>
                <p className="text-gray-600">Menünüze yeni bir ürün ekleyin</p>
            </div>

            <div className="max-w-2xl">
                <ProductForm userId={session.user.id} />
            </div>
        </div>
    )
}
