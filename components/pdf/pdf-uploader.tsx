'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface PdfUploaderProps {
    userId: string
}

export default function PdfUploader({ userId }: PdfUploaderProps) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (file.type !== 'application/pdf') {
            setError('Sadece PDF dosyaları yüklenebilir')
            return
        }

        // Validate file size (max 30MB)
        const maxSize = 30 * 1024 * 1024
        if (file.size > maxSize) {
            setError('Dosya boyutu 30MB\'dan küçük olmalıdır')
            return
        }

        setUploading(true)
        setError(null)
        setSuccess(false)

        try {
            // Upload to Supabase Storage
            const fileName = `${userId}/${Date.now()}-${file.name}`
            const { error: uploadError, data } = await supabase.storage
                .from('pdf-menus')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('pdf-menus')
                .getPublicUrl(fileName)

            // Save to database
            const { error: dbError } = await supabase
                .from('pdf_menus')
                .insert([
                    {
                        user_id: userId,
                        file_name: file.name,
                        file_url: publicUrl,
                        file_size: file.size,
                    },
                ])

            if (dbError) throw dbError

            setSuccess(true)
            setTimeout(() => {
                router.refresh()
                setSuccess(false)
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Dosya yüklenirken hata oluştu')
        } finally {
            setUploading(false)
            // Reset file input
            e.target.value = ''
        }
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">PDF Yükle</h2>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                    ✅ PDF başarıyla yüklendi!
                </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Menünüzü Yükleyin</h3>
                <p className="text-sm text-gray-600 mb-4">Maksimum dosya boyutu: 30MB</p>

                <label className="inline-block">
                    <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                    <span className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-block disabled:opacity-50">
                        {uploading ? 'Yükleniyor...' : 'PDF Seç ve Yükle'}
                    </span>
                </label>
            </div>

            <div className="mt-4 text-sm text-gray-600">
                <p>ℹ️ Yüklediğiniz PDF menü, QR kod ile müşterilerinizle paylaşılabilir.</p>
            </div>
        </div>
    )
}
