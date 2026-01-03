import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getCurrentPrice, formatPrice, isHappyHourActive } from '@/lib/utils/pricing'
import Image from 'next/image'

export default async function PublicMenuPage({ params }: { params: { userId: string } }) {
    const supabase = createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.userId)
        .single()

    if (profileError || !profile) {
        notFound()
    }

    // Get active products
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', params.userId)
        .eq('is_active', true)
        .order('category', { ascending: true })

    const happyHourActive = isHappyHourActive(profile.happy_hour_start, profile.happy_hour_end)

    // Group products by category
    const categorizedProducts: Record<string, any[]> = {}
    products?.forEach((product) => {
        const category = product.category || 'Diğer'
        if (!categorizedProducts[category]) {
            categorizedProducts[category] = []
        }
        categorizedProducts[category].push(product)
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">{profile.restaurant_name}</h1>
                        <p className="text-gray-600 mb-4">Dijital Menümüz</p>

                        {happyHourActive && (
                            <div className="inline-block bg-green-100 border-2 border-green-500 text-green-800 px-6 py-3 rounded-lg">
                                <p className="font-semibold">🎉 Happy Hour Aktif!</p>
                                <p className="text-sm">
                                    {profile.happy_hour_start} - {profile.happy_hour_end}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Menu Items */}
                    {Object.entries(categorizedProducts).map(([category, items]) => (
                        <div key={category} className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 bg-white px-4 py-2 rounded-lg shadow">
                                {category}
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {items.map((product) => {
                                    const currentPrice = getCurrentPrice(
                                        product.price,
                                        product.happy_hour_price,
                                        profile.happy_hour_start,
                                        profile.happy_hour_end
                                    )
                                    const isHHPrice = currentPrice !== product.price && product.happy_hour_price !== null

                                    return (
                                        <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                                            <div className="flex">
                                                {product.image_url ? (
                                                    <div className="relative w-32 h-32 flex-shrink-0">
                                                        <Image
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                                        <span className="text-4xl">🍽️</span>
                                                    </div>
                                                )}

                                                <div className="flex-1 p-4">
                                                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name}</h3>
                                                    {product.description && (
                                                        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                                                    )}
                                                    <div>
                                                        <p className={`text-lg font-bold ${isHHPrice ? 'text-green-600' : 'text-gray-900'}`}>
                                                            {formatPrice(currentPrice)}
                                                            {isHHPrice && <span className="text-xs ml-1">🎉</span>}
                                                        </p>
                                                        {isHHPrice && (
                                                            <p className="text-sm text-gray-500 line-through">
                                                                {formatPrice(product.price)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {(!products || products.length === 0) && (
                        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                            <div className="text-6xl mb-4">🍴</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Menü Hazırlanıyor</h3>
                            <p className="text-gray-600">Yakında ürünler eklenecektir</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-center mt-8 text-gray-600">
                        <p className="text-sm">Powered by InteraktifMenu</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
