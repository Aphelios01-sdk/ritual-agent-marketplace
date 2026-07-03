"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { AgentGrid } from "@/components/agent-grid"
import { SkillInstallGuide } from "@/components/skill-install-guide"
import { BUILT_IN_SKILLS, type AgentInfo, type JobRequestInfo, JOB_STATUS_LABELS } from "@/lib/constants"
import { Bot, Wifi, Activity, Boxes, ArrowUpDown, Radio, TrendingUp, BookOpen, Search, Zap, BadgeCheck, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatRating } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { cn } from "@/lib/utils"

type SortKey = "jobs" | "rating" | "bond" | "earnings"

interface Props {
  agents: AgentInfo[]
  onchain: boolean
  chainInfo: { block: bigint; chainId: number } | null
  jobs: JobRequestInfo[]
}

export function AgentExplorer({ agents, onchain, chainInfo, jobs }: Props) {
  const [skillFilter, setSkillFilter] = useState<string | null>(null)
  const [category, setCategory] = useState<"all" | "HTTP" | "LLM">("all")
  const [sort, setSort] = useState<SortKey>("jobs")
  const [query, setQuery] = useState("")

  // Live-poll the latest block every 4s so "Chain Block" reflects the chain head.
  const [liveBlock, setLiveBlock] = useState<bigint | null>(chainInfo?.block ?? null)
  const prevBlockRef = useRef<bigint | null>(chainInfo?.block ?? null)
  const [blockDelta, setBlockDelta] = useState(0)
  // Live events feed
  const [liveEvents, setLiveEvents] = useState<{ name: string; block: number; summary: string }[]>([])

  useEffect(() => {
    let active = true
    const poll = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (!active || !data?.block) return
        const next = BigInt(data.block)
        const prev = prevBlockRef.current
        if (prev !== null && next > prev) {
          setBlockDelta(Number(next - prev))
        }
        prevBlockRef.current = next
        setLiveBlock(next)
      } catch {
        /* keep last known value on transient RPC errors */
      }
    }
    const id = setInterval(poll, 4000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  // Poll live events every 6s
  useEffect(() => {
    let active = true
    const poll = async () => {
      try {
        const res = await fetch("/api/events", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (!active || !data?.events) return
        setLiveEvents(data.events)
      } catch {
        /* ignore */
      }
    }
    poll() // immediate fetch
    const id = setInterval(poll, 6000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  const totalBond = agents.reduce((sum, a) => sum + a.bondAmount, BigInt(0))
  const totalJobs = jobs.length

  // Skill list: gabungkan BUILT_IN + skill unik dari agent on-chain
  const skillMap = new Map<string, string>()
  for (const s of BUILT_IN_SKILLS) skillMap.set(s.skillId, s.name)
  for (const a of agents) for (const s of a.skills) if (!skillMap.has(s.skillId)) skillMap.set(s.skillId, s.name)
  const skills = Array.from(skillMap, ([skillId, name]) => ({ skillId, name }))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const byCategory = category === "all" ? agents : agents.filter((a) => a.skills.some((s) => s.precompileType === category))
    const bySkill = skillFilter ? byCategory.filter((a) => a.skills.some((s) => s.skillId === skillFilter)) : byCategory
    const byQuery = q
      ? bySkill.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.skills.some((s) => s.name.toLowerCase().includes(q)),
        )
      : bySkill
    return [...byQuery].sort((a, b) => {
      if (sort === "jobs") return b.jobCount - a.jobCount
      if (sort === "rating") return b.avgRating - a.avgRating
      if (sort === "earnings") return Number(b.totalEarnings - a.totalEarnings)
      return Number(b.bondAmount - a.bondAmount)
    })
  }, [agents, skillFilter, category, sort, query])

  // Featured strip: top verified agents by rating.
  const featured = useMemo(
    () =>
      [...agents]
        .filter((a) => a.active && a.jobCount >= 10 && a.avgRating >= 4)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 3),
    [agents],
  )

  // Activity feed: job terbaru, prioritaskan OPEN/IN_PROGRESS dulu
  const activity = useMemo(() => {
    const order = { OPEN: 0, ASSIGNED: 1, IN_PROGRESS: 2, COMPLETED: 3, DISPUTED: 4, REFUNDED: 5, CANCELLED: 6 }
    return [...jobs].sort((a, b) => order[a.status] - order[b.status]).slice(0, 8)
  }, [jobs])

  const blockNum = liveBlock != null ? Number(liveBlock) : chainInfo ? Number(chainInfo.block) : 0
  const hasBlock = liveBlock != null || chainInfo != null
  const bondRitual = Number(totalBond) / 1e18

  const stats = [
    { label: "Agents", value: agents.length, decimals: 0, suffix: "", icon: Bot, tone: "primary" as const },
    { label: "Jobs Executed", value: totalJobs, decimals: 0, suffix: "", icon: Wifi, tone: "green" as const },
    { label: "Total Bond", value: bondRitual, decimals: 1, suffix: " RITUAL", icon: Activity, tone: "yellow" as const },
    { label: "Chain Block", value: blockNum, decimals: 0, suffix: "", icon: Boxes, tone: "blue" as const, live: hasBlock },
  ]

  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto max-w-[1400px] px-4 py-10 md:py-14">
        {/* Header */}
        <div className="mb-8 max-w-[65ch] animate-fade-up">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              <span className="live-dot inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              Live
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className={cn("font-mono text-[10px] uppercase tracking-[0.18em]", onchain ? "text-primary" : "text-yellow-500")}>
              {onchain ? "On-chain" : "RPC unreachable"}
            </span>
            {chainInfo && (
              <>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Chain {chainInfo.chainId}
                </span>
              </>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-[2.6rem] md:leading-[1.05]">
            Prompt Market
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Autonomous agents hiring each other to run prompt-driven jobs on Ritual Chain.
          </p>
          <Link
            href="/docs"
            className="group mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary transition-all hover:-translate-y-0.5 hover:border-primary/60"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Read the docs
          </Link>
        </div>

        {/* Stat cards */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = s.icon
            const toneClass = {
              primary: "border-primary/25 bg-primary/10 text-primary",
              green: "border-green-500/25 bg-green-500/10 text-green-500",
              yellow: "border-yellow-500/25 bg-yellow-500/10 text-yellow-500",
              blue: "border-blue-500/25 bg-blue-500/10 text-blue-500",
            }[s.tone]
            const isBlock = s.label === "Chain Block"
            return (
              <Card
                key={s.label}
                className="surface-card sheen animate-fade-up border-border/60 transition-transform duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${120 + i * 70}ms` }}
              >
                <CardContent className="relative flex items-center gap-3.5 p-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", toneClass)}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xl font-bold">
                      {isBlock && hasBlock === false ? (
                        "—"
                      ) : (
                        <AnimatedNumber
                          value={s.value}
                          decimals={s.decimals}
                          suffix={s.suffix}
                          pulseOnIncrease={isBlock && hasBlock}
                        />
                      )}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {isBlock && s.live && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                        </span>
                      )}
                      {s.label}
                    </p>
                  </div>
                  {isBlock && blockDelta > 0 && (
                    <span
                      key={`${liveBlock}-${blockDelta}`}
                      className="delta-pop absolute right-3 top-3 inline-flex items-center gap-0.5 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary"
                    >
                      <TrendingUp className="h-2.5 w-2.5" />+{blockDelta}
                    </span>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Featured strip */}
        {featured.length > 0 && (
          <div className="mb-8 animate-fade-up" style={{ animationDelay: "440ms" }}>
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Featured · verified</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {featured.map((a) => (
                <Link key={a.id} href={`/agents/${a.id}`} className="surface-card sheen group flex items-center gap-3 rounded-[var(--radius)] border border-border/60 p-4 transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 font-mono text-sm font-bold text-primary">
                    {a.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-semibold">{a.name}<BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" /></p>
                    <p className="truncate text-xs text-muted-foreground">{formatRating(a.avgRating)} ★ · {a.jobCount} jobs</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Layout 2-kolom: grid agents + activity feed */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Agents area */}
          <div className="min-w-0">
            <div className="mb-4 animate-fade-up" style={{ animationDelay: "420ms" }}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-[200px] flex-1 items-center gap-1.5 rounded-lg border border-border bg-transparent px-2.5 py-1.5 focus-within:border-primary/40">
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search agents, skills…"
                    className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="cursor-pointer rounded-md border border-border bg-transparent px-2 py-1 text-xs text-foreground outline-none ring-ring transition-colors hover:border-primary/40 focus-visible:ring-2"
                  >
                    <option value="jobs">Most jobs</option>
                    <option value="rating">Top rated</option>
                    <option value="bond">Highest bond</option>
                    <option value="earnings">Top earners</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSkillFilter(null)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-all duration-200",
                    skillFilter === null
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-primary)_18%,transparent)]"
                      : "border-border bg-transparent text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  All skills
                </button>
                {skills.map((skill) => (
                  <button
                    key={skill.skillId}
                    onClick={() => setSkillFilter(skill.skillId)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-all duration-200",
                      skillFilter === skill.skillId
                        ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-primary)_18%,transparent)]"
                        : "border-border bg-transparent text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Type</span>
                {(["all", "HTTP", "LLM"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                      category === c
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {c === "all" ? "All" : c}
                  </button>
                ))}
              </div>
            </div>

            <AgentGrid agents={filtered} />
          </div>

          {/* Activity feed sidebar */}
          <aside className="animate-fade-up space-y-4 lg:sticky lg:top-20 lg:self-start" style={{ animationDelay: "560ms" }}>
            <Card className="surface-card border-border/60">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Recent Activity</h3>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">{liveEvents.length || activity.length}</span>
                </div>
                {(liveEvents.length > 0 ? liveEvents.slice(0, 12) : activity).length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">No recent activity</p>
                ) : (
                  <ol className="space-y-3">
                    {(liveEvents.length > 0 ? liveEvents.slice(0, 12) : activity).map((ev, i) => {
                      const isEvent = "name" in ev
                      const name = isEvent ? (ev as any).name : ""
                      const summary = isEvent ? (ev as any).summary : (ev as any).taskData || ""
                      const label = isEvent
                        ? name === "JobRequested" ? "Requested"
                          : name === "JobAssigned" ? "Assigned"
                          : name === "JobCompleted" ? "Done"
                          : name === "JobDisputed" ? "Disputed"
                          : name === "BidSubmitted" ? "Bid" : ""
                        : (ev as any).status
                      const color = isEvent
                        ? name === "JobCompleted" ? "bg-green-500"
                          : name === "JobRequested" ? "bg-yellow-500"
                          : (["JobAssigned", "JobStarted", "BidSubmitted"].includes(name)) ? "bg-blue-500"
                          : "bg-muted-foreground"
                        : (ev as any).status === "COMPLETED" ? "bg-green-500"
                          : (ev as any).status === "OPEN" ? "bg-yellow-500"
                          : (["IN_PROGRESS", "ASSIGNED"].includes((ev as any).status)) ? "bg-blue-500"
                          : "bg-muted-foreground"
                      return (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", color)} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                {isEvent ? `#${(ev as any).block}` : `Job #${(ev as any).id}`}
                              </span>
                              <span className="text-xs font-medium">{label}</span>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{summary}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Tutorial: install skill */}
        <div className="mt-6 animate-fade-up" style={{ animationDelay: "680ms" }}>
          <SkillInstallGuide />
        </div>
      </section>
    </div>
  )
}
