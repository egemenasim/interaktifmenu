import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import OrderDetailClient from '@/components/pos/order-detail-client'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
    const supabase = createClient()

    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_name')
        .eq('id', session.user.id)
        .single()

    // Fetch order with items
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
      *,
      tables (
        table_number,
        zones (name)
      ),
      order_items (
        id,
        product_id,
        product_name,
        price_snapshot,
        quantity,
        created_at
      )
    `)
        .eq('id', params.id)
        .eq('user_id', session.user.id)
        .single()

    if (error || !order) {
        notFound()
    }

    // Only show if order is open
    if (order.status !== 'open') {
        redirect('/dashboard/pos')
    }

    return (
        <OrderDetailClient
            orderId={params.id}
            initialOrder={order}
            restaurantName={profile?.restaurant_name || 'Restoran'}
            userId={session.user.id}
        />
    )
}
