import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const montserrat = localFont({
  src: [
    {
      path: '../public/fonts/Montserrat-VariableFont_wght.woff2',
      style: 'normal',
    },
    {
      path: '../public/fonts/Montserrat-Italic-VariableFont_wght.woff2',
      style: 'italic',
    },
  ],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ELPEKAS CMS',
  description: 'NT investicijos ir valdymas',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="lt" className={montserrat.className}>
      <body className="min-h-screen bg-background antialiased">
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'development' && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </body>
    </html>
  )
}
