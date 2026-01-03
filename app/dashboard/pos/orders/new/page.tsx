'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { getProductDisplayName, formatPrice, getCurrentPrice } from '@/lib/utils/pricing'
import PriceDisplay from '@/components/ui/price-display'

export default function NewOrderPage() {
    const [tables, setTables] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [profile, setProfile] = useState<any>(null)
    const [selectedTable, setSelectedTable] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [orderItems, setOrderItems] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // Load profile
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
        setProfile(profileData)

        // Load tables (only available ones)
        const { data: tablesData } = await supabase
            .from('tables')
            .select('*, zones(name)')
            .eq('user_id', session.user.id)
            .order('table_number', { ascending: true })

        // Check which tables have active orders
        const { data: activeOrders } = await supabase
            .from('orders')
            .select('table_id')
            .eq('user_id', session.user.id)
            .eq('status', 'open')

        const busyTableIds = new Set(activeOrders?.map(o => o.table_id) || [])
        const availableTables = tablesData?.filter(t => !busyTableIds.has(t.id)) || []

        setTables(availableTables)

        // Pre-select table from URL if provided
        const tableParam = searchParams?.get('table')
        if (tableParam && availableTables.find(t => t.id === tableParam)) {
            setSelectedTable(tableParam)
        }

        // Load categories
        const { data: categoriesData } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', session.user.id)
            .order('display_order', { ascending: true })
        setCategories(categoriesData || [])

        // Load products
        const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .order('name', { ascending: true })
        setProducts(productsData || [])
    }

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())

        // If searching, show all matching products regardless of category
        if (searchQuery.trim()) {
            return matchesSearch
        }

        // If not searching, filter by selected category
        const matchesCategory = !selectedCategory ||
            (selectedCategory === 'uncategorized' ? !product.category_id : product.category_id === selectedCategory)
        return matchesCategory
    })

    // Auto select category when search is active
    useEffect(() => {
        if (searchQuery.trim() && selectedCategory === null) {
            // Don't change anything, just searching
        }
    }, [searchQuery])

    const addItem = (product: any) => {
        // CRITICAL: Snapshot pricing - capture the price at this exact moment
        const currentPrice = getCurrentPrice(
            product.price,
            product.happy_hour_price,
            profile?.happy_hour_start,
            profile?.happy_hour_end
        )

        // Add Happy Hour label to product name if applicable
        const productDisplayName = getProductDisplayName(
            product.name,
            product.price,
            product.happy_hour_price,
            profile?.happy_hour_start,
            profile?.happy_hour_end
        )

        const existingItem = orderItems.find((item) => item.product_id === product.id)

        if (existingItem) {
            setOrderItems(
                orderItems.map((item) =>
                    item.product_id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            )
        } else {
            setOrderItems([
                ...orderItems,
                {
                    product_id: product.id,
                    product_name: productDisplayName, // Include Happy Hour label
                    price_snapshot: currentPrice, // SNAPSHOT PRICE
                    quantity: 1,
                },
            ])
        }
    }

    const removeItem = (productId: string) => {
        setOrderItems(orderItems.filter((item) => item.product_id !== productId))
    }

    const updateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(productId)
        } else {
            setOrderItems(
                orderItems.map((item) =>
                    item.product_id === productId ? { ...item, quantity: newQuantity } : item
                )
            )
        }
    }

    const calculateTotal = () => {
        return orderItems.reduce((total, item) => total + item.price_snapshot * item.quantity, 0)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedTable || orderItems.length === 0) {
            setError('Lütfen masa seçin ve ürün ekleyin')
            return
        }

        setLoading(true)
        setError(null)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            // Create order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([
                    {
                        user_id: session.user.id,
                        table_id: selectedTable,
                        status: 'open',
                        total_amount: calculateTotal(),
                    },
                ])
                .select()
                .single()

            if (orderError) throw orderError

            // Insert order items with snapshot prices
            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(
                    orderItems.map((item) => ({
                        order_id: order.id,
                        product_id: item.product_id,
                        product_name: item.product_name,
                        price_snapshot: item.price_snapshot, // Snapshot price saved
                        quantity: item.quantity,
                    }))
                )

            if (itemsError) throw itemsError

            // Update table status
            await supabase
                .from('tables')
                .update({ status: 'occupied' })
                .eq('id', selectedTable)

            router.push('/dashboard/pos')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Sipariş oluşturulurken hata oluştu')
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Sipariş</h1>
                <p className="text-gray-600">Masa seçin ve ürün ekleyin</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Left: Product Selection */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Ürünler</h2>

                    {/* Search - Always Visible */}
                    <input
                        type="text"
                        placeholder="Ürün ara..."
                        value={searchQuery}
                        onChange={(e) => {
                            const value = e.target.value
                            setSearchQuery(value)
                            // If clearing search, go back to categories
                            if (!value.trim() && selectedCategory) {
                                setSelectedCategory(null)
                            }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Show search results when searching */}
                    {searchQuery.trim() ? (
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-sm text-gray-600">
                                    {filteredProducts.length} ürün bulundu
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('')
                                        setSelectedCategory(null)
                                    }}
                                    className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                    Temizle
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => {
                                        const displayName = getProductDisplayName(
                                            product.name,
                                            product.price,
                                            product.happy_hour_price,
                                            profile?.happy_hour_start,
                                            profile?.happy_hour_end
                                        )
                                        return (
                                            <button
                                                key={product.id}
                                                onClick={() => addItem(product)}
                                                className="w-full flex justify-between items-center p-3 border rounded hover:bg-blue-50 transition text-left"
                                            >
                                                <div>
                                                    <p className="font-medium">{displayName}</p>
                                                </div>
                                                <PriceDisplay
                                                    regularPrice={product.price}
                                                    happyHourPrice={product.happy_hour_price}
                                                    happyHourStart={profile?.happy_hour_start}
                                                    happyHourEnd={profile?.happy_hour_end}
                                                    size="sm"
                                                />
                                            </button>
                                        )
                                    })
                                ) : (
                                    <p className="text-gray-500 text-center py-8">Ürün bulunamadı</p>
                                )}
                            </div>
                        </div>
                    ) : !selectedCategory ? (
                        /* Categories View */
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Kategoriler</h3>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className="w-full flex justify-between items-center p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition"
                                >
                                    <span className="font-semibold text-blue-900">{category.name}</span>
                                    <span className="text-gray-500">→</span>
                                </button>
                            ))}
                            {products.filter(p => !p.category_id).length > 0 && (
                                <button
                                    onClick={() => setSelectedCategory('uncategorized')}
                                    className="w-full flex justify-between items-center p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition"
                                >
                                    <span className="font-semibold text-gray-700">Kategorisiz Ürünler</span>
                                    <span className="text-gray-500">→</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Products in Category View */
                        <div>
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
                            >
                                ← Kategorilere Dön
                            </button>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => {
                                        const displayName = getProductDisplayName(
                                            product.name,
                                            product.price,
                                            product.happy_hour_price,
                                            profile?.happy_hour_start,
                                            profile?.happy_hour_end
                                        )
                                        return (
                                            <button
                                                key={product.id}
                                                onClick={() => addItem(product)}
                                                className="w-full flex justify-between items-center p-3 border rounded hover:bg-blue-50 transition text-left"
                                            >
                                                <div>
                                                    <p className="font-medium">{displayName}</p>
                                                </div>
                                                <PriceDisplay
                                                    regularPrice={product.price}
                                                    happyHourPrice={product.happy_hour_price}
                                                    happyHourStart={profile?.happy_hour_start}
                                                    happyHourEnd={profile?.happy_hour_end}
                                                    size="sm"
                                                />
                                            </button>
                                        )
                                    })
                                ) : (
                                    <p className="text-gray-500 text-center py-8">Ürün bulunamadı</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Order */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Sipariş Detayı</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Masa Seç *</label>
                            <select
                                value={selectedTable}
                                onChange={(e) => setSelectedTable(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Masa seçin...</option>
                                {tables.map((table) => (
                                    <option key={table.id} value={table.id}>
                                        {table.zones.name} - Masa {table.table_number}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-3">Sipariş İçeriği</h3>
                            {orderItems.length > 0 ? (
                                <div className="space-y-2">
                                    {orderItems.map((item) => (
                                        <div key={item.product_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{item.product_name}</p>
                                                <p className="text-xs text-gray-600">
                                                    {formatPrice(item.price_snapshot)} x {item.quantity}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.product_id)}
                                                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Henüz ürün eklenmedi</p>
                            )}
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center text-xl font-bold">
                                <span>Toplam:</span>
                                <span className="text-blue-600">{formatPrice(calculateTotal())}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={loading || orderItems.length === 0}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {loading ? 'Kaydediliyor...' : 'Siparişi Kaydet'}
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
        </div>
    )
}
