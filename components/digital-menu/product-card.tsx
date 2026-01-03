'use client'

import Image from 'next/image'
import Link from 'next/link'
import { getCurrentPrice, formatPrice } from '@/lib/utils/pricing'
import type { Database } from '@/lib/types/database'

type Product = Database['public']['Tables']['products']['Row']

interface ProductCardProps {
    product: Product
    happyHourStart: string | null
    happyHourEnd: string | null
}

export default function ProductCard({ product, happyHourStart, happyHourEnd }: ProductCardProps) {
    const currentPrice = getCurrentPrice(
        product.price,
        product.happy_hour_price,
        happyHourStart,
        happyHourEnd
    )

    const isHappyHourPrice = currentPrice !== product.price && product.happy_hour_price !== null

    return (
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
            {product.image_url ? (
                <div className="relative h-48 w-full bg-gray-200">
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                    />
                </div>
            ) : (
                <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <span className="text-6xl">🍽️</span>
                </div>
            )}

            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    {!product.is_active && (
                        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">Pasif</span>
                    )}
                </div>

                {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                )}

                {product.category && (
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded mb-3">
                        {product.category}
                    </span>
                )}

                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className={`text-lg font-bold ${isHappyHourPrice ? 'text-green-600' : 'text-gray-900'}`}>
                            {formatPrice(currentPrice)}
                            {isHappyHourPrice && <span className="text-xs ml-1">🎉 HH</span>}
                        </p>
                        {isHappyHourPrice && (
                            <p className="text-sm text-gray-500 line-through">
                                {formatPrice(product.price)}
                            </p>
                        )}
                    </div>
                </div>

                <Link
                    href={`/dashboard/digital-menu/${product.id}/edit`}
                    className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                    Düzenle
                </Link>
            </div>
        </div>
    )
}
