'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NewCategoryPage() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            let imageUrl = null

            // Upload image if provided
            if (image) {
                const fileExt = image.name.split('.').pop()
                const fileName = `${session.user.id}/${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, image)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName)

                imageUrl = publicUrl
            }

            // Get max display_order
            const { data: categories } = await supabase
                .from('categories')
                .select('display_order')
                .eq('user_id', session.user.id)
                .order('display_order', { ascending: false })
                .limit(1)

            const nextOrder = categories && categories.length > 0 ? (categories[0].display_order + 1) : 0

            // Create category
            const { error: insertError } = await supabase
                .from('categories')
                .insert([{
                    user_id: session.user.id,
                    name,
                    description,
                    image_url: imageUrl,
                    display_order: nextOrder,
                }])

            if (insertError) throw insertError

            router.push('/dashboard/digital-menu/categories')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Kategori oluşturulurken hata oluştu')
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Kategori Ekle</h1>
                <p className="text-gray-600">Menünüz için yeni bir kategori oluşturun</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="max-w-2xl bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kategori Adı *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="örn: Burgerler, Salatalar"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Açıklama
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Kategori hakkında kısa açıklama"
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kategori Resmi
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        {imagePreview && (
                            <div className="mt-4">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-64 object-cover rounded-lg"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Kaydediliyor...' : 'Kategori Ekle'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                        >
                            İptal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
