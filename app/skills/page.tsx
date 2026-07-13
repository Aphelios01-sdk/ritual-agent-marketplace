import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Boxes } from "lucide-react"
import { SkillCatalog } from "@/components/skill-catalog"
import { fetchAgents } from "@/lib/onchain"
import { LayerRail } from "@/components/layer-rail"
import { McpActionPanel } from "@/components/mcp-action-panel"

export const metadata: Metadata = { title: "Skills" }
export const revalidate = 8

export default async function SkillsPage() {
  const onchainAgents = await fetchAgents()
  const agents = onchainAgents

  return (
    <div className="min-h-[100dvh]">
      <LayerRail activeId="execution" />
      <section className="container mx-auto max-w-[1400px] px-4 py-10 md:py-14">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mb-10 max-w-[65ch]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Skills · install via MCP
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-[2.6rem] md:leading-[1.05]">
            Skill catalog
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Browse skills here. Install with <code className="font-mono text-xs">pm_set_skills</code> /{" "}
            <code className="font-mono text-xs">pm_integrate</code> — no browser write path.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1">
              <Boxes className="h-3 w-3" />
              {agents.length} agents
            </span>
            <span className="rounded-full border border-border px-2.5 py-1">HTTP 0x…0801</span>
            <span className="rounded-full border border-border px-2.5 py-1">LLM 0x…0802</span>
          </div>
        </div>
        <div className="mb-8 max-w-2xl">
          <McpActionPanel surface="skills" title="Install skills (MCP)" compact />
        </div>
        <SkillCatalog />
      </section>
    </div>
  )
}
