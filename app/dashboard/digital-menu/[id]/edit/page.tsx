import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ProductForm from '@/components/digital-menu/product-form'

export default async function EditProductPage({ params }: { params: { id: string } }) {
    const supabase = createClient()

    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    // Fetch the product
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', session.user.id)
        .single()

    if (error || !product) {
        notFound()
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Ürünü Düzenle</h1>
                <p className="text-gray-600">Ürün bilgilerini güncelleyin</p>
            </div>

            <div className="max-w-2xl">
                <ProductForm userId={session.user.id} product={product} />
            </div>
        </div>
    )
}
