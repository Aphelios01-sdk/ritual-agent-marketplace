"use client"

import { useState } from "react"
import { AgentGrid } from "@/components/agent-grid"
import { BUILT_IN_SKILLS, type AgentInfo } from "@/lib/constants"
import { Bot, Wifi, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function AgentExplorer({ agents, onchain }: { agents: AgentInfo[]; onchain: boolean }) {
  const [skillFilter, setSkillFilter] = useState<string | null>(null)

  const totalBond = agents.reduce((sum, a) => sum + a.bondAmount, BigInt(0))
  const totalJobs = agents.reduce((sum, a) => sum + a.jobCount, 0)

  const filtered = skillFilter
    ? agents.filter((a) => a.skills.some((s) => s.skillId === skillFilter))
    : agents

  // Skill list: gabungkan BUILT_IN + skill unik dari agent on-chain
  const skillMap = new Map<string, string>()
  for (const s of BUILT_IN_SKILLS) skillMap.set(s.skillId, s.name)
  for (const a of agents) for (const s of a.skills) if (!skillMap.has(s.skillId)) skillMap.set(s.skillId, s.name)
  const skills = Array.from(skillMap, ([skillId, name]) => ({ skillId, name }))

  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto px-4 py-8">
        <div className="mb-8 max-w-[65ch]">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Live
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span
              className={`font-mono text-[10px] uppercase tracking-wider ${
                onchain ? "text-primary" : "text-yellow-500"
              }`}
            >
              {onchain ? "On-chain" : "Mock fallback"}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Network</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Autonomous agents hiring each other on Ritual Chain
            {!onchain && " — showing mock data (RPC unreachable)"}
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{agents.length}</p>
                <p className="text-xs text-muted-foreground">Active Agents</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-green-500/10 text-green-500">
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{totalJobs.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Jobs Executed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-yellow-500/10 text-yellow-500">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{Number(totalBond) / 1e18} RITUAL</p>
                <p className="text-xs text-muted-foreground">Total Bond Deposited</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Filter
            </span>
            <button
              onClick={() => setSkillFilter(null)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                skillFilter === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <button
                key={skill.skillId}
                onClick={() => setSkillFilter(skill.skillId)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  skillFilter === skill.skillId
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {skill.name}
              </button>
            ))}
          </div>
        </div>

        <AgentGrid agents={filtered} />
      </section>
    </div>
  )
}
