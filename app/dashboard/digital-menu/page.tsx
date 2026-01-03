import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/digital-menu/product-card'
import HappyHourIndicator from '@/components/digital-menu/happy-hour-indicator'

export default async function DigitalMenuPage() {
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

    // Fetch products
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name', { ascending: true })

    // Fetch categories
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Dijital Menü</h1>
                    <p className="text-gray-600">Menü ürünlerinizi yönetin ve düzenleyin</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/digital-menu/categories"
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                    >
                        Kategoriler
                    </Link>
                    <Link
                        href="/dashboard/digital-menu/new"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        + Yeni Ürün Ekle
                    </Link>
                </div>
            </div>

            {/* Happy Hour Indicator */}
            <HappyHourIndicator profile={profile} />

            {/* Categories with Products */}
            {categories && categories.length > 0 ? (
                <div className="space-y-8">
                    {categories.map((category: any) => {
                        const categoryProducts = products?.filter((p: any) => p.category_id === category.id) || []

                        if (categoryProducts.length === 0) return null

                        return (
                            <div key={category.id} className="bg-white rounded-lg shadow p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                                    <Link
                                        href={`/dashboard/digital-menu/categories/${category.id}/edit`}
                                        className="text-blue-600 hover:text-blue-700 text-sm"
                                    >
                                        Kategoriyi Düzenle
                                    </Link>
                                </div>
                                {category.description && (
                                    <p className="text-gray-600 mb-4">{category.description}</p>
                                )}
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {categoryProducts.map((product: any) => (
                                        <ProductCard key={product.id} product={product} profile={profile} />
                                    ))}
                                </div>
                            </div>
                        )
                    })}

                    {/* Uncategorized Products */}
                    {products && products.filter((p: any) => !p.category_id).length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Kategorisiz Ürünler</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.filter((p: any) => !p.category_id).map((product: any) => (
                                    <ProductCard key={product.id} product={product} profile={profile} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : products && products.length > 0 ? (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Tüm Ürünler</h2>
                    <p className="text-gray-600 mb-4">Henüz kategori eklemediniz. <Link href="/dashboard/digital-menu/categories/new" className="text-blue-600 hover:underline">Kategori ekleyin</Link></p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product: any) => (
                            <ProductCard key={product.id} product={product} profile={profile} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                    <div className="text-6xl mb-4">🍴</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz ürün eklemediniz</h3>
                    <p className="text-gray-600 mb-6">İlk ürününüzü ekleyerek dijital menünüzü oluşturmaya başlayın</p>
                    <Link
                        href="/dashboard/digital-menu/new"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        İlk Ürünü Ekle
                    </Link>
                </div>
            )}
        </div>
    )
}
