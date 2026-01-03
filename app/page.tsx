import Link from 'next/link'

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">
                        InteraktifMenu
                    </h1>
                    <p className="text-xl text-gray-700 mb-12">
                        Restoranınız için profesyonel dijital menü ve adisyon yönetim sistemi
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-2xl font-semibold mb-4 text-blue-600">Tam Paket</h3>
                            <p className="text-gray-600 mb-4">Adisyon Takip Sistemi + Dijital Menü</p>
                            <ul className="text-left text-sm text-gray-700 space-y-2 mb-6">
                                <li>✓ Dijital menü yönetimi</li>
                                <li>✓ Happy Hour desteği</li>
                                <li>✓ POS sistemi</li>
                                <li>✓ Masa/bölge yönetimi</li>
                                <li>✓ Adisyon takibi</li>
                            </ul>
                            <Link
                                href="/register?plan=tam_paket"
                                className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                            >
                                Başla
                            </Link>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-2xl font-semibold mb-4 text-indigo-600">Yarım Paket</h3>
                            <p className="text-gray-600 mb-4">Dijital Menü</p>
                            <ul className="text-left text-sm text-gray-700 space-y-2 mb-6">
                                <li>✓ Dijital menü yönetimi</li>
                                <li>✓ Happy Hour desteği</li>
                                <li>✓ QR kod oluşturma</li>
                                <li>✓ Fiyat güncelleme</li>
                                <li className="text-gray-400">✗ POS sistemi</li>
                            </ul>
                            <Link
                                href="/register?plan=yarim_paket"
                                className="block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                            >
                                Başla
                            </Link>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-2xl font-semibold mb-4 text-purple-600">Giriş Paket</h3>
                            <p className="text-gray-600 mb-4">PDF Menü</p>
                            <ul className="text-left text-sm text-gray-700 space-y-2 mb-6">
                                <li>✓ PDF menü yükleme</li>
                                <li>✓ QR kod oluşturma</li>
                                <li>✓ Kolay paylaşım</li>
                                <li className="text-gray-400">✗ Dijital menü</li>
                                <li className="text-gray-400">✗ POS sistemi</li>
                            </ul>
                            <Link
                                href="/register?plan=giris_paket"
                                className="block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
                            >
                                Başla
                            </Link>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/login"
                            className="bg-white text-gray-800 px-8 py-3 rounded-lg shadow hover:shadow-lg transition font-medium"
                        >
                            Giriş Yap
                        </Link>
                        <Link
                            href="/register"
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg shadow hover:bg-blue-700 transition font-medium"
                        >
                            Kayıt Ol
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    )
}
