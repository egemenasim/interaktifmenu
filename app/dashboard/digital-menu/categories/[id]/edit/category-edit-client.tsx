'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CategoryEditClient({ category }: { category: any }) {
    const [name, setName] = useState(category.name)
    const [description, setDescription] = useState(category.description || '')
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(category.image_url || null)
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
            let imageUrl = imagePreview

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

            // Update category
            const { error: updateError } = await supabase
                .from('categories')
                .update({
                    name,
                    description,
                    image_url: imageUrl,
                })
                .eq('id', category.id)

            if (updateError) throw updateError

            router.push('/dashboard/digital-menu/categories')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Kategori güncellenirken hata oluştu')
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Kategorideki ürünler kategorisiz olarak işaretlenecektir.')) return

        setLoading(true)

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', category.id)

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard/digital-menu/categories')
            router.refresh()
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Kategoriyi Düzenle</h1>
                <p className="text-gray-600">Kategori bilgilerini güncelleyin</p>
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
                            {loading ? 'Güncelleniyor...' : 'Güncelle'}
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            className="px-6 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                        >
                            Sil
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
