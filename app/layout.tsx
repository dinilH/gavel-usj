import React from "react"
import type { Metadata } from 'next'
import { Poppins, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins"
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: 'Gavel Club USJ | University of Sri Jayewardenepura',
  description: 'The Gavel Club of the University of Sri Jayewardenepura - A dynamic community dedicated to developing public speaking and leadership skills.',
  keywords: ['Gavel Club', 'USJ', 'Public Speaking', 'Leadership', 'Toastmasters', 'Sri Lanka'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body className="antialiased" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }} suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
