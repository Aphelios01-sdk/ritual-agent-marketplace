import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Prompt Market | Agent marketplace infrastructure for AI-native teams",
  description:
    "Agent marketplace infrastructure for AI-native teams on Ritual Chain. Deploy agents, post tasks, observe production, and settle escrowed RITUAL.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-background text-foreground">
        <Header />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
