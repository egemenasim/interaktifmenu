import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getProductDisplayName } from '@/lib/utils/pricing'
import PriceDisplay from '@/components/ui/price-display'

export default async function CategoryProductsPage({
    params
}: {
    params: { slug: string; categoryId: string }
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
        .eq('user_id', profile.id)
        .single()

    if (!category) {
        notFound()
    }

    // Get products in this category
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', params.categoryId)
        .eq('is_active', true)
        .order('name', { ascending: true })

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 shadow-lg">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/${params.slug}`}
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
                        <h1 className="text-2xl font-bold">{category.name.toUpperCase()}</h1>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="container mx-auto px-4 py-4 md:py-8">
                {products && products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {products.map((product: any) => {
                            const displayName = getProductDisplayName(
                                product.name,
                                product.price,
                                product.happy_hour_price,
                                profile?.happy_hour_start,
                                profile?.happy_hour_end
                            )

                            return (
                                <Link
                                    key={product.id}
                                    href={`/${params.slug}/${params.categoryId}/${product.id}`}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
                                >
                                    {product.image_url && (
                                        <div className="h-56 overflow-hidden">
                                            <Image
                                                src={product.image_url}
                                                alt={product.name}
                                                width={400}
                                                height={300}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                                            {displayName.toUpperCase()}
                                        </h3>
                                        {product.description && (
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                {product.description}
                                            </p>
                                        )}
                                        <PriceDisplay
                                            regularPrice={product.price}
                                            happyHourPrice={product.happy_hour_price}
                                            happyHourStart={profile?.happy_hour_start}
                                            happyHourEnd={profile?.happy_hour_end}
                                            size="lg"
                                        />
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Bu kategoride ürün yok.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
