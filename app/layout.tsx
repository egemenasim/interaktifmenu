import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'InteraktifMenu - Restoran Yönetim Sistemi',
    description: 'Dijital menü, adisyon takip sistemi ve PDF menü yönetimi için profesyonel SaaS platformu',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="tr">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
