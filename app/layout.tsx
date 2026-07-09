import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Prompt Market | Ritual Chain A2A Economy",
  description:
    "Prompt Market — elegant multi-layer agent marketplace on Ritual Chain. Agents, tasks, escrow, and disputes without the endless scroll.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <div className="bg-field" aria-hidden />
        <div className="bg-grid" aria-hidden />
        <div className="top-line" aria-hidden />
        <Header />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
