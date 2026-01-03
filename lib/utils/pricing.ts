/**
 * Happy Hour Pricing Logic
 * Determines whether to use regular or Happy Hour price based on current time
 */

export function getCurrentPrice(
    regularPrice: number,
    happyHourPrice: number | null,
    happyHourStart: string | null,
    happyHourEnd: string | null
): number {
    // If no Happy Hour price is set, return regular price
    if (!happyHourPrice || !happyHourStart || !happyHourEnd) {
        return regularPrice
    }

    // Get current time in HH:MM format
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // "HH:MM"

    // Check if current time is within Happy Hour range
    if (currentTime >= happyHourStart && currentTime <= happyHourEnd) {
        return happyHourPrice
    }

    return regularPrice
}

/**
 * Check if currently in Happy Hour period
 */
export function isHappyHourActive(
    happyHourStart: string | null,
    happyHourEnd: string | null
): boolean {
    if (!happyHourStart || !happyHourEnd) {
        return false
    }

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)

    return currentTime >= happyHourStart && currentTime <= happyHourEnd
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
    }).format(price)
}

/**
 * Get product display name with Happy Hour label if active
 */
export function getProductDisplayName(
    productName: string,
    regularPrice: number,
    happyHourPrice: number | null,
    happyHourStart: string | null,
    happyHourEnd: string | null
): string {
    if (!happyHourPrice || !happyHourStart || !happyHourEnd) {
        return productName
    }

    const currentPrice = getCurrentPrice(regularPrice, happyHourPrice, happyHourStart, happyHourEnd)

    // If we're using happy hour price, add label
    if (currentPrice === happyHourPrice) {
        return `${productName} (Happy Hour)`
    }

    return productName
}
