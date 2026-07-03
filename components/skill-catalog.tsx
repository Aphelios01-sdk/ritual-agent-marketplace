"use client"

import { useState } from "react"
import { Cpu, Check, Copy, Code2, ExternalLink, Sparkles, Users, GitFork, PlusCircle, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BUILT_IN_SKILLS, COMMUNITY_SKILLS, type SkillDefinition } from "@/lib/constants"
import { cn } from "@/lib/utils"

const REPO = "https://github.com/Aphelios01-sdk/ritual-agent-marketplace"

function skillPackage(s: SkillDefinition) {
  const pkg = `@prompt-market/${s.name}`
  return {
    pkg,
    npm: `https://www.npmjs.com/package/${pkg}`,
    github: `${REPO}#skills`,
    install: `pnpm add ${pkg}`,
  }
}

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard unavailable */
    }
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
  const pkg = skillPackage(skill)
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
              <div className="flex items-center gap-1.5">
                <p className="font-semibold leading-tight">{skill.name}</p>
                {skill.source === "official" ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/10 px-1.5 py-0.5 font-mono text-[9px] text-green-500">
                    <ShieldCheck className="h-2.5 w-2.5" /> official
                  </span>
                ) : (
                  <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 font-mono text-[9px] text-blue-500">
                    community
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={cn("rounded-full px-1.5 py-0.5 font-mono text-[9px]", tone === "primary" ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-500")}>
                  {skill.precompileType}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">{pkg.pkg}</span>
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

        {skill.source === "community" && skill.author && (
          <div className="mb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <GitFork className="h-3 w-3" />
            <span>by </span>
            {skill.authorUrl ? (
              <a href={skill.authorUrl} target="_blank" rel="noreferrer" onClick={(e) => selectable && e.stopPropagation()} className="text-primary hover:underline">{skill.author}</a>
            ) : (
              <span>{skill.author}</span>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href={pkg.github}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => selectable && e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Code2 className="h-3 w-3" /> GitHub <ExternalLink className="h-2.5 w-2.5" />
            </a>
            <a
              href={pkg.npm}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => selectable && e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              npm <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1.5">
            <span className="font-mono text-[11px] text-foreground">$ {pkg.install}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                copy(pkg.install)
              }}
              className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
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
  const officialSkills = BUILT_IN_SKILLS.filter((s) => s.source === "official")
  const communitySkills = COMMUNITY_SKILLS

  const renderSkillSection = (title: string, icon: React.ReactNode, skills: SkillDefinition[], badge: string) => (
    <section>
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold">{title}</h3>
        <span className="font-mono text-[10px] text-muted-foreground">{badge}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {skills.map((s) => (
          <SkillCard key={s.skillId} skill={s} />
        ))}
      </div>
    </section>
  )

  return (
    <div className="space-y-10">
      {renderSkillSection("Official HTTP skills", <Sparkles className="h-4 w-4 text-primary" />,
        officialSkills.filter((s) => s.precompileType === "HTTP"), "0x…0801")}

      {renderSkillSection("Official LLM skills", <Cpu className="h-4 w-4 text-primary" />,
        officialSkills.filter((s) => s.precompileType === "LLM"), "0x…0802")}

      {renderSkillSection("Community skills", <Users className="h-4 w-4 text-blue-500" />,
        communitySkills, "")}

      {/* Contribute section */}
      <Card className="surface-card border-dashed border-primary/40">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <PlusCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="mb-1 font-semibold">Submit a community skill</p>
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                Have a useful skill for the agent marketplace? Package it and submit a PR.
                Skills must wrap a Ritual precompile (HTTP or LLM) and include a valid <code className="font-mono text-xs">SkillDefinition</code> manifest.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="default" size="sm" className="gap-1.5">
                  <a href={`${REPO}/issues/new?template=skill-submission.md`} target="_blank" rel="noreferrer">
                    <GitFork className="h-3.5 w-3.5" /> Submit via GitHub
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <a href={`${REPO}#contributing`} target="_blank" rel="noreferrer">
                    <Code2 className="h-3.5 w-3.5" /> Contribution guide
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card border-border/60">
        <CardContent className="p-5 text-sm text-muted-foreground">
          <p className="mb-2 font-semibold text-foreground">Install a skill into an agent</p>
          <p>Skills are versioned packages. Install via your package manager, then register the skill on-chain with <code className="font-mono text-xs text-foreground">AgentRegistry.setSkills(agentId, [skill])</code>:</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed"><code className="font-mono">{`pnpm add @prompt-market/fetch-token-price
# then in your agent's setup:
registry.setSkills(agentId, [skill])`}</code></pre>
          <Button asChild variant="outline" size="sm" className="mt-3 gap-1.5">
            <a href={`${REPO}`} target="_blank" rel="noreferrer">
              <Code2 className="h-3.5 w-3.5" /> View repository
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
