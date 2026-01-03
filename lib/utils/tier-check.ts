/**
 * Tier Access Control
 * Validates user plan against required tiers for feature access
 */

export type Plan = 'tam_paket' | 'yarim_paket' | 'giris_paket'

/**
 * Feature access requirements by tier
 */
export const TIER_ACCESS = {
    DIGITAL_MENU: ['tam_paket', 'yarim_paket'] as Plan[],
    POS: ['tam_paket'] as Plan[],
    PDF_MENU: ['tam_paket', 'yarim_paket', 'giris_paket'] as Plan[],
}

/**
 * Check if user has access to a feature based on their plan
 */
export function hasAccess(userPlan: Plan, requiredPlans: Plan[]): boolean {
    return requiredPlans.includes(userPlan)
}

/**
 * Get plan display name in Turkish
 */
export function getPlanName(plan: Plan): string {
    const names = {
        tam_paket: 'Tam Paket',
        yarim_paket: 'Yarım Paket',
        giris_paket: 'Giriş Paket',
    }
    return names[plan]
}

/**
 * Get plan description
 */
export function getPlanDescription(plan: Plan): string {
    const descriptions = {
        tam_paket: 'Adisyon Takip Sistemi + Dijital Menü',
        yarim_paket: 'Dijital Menü',
        giris_paket: 'PDF Menü',
    }
    return descriptions[plan]
}

/**
 * Get available features for a plan
 */
export function getPlanFeatures(plan: Plan): string[] {
    const features = {
        tam_paket: [
            'Dijital menü yönetimi',
            'Happy Hour desteği',
            'POS sistemi',
            'Masa/bölge yönetimi',
            'Adisyon takibi',
            'QR kod oluşturma',
        ],
        yarim_paket: [
            'Dijital menü yönetimi',
            'Happy Hour desteği',
            'QR kod oluşturma',
            'Fiyat güncelleme',
        ],
        giris_paket: [
            'PDF menü yükleme',
            'QR kod oluşturma',
            'Kolay paylaşım',
        ],
    }
    return features[plan]
}
