'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ZonesPage() {
    const [zones, setZones] = useState<any[]>([])
    const [newZoneName, setNewZoneName] = useState('')
    const [newTableNumber, setNewTableNumber] = useState('')
    const [selectedZone, setSelectedZone] = useState('')
    const [loading, setLoading] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        loadZones()
    }, [])

    const loadZones = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data } = await supabase
            .from('zones')
            .select('*, tables(*)')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: true })

        setZones(data || [])
    }

    const addZone = async (e: React.FormEvent) => {
        e.preventDefault()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        setLoading(true)

        const { error } = await supabase
            .from('zones')
            .insert([{ user_id: session.user.id, name: newZoneName }])

        if (!error) {
            setNewZoneName('')
            loadZones()
        }
        setLoading(false)
    }

    const addTable = async (e: React.FormEvent) => {
        e.preventDefault()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        setLoading(true)

        const { error } = await supabase
            .from('tables')
            .insert([
                {
                    user_id: session.user.id,
                    zone_id: selectedZone,
                    table_number: newTableNumber,
                    status: 'available',
                },
            ])

        if (!error) {
            setNewTableNumber('')
            setSelectedZone('')
            loadZones()
        }
        setLoading(false)
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Bölge ve Masa Yönetimi</h1>
                <p className="text-gray-600">Restoranınızın bölgelerini ve masalarını düzenleyin</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Add Zone */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Yeni Bölge Ekle</h2>
                    <form onSubmit={addZone} className="space-y-4">
                        <input
                            type="text"
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                            placeholder="Bölge adı (örn: Bahçe, İç Mekan)"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Bölge Ekle
                        </button>
                    </form>
                </div>

                {/* Add Table */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Yeni Masa Ekle</h2>
                    <form onSubmit={addTable} className="space-y-4">
                        <select
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Bölge seçin...</option>
                            {zones.map((zone) => (
                                <option key={zone.id} value={zone.id}>
                                    {zone.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={newTableNumber}
                            onChange={(e) => setNewTableNumber(e.target.value)}
                            placeholder="Masa numarası (örn: 1, A1)"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={loading || !selectedZone}
                            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                            Masa Ekle
                        </button>
                    </form>
                </div>
            </div>

            {/* Zones List */}
            <div className="space-y-4">
                {zones.map((zone) => (
                    <div key={zone.id} className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-3">{zone.name}</h3>
                        {zone.tables && zone.tables.length > 0 ? (
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                {zone.tables.map((table: any) => (
                                    <div key={table.id} className="p-3 bg-gray-100 rounded text-center">
                                        <p className="font-medium">{table.table_number}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Bu bölgede masa yok</p>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6">
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                    ← Geri Dön
                </button>
            </div>
        </div>
    )
}
