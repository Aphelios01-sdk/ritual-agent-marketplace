"use client"

import { useState, useMemo } from "react"
import { AgentGrid } from "@/components/agent-grid"
import { BUILT_IN_SKILLS, type AgentInfo, type JobRequestInfo, JOB_STATUS_LABELS } from "@/lib/constants"
import { Bot, Wifi, Activity, Boxes, ArrowUpDown, Radio } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SortKey = "jobs" | "rating" | "bond"

interface Props {
  agents: AgentInfo[]
  onchain: boolean
  chainInfo: { block: bigint; chainId: number } | null
  jobs: JobRequestInfo[]
}

export function AgentExplorer({ agents, onchain, chainInfo, jobs }: Props) {
  const [skillFilter, setSkillFilter] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>("jobs")

  const totalBond = agents.reduce((sum, a) => sum + a.bondAmount, BigInt(0))
  const totalJobs = agents.reduce((sum, a) => sum + a.jobCount, 0)

  // Skill list: gabungkan BUILT_IN + skill unik dari agent on-chain
  const skillMap = new Map<string, string>()
  for (const s of BUILT_IN_SKILLS) skillMap.set(s.skillId, s.name)
  for (const a of agents) for (const s of a.skills) if (!skillMap.has(s.skillId)) skillMap.set(s.skillId, s.name)
  const skills = Array.from(skillMap, ([skillId, name]) => ({ skillId, name }))

  const filtered = useMemo(() => {
    const base = skillFilter ? agents.filter((a) => a.skills.some((s) => s.skillId === skillFilter)) : agents
    return [...base].sort((a, b) => {
      if (sort === "jobs") return b.jobCount - a.jobCount
      if (sort === "rating") return b.avgRating - a.avgRating
      return Number(b.bondAmount - a.bondAmount)
    })
  }, [agents, skillFilter, sort])

  // Activity feed: job terbaru (mock), prioritaskan OPEN/IN_PROGRESS dulu
  const activity = useMemo(() => {
    const order = { OPEN: 0, ASSIGNED: 1, IN_PROGRESS: 2, COMPLETED: 3, DISPUTED: 4, REFUNDED: 5, CANCELLED: 6 }
    return [...jobs].sort((a, b) => order[a.status] - order[b.status]).slice(0, 8)
  }, [jobs])

  const stats = [
    { label: "Active Agents", value: String(agents.length), icon: Bot, tone: "primary" as const },
    { label: "Jobs Executed", value: totalJobs.toLocaleString(), icon: Wifi, tone: "green" as const },
    { label: "Total Bond", value: `${(Number(totalBond) / 1e18).toFixed(1)} RITUAL`, icon: Activity, tone: "yellow" as const },
    { label: "Chain Block", value: chainInfo ? Number(chainInfo.block).toLocaleString() : "—", icon: Boxes, tone: "blue" as const },
  ]

  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 max-w-[65ch]">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Live</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className={cn("font-mono text-[10px] uppercase tracking-wider", onchain ? "text-primary" : "text-yellow-500")}>
              {onchain ? "On-chain" : "Mock fallback"}
            </span>
            {chainInfo && (
              <>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Chain {chainInfo.chainId}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Network</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Autonomous agents hiring each other on Ritual Chain
            {!onchain && " — showing mock data (RPC unreachable)"}
          </p>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon
            const toneClass = {
              primary: "border-primary/20 bg-primary/10 text-primary",
              green: "border-green-500/20 bg-green-500/10 text-green-500",
              yellow: "border-yellow-500/20 bg-yellow-500/10 text-yellow-500",
              blue: "border-blue-500/20 bg-blue-500/10 text-blue-500",
            }[s.tone]
            return (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", toneClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-bold tabular-nums">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Layout 2-kolom: grid agents + activity feed */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Agents area */}
          <div className="min-w-0">
            <div className="mb-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Filter by skill
                </span>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="rounded-md border border-border bg-transparent px-2 py-1 text-xs text-foreground outline-none ring-ring focus-visible:ring-2"
                  >
                    <option value="jobs">Most jobs</option>
                    <option value="rating">Top rated</option>
                    <option value="bond">Highest bond</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSkillFilter(null)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    skillFilter === null
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  All
                </button>
                {skills.map((skill) => (
                  <button
                    key={skill.skillId}
                    onClick={() => setSkillFilter(skill.skillId)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      skillFilter === skill.skillId
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>

            <AgentGrid agents={filtered} />
          </div>

          {/* Activity feed sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Recent Activity</h3>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">{activity.length}</span>
                </div>
                {activity.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">No recent activity</p>
                ) : (
                  <ol className="space-y-3">
                    {activity.map((job) => (
                      <li key={job.id} className="flex items-start gap-3 text-sm">
                        <span
                          className={cn(
                            "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                            job.status === "COMPLETED" && "bg-green-500",
                            job.status === "OPEN" && "bg-yellow-500",
                            (job.status === "IN_PROGRESS" || job.status === "ASSIGNED") && "bg-blue-500",
                            (job.status === "DISPUTED" || job.status === "REFUNDED" || job.status === "CANCELLED") && "bg-muted-foreground"
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-muted-foreground">Job #{job.id}</span>
                            <span className="text-xs font-medium">{JOB_STATUS_LABELS[job.status]}</span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{job.taskData}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  )
}
