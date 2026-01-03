import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CategoriesPage() {
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

    // Fetch categories with product count
    const { data: categories } = await supabase
        .from('categories')
        .select('*, products(count)')
        .eq('user_id', session.user.id)
        .order('display_order', { ascending: true })

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Kategoriler</h1>
                    <p className="text-gray-600">Menü kategorilerinizi yönetin</p>
                </div>
                <Link
                    href="/dashboard/digital-menu/categories/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    + Yeni Kategori
                </Link>
            </div>

            {categories && categories.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category: any) => (
                        <Link
                            key={category.id}
                            href={`/dashboard/digital-menu/categories/${category.id}/edit`}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                        >
                            {category.image_url && (
                                <div className="h-48 overflow-hidden bg-gray-100">
                                    <img
                                        src={category.image_url}
                                        alt={category.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="p-6">
                                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                                {category.description && (
                                    <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                                )}
                                <p className="text-sm text-blue-600 font-medium">
                                    {category.products?.[0]?.count || 0} ürün
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-6xl mb-4">📂</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz kategori eklemediniz</h3>
                    <p className="text-gray-600 mb-6">Ürünlerinizi organize etmek için kategoriler oluşturun</p>
                    <Link
                        href="/dashboard/digital-menu/categories/new"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                    >
                        İlk Kategoriyi Ekle
                    </Link>
                </div>
            )}

            <div className="mt-6">
                <Link
                    href="/dashboard/digital-menu"
                    className="text-blue-600 hover:text-blue-700"
                >
                    ← Dijital Menüye Dön
                </Link>
            </div>
        </div>
    )
}
