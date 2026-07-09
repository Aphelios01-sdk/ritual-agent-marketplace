import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Download, ExternalLink } from "lucide-react"
import { BRAND_LOGOS, BRAND_SIGGY, BUILDER_LINKS, RITUAL_COLORS } from "@/lib/brand"

export const metadata: Metadata = {
  title: "Ritual Brand Kit · Prompt Market",
  description: "Ritual logos, Siggy mascot, colors, and builder links for the Prompt Market on Ritual Chain.",
}

const bgClass: Record<string, string> = {
  dark: "bg-[#0a0a0a]",
  light: "bg-white",
  red: "bg-[#ef4444]",
  lime: "bg-[#a3e635]",
  gradient: "bg-gradient-to-b from-[#86efac] to-[#166534]",
}

const SWATCHES = [
  { name: "Ritual Green", hex: RITUAL_COLORS.green },
  { name: "Deep Dark", hex: RITUAL_COLORS.dark },
  { name: "Black", hex: RITUAL_COLORS.black },
  { name: "Lime", hex: RITUAL_COLORS.lime },
  { name: "Red", hex: RITUAL_COLORS.red },
  { name: "Cyan", hex: RITUAL_COLORS.cyan },
]

export default function BrandPage() {
  return (
    <div className="min-h-[100dvh]">
      <section className="inf-container py-10 md:py-14">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>

        <div className="mb-10 max-w-2xl">
          <p className="inf-eyebrow mb-2" style={{ color: RITUAL_COLORS.green }}>
            Brand kit
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            Ritual brand kit
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Community brand assets for builders — logos, symbol, Siggy mascot — plus official Ritual Tools links
            from the Ritual Foundation builders hub.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href="https://links.ritual.tools"
              target="_blank"
              rel="noreferrer"
              className="inf-btn h-9 px-3.5 text-xs"
              style={{ background: RITUAL_COLORS.green, color: "#000" }}
            >
              Ritual Tools <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://github.com/Tanoy36/ritual-brand-kit"
              target="_blank"
              rel="noreferrer"
              className="inf-btn inf-btn-ghost h-9 px-3.5 text-xs"
            >
              Source kit <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Colors */}
        <div className="mb-12">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Colors</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {SWATCHES.map((s) => (
              <div key={s.hex} className="inf-card overflow-hidden p-0">
                <div className="h-20" style={{ background: s.hex }} />
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold">{s.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{s.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logos */}
        <div className="mb-12">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Primary logos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BRAND_LOGOS.map((logo) => (
              <div key={logo.id} className="inf-card overflow-hidden p-0">
                <div className={`flex h-36 items-center justify-center px-6 ${bgClass[logo.bg]}`}>
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    width={220}
                    height={90}
                    className="max-h-20 w-auto object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{logo.name}</p>
                    <p className="text-[11px] text-muted-foreground">{logo.note}</p>
                  </div>
                  <a
                    href={logo.src}
                    download
                    className="inline-flex items-center gap-1 rounded-md border border-[#00ff99]/40 px-2.5 py-1.5 text-[11px] font-medium text-[#00ff99] hover:bg-[#00ff99]/10"
                  >
                    <Download className="h-3 w-3" /> Save
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Banner */}
        <div className="mb-12">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Banner</h2>
          <div className="inf-card overflow-hidden p-0">
            <div className="relative aspect-[2.2/1] w-full bg-black">
              <Image src="/brand/banner.png" alt="Ritual banner" fill className="object-contain" unoptimized />
            </div>
          </div>
        </div>

        {/* Siggy */}
        <div className="mb-12">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Siggy mascot</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BRAND_SIGGY.map((s) => (
              <div key={s.id} className="inf-card p-3">
                <div className="relative mb-2 aspect-square overflow-hidden rounded-xl bg-black">
                  <Image src={s.src} alt={s.name} fill className="object-contain p-2" unoptimized />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{s.name}</p>
                  <a href={s.src} download className="text-[10px] text-[#00ff99] hover:underline">
                    Save
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Builder links */}
        <div>
          <h2 className="mb-2 text-lg font-semibold tracking-tight">Ritual Tools · builder links</h2>
          <p className="mb-4 max-w-xl text-sm text-muted-foreground">
            From Ritual Foundation: quickstart, docs, examples, and community — ship in under 15 minutes.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BUILDER_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="inf-card flex items-start justify-between gap-3 p-4 hover:border-[#00ff99]/40"
              >
                <div>
                  <p className="text-sm font-semibold">{l.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{l.desc}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#00ff99]" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
