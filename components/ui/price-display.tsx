import { formatPrice, getCurrentPrice, isHappyHourActive } from '@/lib/utils/pricing'

interface PriceDisplayProps {
    regularPrice: number
    happyHourPrice: number | null
    happyHourStart: string | null
    happyHourEnd: string | null
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function PriceDisplay({
    regularPrice,
    happyHourPrice,
    happyHourStart,
    happyHourEnd,
    size = 'md'
}: PriceDisplayProps) {
    const currentPrice = getCurrentPrice(regularPrice, happyHourPrice, happyHourStart, happyHourEnd)
    const isHappyHour = isHappyHourActive(happyHourStart, happyHourEnd) && happyHourPrice

    const sizeClasses = {
        sm: { regular: 'text-xs', happy: 'text-sm' },
        md: { regular: 'text-sm', happy: 'text-lg' },
        lg: { regular: 'text-base', happy: 'text-2xl' },
        xl: { regular: 'text-lg', happy: 'text-4xl' }
    }

    if (isHappyHour) {
        return (
            <div className="flex flex-col items-end gap-1">
                {/* Regular price - strikethrough */}
                <span className={`${sizeClasses[size].regular} text-gray-400 line-through`}>
                    {formatPrice(regularPrice)}
                </span>
                {/* Happy Hour price - prominent */}
                <span className={`${sizeClasses[size].happy} font-bold text-red-600`}>
                    {formatPrice(currentPrice)}
                </span>
            </div>
        )
    }

    // Regular pricing
    return (
        <span className={`${sizeClasses[size].happy} font-bold text-gray-900`}>
            {formatPrice(currentPrice)}
        </span>
    )
}
