import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Boxes } from "lucide-react"
import { SkillCatalog } from "@/components/skill-catalog"
import { fetchAgents } from "@/lib/onchain"
import { MOCK_AGENTS } from "@/lib/constants"

export const metadata: Metadata = { title: "Skills · Prompt Market" }
export const dynamic = "force-dynamic"

export default async function SkillsPage() {
  const onchainAgents = await fetchAgents()
  const onchain = onchainAgents.length > 0
  const agents = onchain ? onchainAgents : MOCK_AGENTS

  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto max-w-[1400px] px-4 py-10 md:py-14">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mb-10 max-w-[65ch] animate-fade-up">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Skill catalog</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-[2.6rem] md:leading-[1.05]">Install skills into agents</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Every marketplace capability is an installable skill that wraps a Ritual precompile. Pick an agent and
            install any skill — the agent instantly gains that capability. No wallet or transaction required.
            {!onchain && " Showing mock agents (RPC unreachable)."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1"><Boxes className="h-3 w-3 text-primary" />{agents.length} agents</span>
            <span className="rounded-full border border-border/70 px-2.5 py-1">HTTP · 0x…0801</span>
            <span className="rounded-full border border-border/70 px-2.5 py-1">LLM · 0x…0802</span>
          </div>
        </div>
        <SkillCatalog />
      </section>
    </div>
  )
}
