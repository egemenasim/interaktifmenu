import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import PdfUploader from '@/components/pdf/pdf-uploader'

export const dynamic = 'force-dynamic'

export default async function PdfMenuPage() {
    const supabase = createClient()

    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    // Fetch PDF menus
    const { data: pdfMenus } = await supabase
        .from('pdf_menus')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF Menü</h1>
                <p className="text-gray-600">PDF menünüzü yükleyin ve QR kod ile paylaşın</p>
            </div>

            <div className="max-w-4xl">
                <PdfUploader userId={session.user.id} />

                {pdfMenus && pdfMenus.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">Yüklü PDF Menüler</h2>
                        <div className="space-y-4">
                            {pdfMenus.map((menu) => (
                                <div key={menu.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-gray-900">{menu.file_name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {(menu.file_size / 1024 / 1024).toFixed(2)} MB · {new Date(menu.created_at).toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={menu.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                        >
                                            Görüntüle
                                        </a>
                                        <a
                                            href={`${window.location.origin}/pdf/${menu.id}`}
                                            target="_blank"
                                            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                                        >
                                            QR Linki
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
