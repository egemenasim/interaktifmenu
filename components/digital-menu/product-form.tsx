'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/types/database'

type Product = Database['public']['Tables']['products']['Row']

interface ProductFormProps {
    userId: string
    product?: Product
}

export default function ProductForm({ userId, product }: ProductFormProps) {
    const [name, setName] = useState(product?.name || '')
    const [description, setDescription] = useState(product?.description || '')
    const [price, setPrice] = useState(product?.price?.toString() || '')
    const [happyHourPrice, setHappyHourPrice] = useState(product?.happy_hour_price?.toString() || '')
    const [categoryId, setCategoryId] = useState(product?.category_id || '')
    const [isActive, setIsActive] = useState(product?.is_active ?? true)
    const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [categories, setCategories] = useState<any[]>([])

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', session.user.id)
            .order('display_order', { ascending: true })

        setCategories(data || [])
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Dosya boyutu 5MB\'dan küçük olmalıdır')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${userId}/${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName)

            setImagePreview(publicUrl)
        } catch (err: any) {
            setError(err.message || 'Resim yüklenirken hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            setError('Kullanıcı oturumu bulunamadı.')
            setLoading(false)
            return
        }

        const productData = {
            user_id: session.user.id,
            name,
            description: description || null,
            price: parseFloat(price),
            happy_hour_price: happyHourPrice ? parseFloat(happyHourPrice) : null,
            category_id: categoryId || null,
            image_url: imagePreview,
            is_active: isActive,
        }

        try {
            if (product) {
                // Update existing product
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', product.id)

                if (error) throw error
            } else {
                // Insert new product
                const { error } = await supabase
                    .from('products')
                    .insert([productData])

                if (error) throw error
            }

            router.push('/dashboard/digital-menu')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu')
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!product) return
        if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return

        setLoading(true)

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', product.id)

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard/digital-menu')
            router.refresh()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Adı *
                </label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Margherita Pizza"
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ürün açıklaması..."
                />
                />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kategori
                    </label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Kategori Seçin (İsteğe Bağlı)</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    {categories.length === 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                            Henüz kategori yok. <a href="/dashboard/digital-menu/categories/new" className="text-blue-600 hover:underline">Kategori ekleyin</a>
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                        Normal Fiyat (₺) *
                    </label>
                    <input
                        id="price"
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <label htmlFor="happyHourPrice" className="block text-sm font-medium text-gray-700 mb-1">
                        Happy Hour Fiyat (₺)
                    </label>
                    <input
                        id="happyHourPrice"
                        type="number"
                        step="0.01"
                        value={happyHourPrice}
                        onChange={(e) => setHappyHourPrice(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Görseli
                </label>
                <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {loading && <p className="text-sm text-gray-600 mt-1">Yükleniyor...</p>}
                {imagePreview && (
                    <div className="mt-2">
                        <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded" />
                    </div>
                )}
            </div>

            <div className="flex items-center">
                <input
                    id="isActive"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Ürün aktif (Menüde gösterilsin)
                </label>
            </div>

            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Kaydediliyor...' : product ? 'Güncelle' : 'Kaydet'}
                </button>

                {product && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="px-6 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                    >
                        Sil
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                    İptal
                </button>
            </div>
        </form>
    )
}
