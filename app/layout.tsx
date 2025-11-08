import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'News Verifier - خبروں کی تصدیق',
  description: 'Check if news, images, and videos are real or fake',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ur" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
