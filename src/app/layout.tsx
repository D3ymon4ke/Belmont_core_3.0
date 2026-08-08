import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Belmont Core 2.0 — Plataforma Social Privada',
  description: 'Plataforma social privada e exclusiva da Mansão Belmont com design premium, chat persistido e economia interna.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-belmont-bg text-belmont-text-primary antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
