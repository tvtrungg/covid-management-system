import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Covid-19 Management System',
  description: 'A system to manage Covid-19 related data and processes',
  generator: 'tvtrung',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
