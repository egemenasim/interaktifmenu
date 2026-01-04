'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { hasAccess, TIER_ACCESS, type Plan } from '@/lib/utils/tier-check'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
    userPlan: Plan
    restaurantName: string
    onClose?: () => void
}

export default function Sidebar({ userPlan, restaurantName, onClose }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const navItems = [
        {
            name: 'Ana Sayfa',
            href: '/dashboard',
            icon: '🏠',
            requiredPlans: ['tam_paket', 'yarim_paket', 'giris_paket'] as Plan[],
        },
        {
            name: 'Dijital Menü',
            href: '/dashboard/digital-menu',
            icon: '📱',
            requiredPlans: TIER_ACCESS.DIGITAL_MENU,
        },
        {
            name: 'Adisyon Sistemi',
            href: '/dashboard/pos',
            icon: '🍽️',
            requiredPlans: TIER_ACCESS.POS,
        },
        {
            name: 'PDF Menü',
            href: '/dashboard/pdf-menu',
            icon: '📄',
            requiredPlans: TIER_ACCESS.PDF_MENU,
        },
        {
            name: 'Ayarlar',
            href: '/dashboard/settings',
            icon: '⚙️',
            requiredPlans: ['tam_paket', 'yarim_paket', 'giris_paket'] as Plan[],
        },
    ]

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
            <div className="p-6">
                <h2 className="text-xl font-bold text-blue-600 mb-1">InteraktifMenu</h2>
                <p className="text-sm text-gray-600 truncate">{restaurantName}</p>
            </div>

            <nav className="px-4 space-y-2">
                {navItems.map((item) => {
                    const hasAccessToFeature = hasAccess(userPlan, item.requiredPlans)
                    const isActive = pathname === item.href

                    if (!hasAccessToFeature) {
                        return (
                            <div
                                key={item.name}
                                className="flex items-center px-4 py-3 rounded-lg text-gray-400 cursor-not-allowed"
                                title="Bu özellik paketinizde bulunmamaktadır"
                            >
                                <span className="mr-3 text-lg">{item.icon}</span>
                                <span className="text-sm">{item.name}</span>
                                <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded">🔒</span>
                            </div>
                        )
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center px-4 py-3 rounded-lg transition ${isActive
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <span className="mr-3 text-lg">{item.icon}</span>
                            <span className="text-sm">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                    <span className="mr-3 text-lg">🚪</span>
                    <span className="text-sm">Çıkış Yap</span>
                </button>
            </div>
        </aside>
    )
}
