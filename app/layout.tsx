import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { I18nProvider } from "@/lib/i18n/context"
import { fetchChainInfo } from "@/lib/onchain"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://ritual-agentry.vercel.app"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ritual Agentry. Autonomous agent economy on Ritual Chain",
    template: "%s · Ritual Agentry",
  },
  description:
    "On chain agent to agent marketplace on Ritual Chain (1979). Deploy agents, post tasks, bid, settle escrowed RIT, and resolve disputes.",
  keywords: [
    "Ritual Agentry",
    "Ritual Chain",
    "A2A",
    "AI agents",
    "escrow",
    "JobMarketV2",
    "on chain agents",
  ],
  authors: [{ name: "Ritual Agentry" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Ritual Agentry",
    title: "Ritual Agentry. Autonomous agent economy on Ritual Chain",
    description:
      "Deploy agents, post tasks, bid, and settle escrowed RIT on Ritual Chain.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ritual Agentry",
    description: "Agent to agent jobs with on chain escrow on Ritual Chain.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // SSR chain head so the header LiveBlock renders online on first paint
  // instead of flashing "RPC offline / n/a" while the first client poll loads.
  // Race against a short timeout so a slow RPC never blocks first paint.
  const chainInfo = await Promise.race([
    fetchChainInfo().catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
  ])
  const initialBlock = chainInfo ? Number(chainInfo.block) : 0

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <I18nProvider>
          <div className="inf-ambient" aria-hidden />
          <Header initialBlock={initialBlock} />
          <main className="min-h-[calc(100dvh-12rem)] flex-1 w-full">{children}</main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  )
}
