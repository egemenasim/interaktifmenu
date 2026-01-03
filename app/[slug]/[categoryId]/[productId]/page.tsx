import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getProductDisplayName } from '@/lib/utils/pricing'
import PriceDisplay from '@/components/ui/price-display'

export default async function ProductDetailPage({
    params
}: {
    params: { slug: string; categoryId: string; productId: string }
}) {
    const supabase = createClient()

    // Find user by restaurant_slug
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('restaurant_slug', params.slug)
        .single()

    if (!profile) {
        notFound()
    }

    // Get category
    const { data: category } = await supabase
        .from('categories')
        .select('*')
        .eq('id', params.categoryId)
        .single()

    // Get product
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.productId)
        .eq('is_active', true)
        .single()

    if (!product) {
        notFound()
    }

    const displayName = getProductDisplayName(
        product.name,
        product.price,
        product.happy_hour_price,
        profile?.happy_hour_start,
        profile?.happy_hour_end
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 shadow-lg">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/${params.slug}/${params.categoryId}`}
                            className="text-white hover:text-gray-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        {profile.logo_url && (
                            <Image
                                src={profile.logo_url}
                                alt={profile.restaurant_name}
                                width={50}
                                height={50}
                                className="bg-white rounded p-1"
                            />
                        )}
                        <h1 className="text-2xl font-bold">{category?.name?.toUpperCase() || 'MENÜ'}</h1>
                    </div>
                </div>
            </div>

            {/* Product Detail */}
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Product Image */}
                    {product.image_url && (
                        <div className="h-96 overflow-hidden bg-white flex items-center justify-center p-8">
                            <Image
                                src={product.image_url}
                                alt={product.name}
                                width={600}
                                height={400}
                                className="max-h-full object-contain"
                            />
                        </div>
                    )}

                    {/* Product Info */}
                    <div className="p-8 text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            {displayName.toUpperCase()}
                        </h2>

                        {product.description && (
                            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                {product.description}
                            </p>
                        )}

                        <div className="mb-8 flex justify-center">
                            <PriceDisplay
                                regularPrice={product.price}
                                happyHourPrice={product.happy_hour_price}
                                happyHourStart={profile?.happy_hour_start}
                                happyHourEnd={profile?.happy_hour_end}
                                size="xl"
                            />
                        </div>

                        {/* Allergen Info */}
                        <div className="border-t pt-6 text-sm text-gray-500 space-y-2">
                            <p>Tüm gıda ürünlerinde <strong>GLUTEN</strong> bulunmaktadır.</p>
                            <p>Tüm gıda ürünlerinde çapraz bulaşmadan kaynaklı alerjen ürün bulunabilir.</p>
                            <p>Ürün içeriğinde belirtilen gramajlar pişmemiş gramajlardır. Pişmiş gramajlar değişkenlik gösterebilir.</p>
                            <div className="mt-4">
                                <p className="font-semibold mb-1">ALERJENLER:</p>
                                <p className="leading-relaxed">
                                    Gluten İçeren Ürünler, Süt ve Süt Ürünleri, Hardal ve Ürünleri,
                                    Yerfıstığı ve Ürünleri, Soya ve Ürünleri, Susam ve Ürünleri, Acı,
                                    (Kırmızı biber ve biberin türevi olan tüm ürünler) ve daha fazlası.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
