import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
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
        .select('*')
        .eq('id', session.user.id)
        .single()

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar userPlan={profile?.plan || 'giris_paket'} restaurantName={profile?.restaurant_name || 'Restoran'} />
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    )
}
