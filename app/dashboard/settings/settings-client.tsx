'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SettingsClient({ profile: initialProfile }: { profile: any }) {
    const [restaurantName, setRestaurantName] = useState(initialProfile?.restaurant_name || '')
    const [restaurantSlug, setRestaurantSlug] = useState(initialProfile?.restaurant_slug || '')
    const [happyHourStart, setHappyHourStart] = useState(initialProfile?.happy_hour_start || '')
    const [happyHourEnd, setHappyHourEnd] = useState(initialProfile?.happy_hour_end || '')
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(initialProfile?.logo_url || null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setLogoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setLogoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            let logoUrl = logoPreview

            // Upload logo if provided
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop()
                const fileName = `${session.user.id}/logo.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, logoFile, { upsert: true })

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName)

                logoUrl = publicUrl
            }

            // Validate slug
            if (restaurantSlug) {
                const slugRegex = /^[a-z0-9-]+$/
                if (!slugRegex.test(restaurantSlug)) {
                    throw new Error('Slug sadece küçük harf, rakam ve tire (-) içerebilir')
                }

                // Check if slug is taken by another user
                const { data: existingSlug } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('restaurant_slug', restaurantSlug)
                    .neq('id', session.user.id)
                    .single()

                if (existingSlug) {
                    throw new Error('Bu slug başka bir restoran tarafından kullanılıyor')
                }
            }

            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    restaurant_name: restaurantName,
                    restaurant_slug: restaurantSlug || null,
                    happy_hour_start: happyHourStart || null,
                    happy_hour_end: happyHourEnd || null,
                    logo_url: logoUrl,
                })
                .eq('id', session.user.id)

            if (updateError) throw updateError

            setSuccess('Ayarlar başarıyla güncellendi!')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Ayarlar güncellenirken hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Ayarlar</h1>
                <p className="text-gray-600">Restoran bilgilerinizi ve ayarlarınızı düzenleyin</p>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                {/* Restaurant Info */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Restoran Bilgileri</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Restoran Adı *
                        </label>
                        <input
                            type="text"
                            value={restaurantName}
                            onChange={(e) => setRestaurantName(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Örn: Burger Palace"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Restoran Logo
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        {logoPreview && (
                            <div className="mt-4">
                                <img
                                    src={logoPreview}
                                    alt="Logo Preview"
                                    className="w-32 h-32 object-contain rounded border"
                                />
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                            Logo public menünüzde görünecektir
                        </p>
                    </div>
                </div>

                {/* Public Menu URL */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Public Menü URL</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Restaurant Slug
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">/</span>
                            <input
                                type="text"
                                value={restaurantSlug}
                                onChange={(e) => setRestaurantSlug(e.target.value.toLowerCase())}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="restoranismi"
                                pattern="[a-z0-9-]+"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Sadece küçük harf, rakam ve tire (-) kullanabilirsiniz
                        </p>
                        {restaurantSlug && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-sm text-blue-900">
                                    <strong>Public Menü URL:</strong>
                                    <br />
                                    <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                                        {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/{restaurantSlug}
                                    </code>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Happy Hour Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Happy Hour Ayarları</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Happy Hour saatlerinde ürünlerinizin indirimli fiyatları gösterilir
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Başlangıç Saati
                            </label>
                            <input
                                type="time"
                                value={happyHourStart}
                                onChange={(e) => setHappyHourStart(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bitiş Saati
                            </label>
                            <input
                                type="time"
                                value={happyHourEnd}
                                onChange={(e) => setHappyHourEnd(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Plan Info (Read Only) */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Abonelik Planı</h2>
                    <p className="text-sm text-gray-600">
                        Mevcut Plan: <span className="font-semibold">{initialProfile?.plan || 'Belirsiz'}</span>
                    </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    )
}
