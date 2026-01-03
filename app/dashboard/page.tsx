import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanName, getPlanDescription } from '@/lib/utils/tier-check'
import Link from 'next/link'

export default async function DashboardPage() {
    const supabase = createClient()

    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Hoşgeldiniz, {profile?.restaurant_name || 'Restoran'}
                </h1>
                <p className="text-gray-600">
                    Paket: <span className="font-semibold">{getPlanName(profile?.plan || 'giris_paket')}</span> - {getPlanDescription(profile?.plan || 'giris_paket')}
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Digital Menu Card */}
                {(profile?.plan === 'tam_paket' || profile?.plan === 'yarim_paket') && (
                    <Link
                        href="/dashboard/digital-menu"
                        className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                    >
                        <div className="text-3xl mb-4">📱</div>
                        <h3 className="text-xl font-semibold mb-2">Dijital Menü</h3>
                        <p className="text-gray-600">Menü ürünlerinizi yönetin, fiyatları güncelleyin ve Happy Hour düzenleyin</p>
                    </Link>
                )}

                {/* POS System Card */}
                {profile?.plan === 'tam_paket' && (
                    <Link
                        href="/dashboard/pos"
                        className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                    >
                        <div className="text-3xl mb-4">🍽️</div>
                        <h3 className="text-xl font-semibold mb-2">Adisyon Sistemi</h3>
                        <p className="text-gray-600">Masa yönetimi, sipariş oluşturma ve adisyon takibi</p>
                    </Link>
                )}

                {/* PDF Menu Card */}
                <Link
                    href="/dashboard/pdf-menu"
                    className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                >
                    <div className="text-3xl mb-4">📄</div>
                    <h3 className="text-xl font-semibold mb-2">PDF Menü</h3>
                    <p className="text-gray-600">PDF menünüzü yükleyin ve QR kod oluşturun</p>
                </Link>

                {/* Settings Card */}
                <Link
                    href="/dashboard/settings"
                    className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                >
                    <div className="text-3xl mb-4">⚙️</div>
                    <h3 className="text-xl font-semibold mb-2">Ayarlar</h3>
                    <p className="text-gray-600">Restoran bilgilerinizi ve Happy Hour saatlerinizi düzenleyin</p>
                </Link>
            </div>
        </div>
    )
}
