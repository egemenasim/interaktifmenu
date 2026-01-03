'use client'

import { isHappyHourActive } from '@/lib/utils/pricing'

interface HappyHourIndicatorProps {
    happyHourStart: string | null
    happyHourEnd: string | null
}

export default function HappyHourIndicator({ happyHourStart, happyHourEnd }: HappyHourIndicatorProps) {
    if (!happyHourStart || !happyHourEnd) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                    ℹ️ Happy Hour tanımlı değil. Ayarlar bölümünden Happy Hour saatlerinizi belirleyebilirsiniz.
                </p>
            </div>
        )
    }

    const isActive = isHappyHourActive(happyHourStart, happyHourEnd)

    return (
        <div
            className={`border rounded-lg p-4 ${isActive
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-sm">
                        {isActive ? '✅ Happy Hour Aktif!' : '⏰ Happy Hour Aktif Değil'}
                    </p>
                    <p className="text-sm text-gray-700">
                        Happy Hour Saatleri: {happyHourStart} - {happyHourEnd}
                    </p>
                </div>
                {isActive && (
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Şu anda aktif
                    </span>
                )}
            </div>
        </div>
    )
}
