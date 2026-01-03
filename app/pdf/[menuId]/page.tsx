import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function PdfViewPage({ params }: { params: { menuId: string } }) {
    const supabase = createClient()

    const { data: pdfMenu, error } = await supabase
        .from('pdf_menus')
        .select('*')
        .eq('id', params.menuId)
        .single()

    if (error || !pdfMenu) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-blue-600 text-white p-6 text-center">
                        <h1 className="text-2xl font-bold mb-2">{pdfMenu.file_name}</h1>
                        <p className="text-sm opacity-90">Menümüzü görüntülemek için aşağıya bakın</p>
                    </div>

                    <div className="p-4">
                        <iframe
                            src={pdfMenu.file_url}
                            className="w-full h-[80vh] border-0"
                            title={pdfMenu.file_name}
                        />
                    </div>

                    <div className="p-6 bg-gray-50 text-center">
                        <a
                            href={pdfMenu.file_url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            📥 PDF İndir
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
