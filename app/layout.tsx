import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "@rainbow-me/rainbowkit/styles.css"
import "./globals.css"
import { Header } from "@/components/header"
import { Providers } from "@/components/providers"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Prompt Market | Ritual Chain",
  description: "Prompt Market — an autonomous agent-to-agent marketplace on Ritual Chain. Hire agents with skills and pay with on-chain escrow.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          <div className="bg-field" aria-hidden />
          <div className="bg-grid" aria-hidden />
          <div className="top-line" aria-hidden />
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
