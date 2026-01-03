import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PosPage() {
    const supabase = createClient()

    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    // Get user profile for tier check
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

    // Check if user has access to POS
    if (profile && profile.plan !== 'tam_paket') {
        redirect('/dashboard')
    }

    // Fetch zones with tables and their active orders
    const { data: zones } = await supabase
        .from('zones')
        .select('*, tables(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })

    // Fetch ALL open orders to check table status
    const { data: openOrders } = await supabase
        .from('orders')
        .select('*, tables(table_number, zones(name))')
        .eq('user_id', session.user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })

    // Create a map of table_id -> order for quick lookup
    const tableOrderMap = new Map()
    openOrders?.forEach(order => {
        if (order.table_id) {
            tableOrderMap.set(order.table_id, order)
        }
    })

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Adisyon Sistemi (POS)</h1>
                    <p className="text-gray-600">Masa yönetimi ve sipariş takibi</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/pos/zones"
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                    >
                        Bölge Yönetimi
                    </Link>
                </div>
            </div>

            {/* Zones and Tables */}
            {zones && zones.length > 0 ? (
                <div className="space-y-6">
                    {zones.map((zone: any) => (
                        <div key={zone.id} className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">{zone.name}</h2>
                            {zone.tables && zone.tables.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {zone.tables.map((table: any) => {
                                        const hasOrder = tableOrderMap.has(table.id)
                                        const order = tableOrderMap.get(table.id)

                                        return (
                                            <div
                                                key={table.id}
                                                className={`p-4 rounded-lg border-2 ${hasOrder
                                                    ? 'bg-red-50 border-red-300'
                                                    : 'bg-green-50 border-green-300'
                                                    }`}
                                            >
                                                <div className="text-center mb-3">
                                                    <p className="font-semibold text-lg">Masa {table.table_number}</p>
                                                    <p className="text-2xl mt-1">
                                                        {hasOrder ? '🍽️' : '✓'}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {hasOrder ? 'Dolu' : 'Müsait'}
                                                    </p>
                                                </div>

                                                {hasOrder ? (
                                                    <Link
                                                        href={`/dashboard/pos/orders/${order.id}`}
                                                        className="block w-full bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700 transition text-center"
                                                    >
                                                        Siparişi Gör
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        href={`/dashboard/pos/orders/new?table=${table.id}`}
                                                        className="block w-full bg-green-600 text-white text-sm py-2 rounded hover:bg-green-700 transition text-center"
                                                    >
                                                        + Sipariş Ekle
                                                    </Link>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Bu bölgede masa yok</p>
                            )}
                        </div>
                    ))}
                </div>) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-6xl mb-4">🏢</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz bölge eklemediniz</h3>
                    <p className="text-gray-600 mb-6">İlk bölgeyi ekleyerek başlayın</p>
                    <Link
                        href="/dashboard/pos/zones"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                    >
                        Bölge Ekle
                    </Link>
                </div>
            )}

            {/* Open Orders */}
            {openOrders && openOrders.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Açık Siparişler</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {openOrders.map((order: any) => (
                            <Link
                                key={order.id}
                                href={`/dashboard/pos/orders/${order.id}`}
                                className="bg-white border-2 border-blue-200 rounded-lg p-4 hover:shadow-lg transition"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-semibold text-lg">
                                            {order.tables?.zones?.name} - Masa {order.tables?.table_number}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(order.created_at).toLocaleString('tr-TR')}
                                        </p>
                                    </div>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Açık</span>
                                </div>
                                <p className="text-xl font-bold text-blue-600">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.total_amount)}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
