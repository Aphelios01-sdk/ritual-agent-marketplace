"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ExternalLink } from "lucide-react"
import { BRAND_LOGOS, BRAND_SIGGY, BUILDER_LINKS } from "@/lib/brand"

const bgClass: Record<string, string> = {
  dark: "bg-[#0a0a0a]",
  light: "bg-white",
  red: "bg-[#ef4444]",
  lime: "bg-[#a3e635]",
  gradient: "bg-gradient-to-b from-[#86efac] to-[#166534]",
}

export function BrandKitStrip({ compact = false }: { compact?: boolean }) {
  const logos = compact ? BRAND_LOGOS.slice(0, 4) : BRAND_LOGOS
  const siggies = compact ? BRAND_SIGGY.slice(0, 4) : BRAND_SIGGY

  return (
    <section className="relative">
      <div className="inf-container py-14 lg:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inf-eyebrow mb-2" style={{ color: "#00ff99" }}>
              Ritual brand kit
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
              Built with Ritual identity
            </h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Logos, symbol, and Siggy from the community brand kit — plus official builder links from Ritual Tools.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/brand"
              className="inf-btn h-9 px-3.5 text-xs"
              style={{ background: "#00ff99", color: "#000" }}
            >
              Full brand kit <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a
              href="https://links.ritual.tools"
              target="_blank"
              rel="noreferrer"
              className="inf-btn inf-btn-ghost h-9 px-3.5 text-xs"
            >
              Ritual Tools <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Logos */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {logos.map((logo) => (
            <div key={logo.id} className="inf-card overflow-hidden p-0">
              <div className={`flex h-28 items-center justify-center px-4 ${bgClass[logo.bg]}`}>
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={180}
                  height={72}
                  className="max-h-16 w-auto object-contain"
                  unoptimized
                />
              </div>
              <div className="border-t border-border/40 px-3.5 py-2.5">
                <p className="text-xs font-semibold tracking-tight">{logo.name}</p>
                <p className="text-[11px] text-muted-foreground">{logo.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Siggy row */}
        <div className="mb-8">
          <p className="mb-3 text-xs font-medium text-muted-foreground">Siggy mascot</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {siggies.map((s) => (
              <div key={s.id} className="inf-card flex flex-col items-center p-3">
                <div className="relative mb-2 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-black">
                  <Image
                    src={s.src}
                    alt={s.name}
                    width={140}
                    height={140}
                    className="max-h-28 w-auto object-contain"
                    unoptimized
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{s.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Builder links from Ritual Tools tweet */}
        <div>
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            Builder hub · from Ritual Foundation
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {BUILDER_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="inf-card group flex items-start justify-between gap-3 p-4"
              >
                <div>
                  <p className="text-sm font-semibold tracking-tight group-hover:text-[#00ff99]">
                    {l.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{l.desc}</p>
                </div>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-50 group-hover:text-[#00ff99] group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="inf-hairline" />
    </section>
  )
}
