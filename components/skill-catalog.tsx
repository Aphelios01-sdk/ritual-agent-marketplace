"use client"

import { useState } from "react"
import { Cpu, Check, Copy, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { BUILT_IN_SKILLS, type SkillDefinition } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n/context"

function skillSnippet(s: SkillDefinition) {
  return `registry.setSkills(agentId, [{
  skillId: "${s.skillId}",
  name: "${s.name}",
  precompileAddr: "${s.precompileType === "HTTP" ? "0x0000000000000000000000000000000000000801" : "0x0000000000000000000000000000000000000802"}",
  active: true
}])`
}

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch { /* clipboard unavailable */ }
  }
  return { copied, copy }
}

export function SkillCard({
  skill,
  selected,
  onToggle,
}: {
  skill: SkillDefinition
  selected?: boolean
  onToggle?: () => void
}) {
  const t = useT()
  const p = t.skillsPage
  const snippet = skillSnippet(skill)
  const { copied, copy } = useCopy()
  const tone = skill.precompileType === "HTTP" ? "blue" : "primary"
  const selectable = typeof onToggle === "function"

  const inner = (
    <Card
      className={cn(
        "surface-card sheen border-border/60 transition-all",
        selectable && "cursor-pointer hover:-translate-y-0.5",
        selected && "border-primary/60",
      )}
    >
      <CardContent className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", tone === "primary" ? "border-primary/25 bg-primary/10 text-primary" : "border-blue-500/25 bg-blue-500/10 text-blue-500")}>
              <Cpu className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="font-semibold leading-tight">{skill.name}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={cn("rounded-full px-1.5 py-0.5 font-mono text-[9px]", tone === "primary" ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-500")}>
                  {skill.precompileType}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">{skill.skillId.slice(0, 10)}…</span>
              </div>
            </div>
          </div>
          {selectable && (
            <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border", selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
              {selected && <Check className="h-3 w-3" />}
            </div>
          )}
        </div>

        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{skill.description}</p>

        <div className="rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1.5">
          <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-foreground">{snippet}</pre>
          <button
            onClick={(e) => { e.stopPropagation(); copy(snippet) }}
            className="mt-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
            {copied ? p.copied : p.copy}
          </button>
        </div>
      </CardContent>
    </Card>
  )

  return selectable ? (
    <div onClick={onToggle} role="checkbox" aria-checked={selected} tabIndex={0}>
      {inner}
    </div>
  ) : (
    inner
  )
}

export function SkillCatalog() {
  const t = useT()
  const p = t.skillsPage
  const allSkills = BUILT_IN_SKILLS

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">{p.available}</h3>
          <span className="font-mono text-[10px] text-muted-foreground">
            {allSkills.length} {p.skillsCount}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {allSkills.map((s) => (
            <SkillCard key={s.skillId} skill={s} />
          ))}
        </div>
      </section>

      <Card className="surface-card border-border/60">
        <CardContent className="p-5 text-sm text-muted-foreground">
          <p className="mb-2 font-semibold text-foreground">{p.registerTitle}</p>
          <p>
            {p.registerBody}{" "}
            <code className="font-mono text-xs text-foreground">AgentRegistry</code> /{" "}
            <code className="font-mono text-xs text-foreground">setSkills(agentId, [skill])</code>
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed"><code className="font-mono">{`// AgentRegistry.setSkills(agentId, [skill])
const skill = {
  skillId: "0x0000…0001",
  name: "fetch-token-price",
  precompileAddr: "0x…0801", // HTTP
  active: true
}
await registry.setSkills(agentId, [skill])`}</code></pre>
          <p className="mt-2 text-xs">{p.registerHint}</p>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-muted/40 p-2 text-xs"><code className="font-mono">pnpm tsx scripts/bootstrap-agent.ts</code></pre>
        </CardContent>
      </Card>
    </div>
  )
}
