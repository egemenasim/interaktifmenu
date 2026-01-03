'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import jsPDF from 'jspdf'
import { formatPrice, getCurrentPrice, getProductDisplayName } from '@/lib/utils/pricing'
import PriceDisplay from '@/components/ui/price-display'
import ReceiptButton from '@/components/pos/receipt-button'
import ConfirmDialog from '@/components/ui/confirm-dialog'

export default function OrderDetailClient({
    orderId,
    initialOrder,
    restaurantName,
    userId
}: {
    orderId: string
    initialOrder: any
    restaurantName: string
    userId: string
}) {
    const [order, setOrder] = useState(initialOrder)
    const [orderItems, setOrderItems] = useState(initialOrder.order_items || [])
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [profile, setProfile] = useState<any>(null)
    const [paidAmount, setPaidAmount] = useState(initialOrder.paid_amount || 0)
    const [customPayment, setCustomPayment] = useState('')
    const [showAddItems, setShowAddItems] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showConfirmClose, setShowConfirmClose] = useState(false)
    const [loading, setLoading] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(profileData)

        // Load categories
        const { data: categoriesData } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .order('display_order', { ascending: true })
        setCategories(categoriesData || [])

        const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
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

    const addItemToOrder = async (product: any) => {
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

        // Check if item already exists WITH SAME PRICE
        const existingItem = orderItems.find((item: any) =>
            item.product_id === product.id && item.price_snapshot === currentPrice
        )

        if (existingItem) {
            // Same product, same price - just increase quantity
            await updateItemQuantity(existingItem.id, existingItem.quantity + 1)
        } else {
            // New product OR same product but different price - add as new line
            const { data, error } = await supabase
                .from('order_items')
                .insert([{
                    order_id: orderId,
                    product_id: product.id,
                    product_name: productDisplayName, // Include Happy Hour label
                    price_snapshot: currentPrice,
                    quantity: 1,
                }])
                .select()
                .single()

            if (!error && data) {
                setOrderItems([...orderItems, data])
                await recalculateTotal()
            }
        }
    }

    const updateItemQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            await deleteItem(itemId)
            return
        }

        const { error } = await supabase
            .from('order_items')
            .update({ quantity: newQuantity })
            .eq('id', itemId)

        if (!error) {
            setOrderItems(orderItems.map((item: any) =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            ))
            await recalculateTotal()
        }
    }

    const deleteItem = async (itemId: string) => {
        const { error } = await supabase
            .from('order_items')
            .delete()
            .eq('id', itemId)

        if (!error) {
            setOrderItems(orderItems.filter((item: any) => item.id !== itemId))
            await recalculateTotal()
        }
    }

    const recalculateTotal = async () => {
        const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId)

        if (items) {
            const total = items.reduce((sum, item) => sum + (item.price_snapshot * item.quantity), 0)

            await supabase
                .from('orders')
                .update({ total_amount: total })
                .eq('id', orderId)

            setOrder({ ...order, total_amount: total })
        }
    }

    const addPayment = async () => {
        const amount = parseFloat(customPayment)
        if (isNaN(amount) || amount <= 0) return

        const newPaidAmount = paidAmount + amount

        const { error } = await supabase
            .from('orders')
            .update({ paid_amount: newPaidAmount })
            .eq('id', orderId)

        if (!error) {
            setPaidAmount(newPaidAmount)
            setCustomPayment('')
        }
    }

    const closeOrder = async () => {
        setLoading(true)

        await supabase
            .from('orders')
            .update({
                status: 'closed',
                closed_at: new Date().toISOString()
            })
            .eq('id', orderId)

        // Update table status
        if (order.table_id) {
            await supabase
                .from('tables')
                .update({ status: 'available' })
                .eq('id', order.table_id)
        }

        router.push('/dashboard/pos')
        router.refresh()
    }

    const totalAmount = order.total_amount || 0
    const remainingAmount = totalAmount - paidAmount

    const receiptData = {
        orderId: order.id,
        restaurantName,
        zoneName: order.tables?.zones?.name || '',
        tableNumber: order.tables?.table_number || '',
        createdAt: order.created_at,
        items: orderItems,
        totalAmount,
    }

    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/dashboard/pos"
                    className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
                >
                    ← Adisyon Sistemine Dön
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Sipariş Detayı</h1>
                <p className="text-gray-600">
                    {order.tables?.zones?.name} - Masa {order.tables?.table_number}
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Sipariş İçeriği</h2>
                            <button
                                onClick={() => setShowAddItems(!showAddItems)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                            >
                                {showAddItems ? 'Kapat' : '+ Ürün Ekle'}
                            </button>
                        </div>

                        {showAddItems && (
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold mb-3 text-sm">Ürün Ekle:</h3>

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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 text-sm"
                                />

                                {/* Show search results when searching */}
                                {searchQuery.trim() ? (
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs text-gray-600">
                                                {filteredProducts.length} ürün bulundu
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setSearchQuery('')
                                                    setSelectedCategory(null)
                                                }}
                                                className="text-blue-600 hover:text-blue-700 text-xs"
                                            >
                                                Temizle
                                            </button>
                                        </div>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {filteredProducts.length > 0 ? (
                                                filteredProducts.map((product) => {
                                                    const currentPrice = getCurrentPrice(
                                                        product.price,
                                                        product.happy_hour_price,
                                                        profile?.happy_hour_start,
                                                        profile?.happy_hour_end
                                                    )
                                                    return (
                                                        <button
                                                            key={product.id}
                                                            onClick={() => addItemToOrder(product)}
                                                            className="w-full flex justify-between items-center p-2 border rounded hover:bg-white transition text-left text-sm"
                                                        >
                                                            <span>{product.name}</span>
                                                            <span className="font-bold text-blue-600">{formatPrice(currentPrice)}</span>
                                                        </button>
                                                    )
                                                })
                                            ) : (
                                                <p className="text-gray-500 text-center py-4 text-sm">Ürün bulunamadı</p>
                                            )}
                                        </div>
                                    </div>
                                ) : !selectedCategory ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        <p className="text-xs text-gray-600 mb-2">Kategori seçin:</p>
                                        {categories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() => setSelectedCategory(category.id)}
                                                className="w-full flex justify-between items-center p-3 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition text-sm"
                                            >
                                                <span className="font-semibold text-blue-900">{category.name}</span>
                                                <span className="text-gray-500">→</span>
                                            </button>
                                        ))}
                                        {products.filter(p => !p.category_id).length > 0 && (
                                            <button
                                                onClick={() => setSelectedCategory('uncategorized')}
                                                className="w-full flex justify-between items-center p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition text-sm"
                                            >
                                                <span className="font-semibold text-gray-700">Kategorisiz</span>
                                                <span className="text-gray-500">→</span>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className="mb-3 text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                                        >
                                            ← Kategorilere Dön
                                        </button>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {filteredProducts.length > 0 ? (
                                                filteredProducts.map((product) => {
                                                    const currentPrice = getCurrentPrice(
                                                        product.price,
                                                        product.happy_hour_price,
                                                        profile?.happy_hour_start,
                                                        profile?.happy_hour_end
                                                    )
                                                    return (
                                                        <button
                                                            key={product.id}
                                                            onClick={() => addItemToOrder(product)}
                                                            className="w-full flex justify-between items-center p-2 border rounded hover:bg-white transition text-left text-sm"
                                                        >
                                                            <span>{product.name}</span>
                                                            <span className="font-bold text-blue-600">{formatPrice(currentPrice)}</span>
                                                        </button>
                                                    )
                                                })
                                            ) : (
                                                <p className="text-gray-500 text-center py-4 text-sm">Ürün bulunamadı</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            {orderItems.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                                    <div className="flex-1">
                                        <p className="font-medium">{item.product_name}</p>
                                        <p className="text-sm text-gray-600">
                                            {formatPrice(item.price_snapshot)} x {item.quantity} = {formatPrice(item.price_snapshot * item.quantity)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                            className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                        <button
                                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                            className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 font-bold"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => deleteItem(item.id)}
                                            className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {orderItems.length === 0 && (
                            <p className="text-gray-500 text-center py-8">Henüz ürün yok. Yukarıdan ekleyin.</p>
                        )}
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Ödeme Özeti</h2>
                        <div className="space-y-3 text-lg">
                            <div className="flex justify-between">
                                <span>Toplam Tutar:</span>
                                <span className="font-bold">{formatPrice(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>Ödenen:</span>
                                <span className="font-bold">{formatPrice(paidAmount)}</span>
                            </div>
                            <div className="border-t pt-3 flex justify-between text-xl">
                                <span className="font-bold">Kalan:</span>
                                <span className={`font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatPrice(remainingAmount)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <label className="block text-sm font-medium mb-2">Ödeme Ekle (₺)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={customPayment}
                                    onChange={(e) => setCustomPayment(e.target.value)}
                                    placeholder="Ödenen tutar"
                                    className="flex-1 px-3 py-2 border rounded-lg"
                                />
                                <button
                                    onClick={addPayment}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                                >
                                    Ekle
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                * Kısmi ödeme yapıldığında buraya yazın (örn: 100₺ ödendi)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Info & Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Sipariş Bilgileri</h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-600">Durum</p>
                                <p className="font-semibold">
                                    <span className="inline-block px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                        Açık
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600">Oluşturulma</p>
                                <p className="font-semibold">
                                    {new Date(order.created_at).toLocaleString('tr-TR')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">İşlemler</h2>

                        <ReceiptButton receiptData={receiptData} />

                        <button
                            onClick={() => setShowConfirmClose(true)}
                            disabled={loading}
                            className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                        >
                            Adisyonu Kapat
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                            * Masa durumu "Müsait" olarak değişecek
                        </p>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showConfirmClose}
                onConfirm={closeOrder}
                onCancel={() => setShowConfirmClose(false)}
                title="Adisyonu Kapat?"
                message="Bu adisyonu kapatmak istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Kapat"
                cancelText="İptal"
            />
        </div>
    )
}
