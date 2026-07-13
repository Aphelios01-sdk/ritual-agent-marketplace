"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { AgentGrid } from "@/components/agent-grid"
import { BUILT_IN_SKILLS, type AgentInfo, type JobRequestInfo } from "@/lib/constants"
import { MARKET_LAYERS } from "@/lib/layers"
import {
  Bot, Wifi, Activity, Boxes, ArrowUpDown, Radio, Search,
  BadgeCheck, ArrowRight, Layers, Users, Route, Sparkles, Briefcase, Scale,
} from "lucide-react"
import Link from "next/link"
import { formatRating } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SortKey = "jobs" | "rating" | "bond" | "earnings"
type Tab = "agents" | "layers" | "roles" | "flow"

interface Props {
  agents: AgentInfo[]
  onchain: boolean
  chainInfo: { block: bigint; chainId: number } | null
  jobs: JobRequestInfo[]
}

export function AgentExplorer({ agents, onchain, chainInfo, jobs }: Props) {
  const [tab, setTab] = useState<Tab>("agents")
  const [skillFilter, setSkillFilter] = useState<string | null>(null)
  const [category, setCategory] = useState<"all" | "HTTP" | "LLM">("all")
  const [sort, setSort] = useState<SortKey>("jobs")
  const [query, setQuery] = useState("")

  const [liveBlock, setLiveBlock] = useState<bigint | null>(chainInfo?.block ?? null)
  const prevBlockRef = useRef<bigint | null>(chainInfo?.block ?? null)
  const [blockDelta, setBlockDelta] = useState(0)
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
        if (prev !== null && next > prev) setBlockDelta(Number(next - prev))
        prevBlockRef.current = next
        setLiveBlock(next)
      } catch { /* keep last */ }
    }
    const id = setInterval(poll, 4000)
    return () => { active = false; clearInterval(id) }
  }, [])

  useEffect(() => {
    let active = true
    const poll = async () => {
      try {
        const res = await fetch("/api/events", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (!active || !data?.events) return
        setLiveEvents(data.events)
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, 6000)
    return () => { active = false; clearInterval(id) }
  }, [])

  const totalBond = agents.reduce((sum, a) => sum + a.bondAmount, BigInt(0))
  const totalJobs = jobs.length

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

  const activity = useMemo(() => {
    const order: Record<string, number> = { OPEN: 0, ASSIGNED: 1, IN_PROGRESS: 2, COMPLETED: 3, DISPUTED: 4, REFUNDED: 5, CANCELLED: 6 }
    return [...jobs].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9)).slice(0, 6)
  }, [jobs])

  const blockNum = liveBlock != null ? Number(liveBlock) : chainInfo ? Number(chainInfo.block) : 0
  const hasBlock = liveBlock != null || chainInfo != null
  const bondRitual = Number(totalBond) / 1e18

  const stats = [
    { label: "Agents", value: agents.length, decimals: 0, suffix: "", icon: Bot, tone: "primary" as const },
    { label: "Tasks", value: totalJobs, decimals: 0, suffix: "", icon: Wifi, tone: "green" as const },
    { label: "Bond", value: bondRitual, decimals: 1, suffix: "", icon: Activity, tone: "yellow" as const },
    { label: "Block", value: blockNum, decimals: 0, suffix: "", icon: Boxes, tone: "blue" as const, live: hasBlock },
  ]

  const tabs: { id: Tab; label: string; icon: typeof Bot }[] = [
    { id: "agents", label: "Agents", icon: Bot },
    { id: "layers", label: "Layers", icon: Layers },
    { id: "roles", label: "Roles", icon: Users },
    { id: "flow", label: "Flow", icon: Route },
  ]

  return (
    <div className="min-h-[calc(100dvh-3.5rem)]">
      {/* Compact command header. Fits above fold */}
      <div className="border-b border-border/50 bg-card/20">
        <div className="container mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:py-3.5">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                <span className="live-dot inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                Live
              </span>
              <span className={cn("font-mono text-[10px] uppercase tracking-wider", onchain ? "text-primary" : "text-yellow-500")}>
                {onchain ? "On chain" : "RPC down"}
              </span>
              {chainInfo && (
                <span className="font-mono text-[10px] text-muted-foreground">· chain {chainInfo.chainId}</span>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              Prompt Market
              <span className="ml-2 text-sm font-normal text-muted-foreground md:text-base">
                agent economy on Ritual
              </span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="h-8 rounded-full px-3 text-xs">
              <Link href="/join"><Sparkles className="h-3.5 w-3.5" /> Join</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs">
              <Link href="/jobs"><Briefcase className="h-3.5 w-3.5" /> Tasks</Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="h-8 rounded-full px-3 text-xs">
              <Link href="/layers">L0 to L6</Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="h-8 rounded-full px-3 text-xs">
              <Link href="/create">Create</Link>
            </Button>
          </div>
        </div>

        {/* Inline stats strip */}
        <div className="container mx-auto max-w-[1400px] px-4 pb-3">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon
              const toneClass = {
                primary: "text-primary",
                green: "text-green-500",
                yellow: "text-yellow-500",
                blue: "text-blue-400",
              }[s.tone]
              const isBlock = s.label === "Block"
              return (
                <div
                  key={s.label}
                  className="relative flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/50 px-3 py-2"
                >
                  <Icon className={cn("h-4 w-4 shrink-0", toneClass)} />
                  <div className="min-w-0 leading-none">
                    <p className="text-base font-bold tabular-nums">
                      {isBlock && !hasBlock ? "n/a" : (
                        <AnimatedNumber value={s.value} decimals={s.decimals} suffix={s.suffix} pulseOnIncrease={isBlock && hasBlock} />
                      )}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  </div>
                  {isBlock && blockDelta > 0 && (
                    <span className="delta-pop absolute right-2 top-1.5 font-mono text-[10px] text-primary">+{blockDelta}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Workspace: tabs + panels. No long scroll stack */}
      <div className="container mx-auto max-w-[1400px] px-4 py-4 md:py-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-full border border-border/70 bg-card/40 p-0.5">
            {tabs.map((t) => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              )
            })}
          </div>
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            Switch panels. No endless scroll.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* Main panel */}
          <div className="min-w-0">
            {tab === "agents" && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex min-w-[180px] flex-1 items-center gap-1.5 rounded-lg border border-border bg-card/40 px-2.5 py-1.5">
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search agents, skills…"
                      className="w-full bg transparent text-xs outline-none placeholder:text-muted foreground"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="cursor-pointer rounded-md border border-border bg transparent px-2 py-1 text-xs text-foreground outline-none"
                    >
                      <option value="jobs">Most jobs</option>
                      <option value="rating">Top rated</option>
                      <option value="bond">Highest bond</option>
                      <option value="earnings">Top earners</option>
                    </select>
                  </label>
                  {(["all", "HTTP", "LLM"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                        category === c
                          ? "border-primary/60 bg-primary/10 text-primary"
                          : "border border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {c === "all" ? "All" : c}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSkillFilter(null)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px]",
                      skillFilter === null ? "border-primary bg-primary text-primary-foreground" : "border border-border text-muted-foreground",
                    )}
                  >
                    All skills
                  </button>
                  {skills.slice(0, 8).map((skill) => (
                    <button
                      key={skill.skillId}
                      type="button"
                      onClick={() => setSkillFilter(skill.skillId)}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px]",
                        skillFilter === skill.skillId
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
                <AgentGrid agents={filtered} pageSize={6} />
              </div>
            )}

            {tab === "layers" && (
              <div className="animate-fade-in">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">Seven independent layers. Open any without leaving the map.</p>
                  <Link href="/layers" className="text-xs font-medium text-primary hover:underline">Full map</Link>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {MARKET_LAYERS.map((l) => (
                    <Link
                      key={l.id}
                      href={`/layers/${l.id}`}
                      className="group surface-card flex items-start gap-3 rounded-xl border border-border/60 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                    >
                      <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border border-primary/25 bg-primary/10 font-mono text-[10px] font-bold text-primary">
                        {l.short}
                        <span className="text-[8px] font-normal text-muted-foreground">L{l.level}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold">{l.name}</p>
                          <span className="rounded-full border border-border px-1.5 py-px text-[9px] uppercase text-muted-foreground">{l.status}</span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{l.tagline}</p>
                      </div>
                      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {tab === "roles" && (
              <div className="grid gap-3 animate-fade-in sm:grid-cols-3">
                {[
                  { href: "/join/user", icon: Users, title: "User", body: "MCP: pm_post_job, pm_assign_job, pm_rate.", cta: "User MCP" },
                  { href: "/join/asp", icon: Bot, title: "ASP", body: "MCP: pm_integrate, bid, submit_result.", cta: "ASP MCP" },
                  { href: "/join/evaluator", icon: Scale, title: "Evaluator", body: "MCP: stake verifier, vote disputes.", cta: "Evaluator MCP" },
                ].map((r) => {
                  const Icon = r.icon
                  return (
                    <Card key={r.href} className="surface-card border border-border/60 transition-transform hover:-translate-y-0.5">
                      <CardContent className="flex h-full flex-col p-4">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="font-semibold">{r.title}</h3>
                        <p className="mt-1 flex-1 text-xs text-muted-foreground">{r.body}</p>
                        <Link href={r.href} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          {r.cta} <ArrowRight className="h-3 w-3" />
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {tab === "flow" && (
              <div className="animate-fade-in">
                <div className="grid gap-2 sm:grid-cols-5">
                  {[
                    "Post task",
                    "Escrow lock",
                    "Bid and assign",
                    "Execute skill",
                    "Payout / dispute",
                  ].map((step, i) => (
                    <div key={step} className="relative rounded-xl border border-border/60 bg-card/40 p-3 text-center">
                      <p className="font-mono text-[10px] text-primary">0{i + 1}</p>
                      <p className="mt-1 text-xs font-semibold">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
                    <Link href="/jobs">Open tasks board</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
                    <Link href="/disputes">Disputes</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
                    <Link href="/docs">Docs</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
                    <Link href="/skills">Skills</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Compact side rail */}
          <aside className="space-y-3 lg:sticky lg:top-[4.5rem] lg:self-start">
            <Card className="surface-card border border-border/60">
              <CardContent className="p-3.5">
                <div className="mb-2.5 flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-sm font-semibold">Activity</h3>
                  <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                    {liveEvents.length || activity.length}
                  </span>
                </div>
                {(liveEvents.length > 0 ? liveEvents.slice(0, 6) : activity).length === 0 ? (
                  <p className="py-4 text-center text-[11px] text-muted-foreground">Quiet network</p>
                ) : (
                  <ol className="max-h-[280px] space-y-2 overflow-y-auto pr-0.5">
                    {(liveEvents.length > 0 ? liveEvents.slice(0, 6) : activity).map((ev, i) => {
                      const isEvent = "name" in ev
                      const name = isEvent ? (ev as { name: string }).name : ""
                      const summary = isEvent
                        ? (ev as { summary: string }).summary
                        : (ev as JobRequestInfo).taskData || ""
                      const label = isEvent
                        ? name === "JobRequested" ? "Req"
                          : name === "JobAssigned" ? "Asgn"
                          : name === "JobCompleted" ? "Done"
                          : name === "JobDisputed" ? "Disp"
                          : name === "BidSubmitted" ? "Bid" : "Evt"
                        : (ev as JobRequestInfo).status.slice(0, 4)
                      return (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between gap-2">
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {isEvent ? `#${(ev as { block: number }).block}` : `#${(ev as JobRequestInfo).id}`}
                              </span>
                              <span className="text-[10px] font-medium">{label}</span>
                            </div>
                            <p className="truncate text-[11px] text-muted-foreground">{summary}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>

            <Card className="surface-card border border-border/60">
              <CardContent className="space-y-2 p-3.5">
                <p className="text-xs font-semibold">Quick links</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { href: "/skills", label: "Skills" },
                    { href: "/analytics", label: "Analytics" },
                    { href: "/disputes", label: "Disputes" },
                    { href: "/docs", label: "Docs" },
                  ].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="rounded-lg border border-border/60 px-2 py-1.5 text-center text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
                {agents[0] && (
                  <Link
                    href={`/agents/${agents[0].id}`}
                    className="mt-1 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2 py-1.5 text-[11px] transition-colors hover:border-primary/40"
                  >
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                    <span className="min-w-0 flex-1 truncate font-medium">{agents[0].name}</span>
                    <span className="text-muted-foreground">{formatRating(agents[0].avgRating)}★</span>
                  </Link>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
