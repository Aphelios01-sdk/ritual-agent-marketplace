"use client"

import Link from "next/link"
import { ArrowLeft, Boxes } from "lucide-react"
import { SkillCatalog } from "@/components/skill-catalog"
import { LayerRail } from "@/components/layer-rail"
import { McpActionPanel } from "@/components/mcp-action-panel"
import { useT } from "@/lib/i18n/context"

export function SkillsPageClient({ agentCount }: { agentCount: number }) {
  const t = useT()
  const p = t.skillsPage

  return (
    <div className="min-h-[100dvh]">
      <LayerRail activeId="execution" />
      <section className="page-container py-8 md:py-14">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {p.back}
        </Link>
        <div className="mb-10 max-w-[65ch]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {p.eyebrow}
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-[2.6rem] md:leading-[1.05]">
            {p.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1">
              <Boxes className="h-3 w-3" />
              {agentCount} {p.agents}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1">HTTP 0x…0801</span>
            <span className="rounded-full border border-border px-2.5 py-1">LLM 0x…0802</span>
          </div>
        </div>
        <div className="mb-8 max-w-2xl">
          <McpActionPanel surface="skills" title={p.installTitle} compact />
        </div>
        <SkillCatalog />
      </section>
    </div>
  )
}
