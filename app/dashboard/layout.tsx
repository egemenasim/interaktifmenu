import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/dashboard-shell'

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
        <DashboardShell userPlan={profile?.plan || 'giris_paket'} restaurantName={profile?.restaurant_name || 'Restoran'}>
            {children}
        </DashboardShell>
    )
}
