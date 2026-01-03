'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Plan } from '@/lib/utils/tier-check'
import { getPlanName, getPlanDescription, getPlanFeatures } from '@/lib/utils/tier-check'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [restaurantName, setRestaurantName] = useState('')
    const [selectedPlan, setSelectedPlan] = useState<Plan>('giris_paket')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    // Get plan from URL if provided
    useEffect(() => {
        const planParam = searchParams.get('plan') as Plan | null
        if (planParam && ['tam_paket', 'yarim_paket', 'giris_paket'].includes(planParam)) {
            setSelectedPlan(planParam)
        }
    }, [searchParams])

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        // Update profile with plan and restaurant name
        if (authData.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    plan: selectedPlan,
                    restaurant_name: restaurantName,
                })
                .eq('id', authData.user.id)

            if (profileError) {
                setError(profileError.message)
                setLoading(false)
                return
            }

            router.push('/dashboard')
            router.refresh()
        }
    }

    const plans: Plan[] = ['tam_paket', 'yarim_paket', 'giris_paket']

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Kayıt Ol</h1>
                    <p className="text-gray-600">Restoranınız için bir paket seçin ve başlayın</p>
                </div>

                <div className="bg-white rounded-lg shadow-xl p-8">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    {/* Plan Selection */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Paket Seçimi</h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            {plans.map((plan) => (
                                <button
                                    key={plan}
                                    type="button"
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`p-4 border-2 rounded-lg text-left transition ${selectedPlan === plan
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <h3 className="font-semibold text-lg mb-1">{getPlanName(plan)}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{getPlanDescription(plan)}</p>
                                    <ul className="text-xs text-gray-700 space-y-1">
                                        {getPlanFeatures(plan).slice(0, 3).map((feature, i) => (
                                            <li key={i}>✓ {feature}</li>
                                        ))}
                                    </ul>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Registration Form */}
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">
                                Restoran Adı
                            </label>
                            <input
                                id="restaurantName"
                                type="text"
                                value={restaurantName}
                                onChange={(e) => setRestaurantName(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Restoranınızın adı"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                E-posta
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="ornek@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Şifre (minimum 6 karakter)
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol ve Başla'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Zaten hesabınız var mı?{' '}
                            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                Giriş Yapın
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 text-center">
                        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                            ← Ana Sayfaya Dön
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
