import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'RevendaClick', template: '%s | RevendaClick' },
  description: 'A plataforma de vendas para revendas de veículos',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://revendaclick.app'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
