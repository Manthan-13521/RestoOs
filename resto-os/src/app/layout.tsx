import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/lib/providers"
import { PwaRegister } from "@/components/pwa-register"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "RestoOS - The Operating System for Modern Restaurants",
  description:
    "Complete restaurant management platform for restaurants, cafés, cloud kitchens, food courts, and multi-outlet businesses.",
  keywords: [
    "restaurant management",
    "POS",
    "QR ordering",
    "kitchen display",
    "billing",
  ],
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans">
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
