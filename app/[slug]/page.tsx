import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, getCurrentPrice } from '@/lib/utils/pricing'

export default async function PublicMenuBySlug({ params }: { params: { slug: string } }) {
    const supabase = createClient()

    // Find user by restaurant_slug
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('restaurant_slug', params.slug)
        .single()

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Restoran Bulunamadı</h1>
                    <p className="text-gray-600">Bu menü mevcut değil.</p>
                </div>
            </div>
        )
    }

    // Fetch categories with products
    const { data: categories } = await supabase
        .from('categories')
        .select('*, products!products_category_id_fkey(*)')
        .eq('user_id', profile.id)
        .order('display_order', { ascending: true })

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-6 shadow-lg">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-4">
                        {profile.logo_url && (
                            <Image
                                src={profile.logo_url}
                                alt={profile.restaurant_name}
                                width={60}
                                height={60}
                                className="bg-white rounded p-2"
                            />
                        )}
                        <h1 className="text-3xl font-bold">{profile.restaurant_name} Menü</h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold text-red-700 mb-6">Kategoriler</h2>

                {/* Categories Grid */}
                {categories && categories.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {categories.map((category: any) => {
                            const activeProducts = category.products?.filter((p: any) => p.is_active) || []
                            if (activeProducts.length === 0) return null

                            return (
                                <Link
                                    key={category.id}
                                    href={`/${params.slug}/${category.id}`}
                                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
                                >
                                    {category.image_url && (
                                        <div className="h-48 overflow-hidden">
                                            <Image
                                                src={category.image_url}
                                                alt={category.name}
                                                width={400}
                                                height={300}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="p-4 text-center">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                            {category.name.toUpperCase()}
                                        </h3>
                                        <p className="text-sm text-gray-600">{activeProducts.length} Ürün</p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Henüz menü eklenmemiş.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
