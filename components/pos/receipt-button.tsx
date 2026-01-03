'use client'

import { jsPDF } from 'jspdf'

interface ReceiptData {
    orderId: string
    restaurantName: string
    zoneName: string
    tableNumber: string
    createdAt: string
    items: Array<{
        product_name: string
        quantity: number
        price_snapshot: number
    }>
    totalAmount: number
}

export default function ReceiptButton({ receiptData }: { receiptData: ReceiptData }) {
    // Helper to convert Turkish characters for PDF
    const turkishToAscii = (text: string) => {
        const charMap: { [key: string]: string } = {
            'ç': 'c', 'Ç': 'C',
            'ğ': 'g', 'Ğ': 'G',
            'ı': 'i', 'İ': 'I',
            'ö': 'o', 'Ö': 'O',
            'ş': 's', 'Ş': 'S',
            'ü': 'u', 'Ü': 'U'
        }
        return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, match => charMap[match] || match)
    }

    const generateReceipt = () => {
        const doc = new jsPDF()

        // Restaurant header - convert Turkish chars
        doc.setFontSize(20)
        doc.text(turkishToAscii(receiptData.restaurantName), 105, 20, { align: 'center' })

        doc.setFontSize(10)
        doc.text('ADISYON FISI', 105, 30, { align: 'center' })

        // Line separator
        doc.line(20, 35, 190, 35)

        // Order info
        doc.setFontSize(11)
        let y = 45

        doc.text(`Bolge: ${turkishToAscii(receiptData.zoneName)}`, 20, y)
        y += 7
        doc.text(`Masa No: ${receiptData.tableNumber}`, 20, y)
        y += 7
        doc.text(`Tarih: ${new Date(receiptData.createdAt).toLocaleDateString('tr-TR')}`, 20, y)
        y += 7
        doc.text(`Saat: ${new Date(receiptData.createdAt).toLocaleTimeString('tr-TR')}`, 20, y)
        y += 7
        doc.text(`Siparis No: ${receiptData.orderId.substring(0, 8).toUpperCase()}`, 20, y)

        // Line separator
        y += 5
        doc.line(20, y, 190, y)
        y += 10

        // Items header
        doc.setFontSize(10)
        doc.text('URUN', 20, y)
        doc.text('ADET', 120, y)
        doc.text('FIYAT', 150, y)
        doc.text('TOPLAM', 175, y, { align: 'right' })

        y += 5
        doc.line(20, y, 190, y)
        y += 7

        // Items - convert Turkish chars in product names
        doc.setFontSize(9)
        receiptData.items.forEach(item => {
            const itemTotal = item.price_snapshot * item.quantity

            // Product name - converted to ASCII
            const productName = turkishToAscii(item.product_name)
            const displayName = productName.length > 30
                ? productName.substring(0, 30) + '...'
                : productName

            doc.text(displayName, 20, y)
            doc.text(item.quantity.toString(), 125, y)
            doc.text(item.price_snapshot.toFixed(2) + ' TL', 150, y)
            doc.text(itemTotal.toFixed(2) + ' TL', 190, y, { align: 'right' })

            y += 6
        })

        // Line separator
        y += 3
        doc.line(20, y, 190, y)
        y += 8

        // Total
        doc.setFontSize(12)
        doc.setFont(undefined, 'bold')
        doc.text('GENEL TOPLAM:', 120, y)
        doc.text(receiptData.totalAmount.toFixed(2) + ' TL', 190, y, { align: 'right' })

        // Footer
        y += 15
        doc.setFontSize(9)
        doc.setFont(undefined, 'normal')
        doc.text('InteraktifMenu ile olusturuldu', 105, y, { align: 'center' })
        doc.text('Afiyet olsun!', 105, y + 5, { align: 'center' })

        // Save PDF
        const fileName = `Fis_${receiptData.tableNumber}_${new Date().getTime()}.pdf`
        doc.save(fileName)
    }

    return (
        <button
            onClick={generateReceipt}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition mb-3"
        >
            📄 Fiş Çıkart (PDF)
        </button>
    )
}
