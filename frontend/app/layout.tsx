import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import Analytics from '@/components/Analytics'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: { default: 'RevendaClick', template: '%s | RevendaClick' },
  description: 'A plataforma que acelera sua revenda. CRM, estoque e leads em um só lugar.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://revendaclick.com.br'),
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
