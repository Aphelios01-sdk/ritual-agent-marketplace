"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard, Bot, Briefcase, Layers, Activity, BookOpen,
  ArrowUpRight, Zap, Clock, Search, ExternalLink, FlaskConical,
} from "lucide-react"
import type { AgentInfo, JobRequestInfo, JobStatus } from "@/lib/constants"
import { JOB_STATUS_LABELS } from "@/lib/constants"
import {
  formatRating, formatRitual, shortAddress, isZeroAddress, cn,
  explorerAddressUrl, isTestEntity,
} from "@/lib/utils"
import { BlockDeadline } from "@/components/block-deadline"
import { LiveBlock } from "@/components/live-block"
import { useLiveBlock } from "@/hooks/use-live-block"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { useT } from "@/lib/i18n/context"

interface Props {
  agents: AgentInfo[]
  jobs: JobRequestInfo[]
  chainInfo: { block: bigint; chainId: number } | null
  onchain: boolean
}

export function InferenceDashboard({ agents, jobs, chainInfo, onchain }: Props) {
  const t = useT()
  const d = t.dashboard
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState<JobStatus | "ALL">("ALL")
  const initialBlock = chainInfo ? Number(chainInfo.block) : 0
  const live = useLiveBlock(initialBlock, 2000)

  const open = jobs.filter((j) => j.status === "OPEN").length
  const active = jobs.filter((j) => j.status === "ASSIGNED" || j.status === "IN_PROGRESS").length
  const done = jobs.filter((j) => j.status === "COMPLETED").length
  const disputed = jobs.filter((j) => j.status === "DISPUTED").length

  const filteredAgents = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return agents
    return agents.filter(
      (a) => a.name.toLowerCase().includes(s) || a.description.toLowerCase().includes(s),
    )
  }, [agents, q])

  const recentJobs = useMemo(() => {
    const filtered =
      statusFilter === "ALL" ? jobs : jobs.filter((j) => j.status === statusFilter)
    return filtered.slice(0, 7)
  }, [jobs, statusFilter])

  const statusOptions: (JobStatus | "ALL")[] = useMemo(() => {
    const present = new Set<JobStatus>(jobs.map((j) => j.status))
    const order: JobStatus[] = [
      "OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "DISPUTED", "REFUNDED", "CANCELLED",
    ]
    return ["ALL", ...order.filter((s) => present.has(s))]
  }, [jobs])

  const SIDE = [
    { href: "/dashboard", label: d.overview, icon: LayoutDashboard },
    { href: "/jobs", label: d.tasksNav, icon: Briefcase },
    { href: "/#agents", label: d.agentsNav, icon: Bot },
    { href: "/layers", label: d.layersNav, icon: Layers },
    { href: "/analytics", label: d.observe, icon: Activity },
    { href: "/skills", label: d.skillsNav, icon: Zap },
    { href: "/docs", label: d.docsNav, icon: BookOpen },
  ]

  const kpis = [
    { label: d.requests, value: jobs.length, sub: `${open} ${d.open.toLowerCase()}`, icon: Briefcase },
    { label: d.agents, value: agents.length, sub: onchain ? d.onchain : d.offline, icon: Bot },
    { label: d.pipeline, value: active, sub: `${done} ${d.completed}`, icon: Clock },
  ]

  return (
    <div className="flex min-h-[calc(100dvh-3rem)] flex-col md:flex-row">
      {/* Mobile horizontal nav */}
      <div className="border-b border-border/40 md:hidden">
        <nav className="scrollbar-none flex gap-1 overflow-x-auto px-3 py-2">
          {SIDE.map((item) => {
            const Icon = item.icon
            const activeItem = item.href === "/dashboard"
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors",
                  activeItem
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 opacity-80" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <aside className="hidden w-[220px] shrink-0 border-r border-border/40 bg-card/20 md:flex md:flex-col">
        <div className="border-b border-border/40 px-4 py-4">
          <p className="text-[11px] text-muted-foreground">{d.workspace}</p>
          <p className="mt-0.5 text-sm font-semibold tracking-tight">{d.production}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {SIDE.map((item) => {
            const Icon = item.icon
            const activeItem = item.href === "/dashboard"
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                  activeItem
                    ? "bg-muted text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 opacity-80" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border/40 p-3">
          <Link href="/create" className="inf-btn inf-btn-primary h-9 w-full text-xs">
            {d.deployAgent}
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="border-b border-border/40 px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight sm:text-xl">{d.overview}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                <span>
                  {d.console}: {live.online || onchain ? d.live : d.degraded}
                </span>
                <LiveBlock initialBlock={initialBlock} variant="compact" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Link href="/jobs" className="inf-btn inf-btn-ghost h-9 px-3 text-xs sm:h-8">
                {d.postTask}
              </Link>
              <Link href="/create" className="inf-btn inf-btn-primary h-9 px-3 text-xs sm:h-8">
                {d.deploy}
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-3 sm:space-y-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
            {kpis.map((k) => {
              const Icon = k.icon
              return (
                <div key={k.label} className="inf-card min-w-0 p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-[11px] text-muted-foreground">{k.label}</p>
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                  </div>
                  <p className="mt-2 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
                    <AnimatedNumber value={k.value} decimals={0} />
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{k.sub}</p>
                </div>
              )
            })}
            <div className="col-span-2 min-w-0 sm:col-span-1 xl:col-span-1">
              <LiveBlock initialBlock={initialBlock} variant="card" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="inf-card p-4 lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-tight">{d.networkActivity}</p>
                  <p className="text-[11px] text-muted-foreground">{d.jobsByStatus}</p>
                </div>
                <Link href="/analytics" className="inline-flex items-center text-[11px] text-muted-foreground hover:text-foreground">
                  {d.observe} <ArrowUpRight className="ml-0.5 h-3 w-3" />
                </Link>
              </div>
              {open === 0 && active === 0 && done === 0 ? (
                <div className="rounded-xl border border-dashed border-border/50 bg-background/30 px-4 py-8 text-center">
                  <p className="text-sm font-medium tracking-tight">{d.pipelineEmpty}</p>
                  <p className="mx-auto mt-1.5 max-w-sm text-[12px] leading-relaxed text-muted-foreground">
                    {d.pipelineEmptyBody}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full border border-border/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                      {d.open} 0
                    </span>
                    <span className="rounded-full border border-border/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                      {d.active} 0
                    </span>
                    <span className="rounded-full border border-border/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                      {d.done} 0
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Link href="/jobs" className="inf-btn inf-btn-primary h-8 px-3 text-xs">
                      {d.postATask}
                    </Link>
                    <Link href="/create" className="inf-btn inf-btn-ghost h-8 px-3 text-xs">
                      {d.deployAgent}
                    </Link>
                    <Link href="/templates" className="inf-btn inf-btn-ghost h-8 px-3 text-xs">
                      {d.useTemplate}
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: d.open, n: open, c: "bg-chart-3" },
                      { label: d.active, n: active, c: "bg-chart-1" },
                      { label: d.done, n: done, c: "bg-chart-2" },
                      { label: d.disputed, n: disputed, c: "bg-destructive" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-border/40 bg-background/40 p-3"
                      >
                        <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full", s.c)}
                            style={{
                              width: `${Math.min(100, (s.n / Math.max(1, jobs.length)) * 100 || 4)}%`,
                            }}
                          />
                        </div>
                        <p className="text-lg font-semibold tabular-nums tracking-tight">{s.n}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex h-20 items-end gap-[3px]">
                    {Array.from({ length: 40 }).map((_, i) => {
                      const h = 18 + ((i * 19 + agents.length * 7 + jobs.length * 3) % 72)
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-[2px] bg-foreground/[0.08] transition-colors hover:bg-foreground/20"
                          style={{ height: `${h}%` }}
                        />
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="inf-card p-4 lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold tracking-tight">{d.recentTasks}</p>
                <Link href="/jobs" className="text-[11px] text-muted-foreground hover:text-foreground">
                  {d.viewAll}
                </Link>
              </div>
              <div className="scrollbar-none -mx-1 mb-2 flex gap-1 overflow-x-auto px-1">
                {statusOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                      statusFilter === s
                        ? "border-foreground bg-muted text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s === "ALL" ? "all" : JOB_STATUS_LABELS[s as JobStatus]}
                  </button>
                ))}
              </div>
              <ul className="space-y-0.5">
                {recentJobs.length === 0 && (
                  <li className="flex flex-col items-center gap-2 py-10 text-center">
                    <p className="text-xs font-medium text-foreground">{d.noTasksOnchain}</p>
                    <p className="max-w-[16rem] text-[11px] text-muted-foreground">
                      {d.noTasksHint}
                    </p>
                    <Link href="/jobs" className="text-[11px] text-[#00ff99] hover:underline">
                      {d.openTaskBoard}
                    </Link>
                  </li>
                )}
                {recentJobs.map((j) => {
                  const isTest = isTestEntity(j.taskData, j.requester)
                  return (
                  <li key={j.id}>
                    <div className="flex items-start justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium tracking-tight">
                          <Link href={`/jobs/${j.id}`} className="hover:underline">
                            Job #{j.id}
                          </Link>{" "}
                          <span className="font-mono text-[11px] font-normal text-[#00ff99]/90">
                            {formatRitual(j.reward)}
                          </span>
                          {isTest && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 rounded border border-amber-500/40 bg-amber-500/10 px-1 py-px align-middle font-mono text-[9px] uppercase tracking-wide text-amber-500">
                              <FlaskConical className="h-2.5 w-2.5" /> test
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {j.taskData || "n/a"}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-[10px] text-muted-foreground/80">
                          <span>
                            {shortAddress(j.requester)}
                            {!isZeroAddress(j.provider) ? ` → ${shortAddress(j.provider)}` : ` · ${d.awaitingProvider}`}
                          </span>
                          <a
                            href={explorerAddressUrl(j.requester)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-muted-foreground/60 hover:text-foreground"
                            title="View requester on explorer"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </p>
                        {j.deadline != null && j.deadline > BigInt(0) && (
                          <div className="mt-0.5">
                            <BlockDeadline
                              deadline={j.deadline}
                              initialBlock={initialBlock}
                              variant="compact"
                            />
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 rounded-md border border-border/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {JOB_STATUS_LABELS[j.status] || j.status}
                      </span>
                    </div>
                  </li>
                  )
                })}
              </ul>
            </div>
          </div>

          <div id="agents" className="inf-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold tracking-tight">{d.agentsSection}</p>
                <p className="text-[11px] text-muted-foreground">{d.registrySub}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={d.searchShort}
                    className="w-36 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <Link href="/create" className="inf-btn inf-btn-primary h-8 px-3 text-xs">
                  {d.deploy}
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">{d.name}</th>
                    <th className="px-4 py-2.5 font-medium">{d.jobsCol}</th>
                    <th className="px-4 py-2.5 font-medium">{d.ratingCol}</th>
                    <th className="hidden px-4 py-2.5 font-medium md:table-cell">{d.skillsCol}</th>
                    <th className="hidden px-4 py-2.5 font-medium lg:table-cell">{d.statusCol}</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((a) => {
                    const agentTest = isTestEntity(a.name, a.description)
                    return (
                    <tr key={a.id} className="border-b border-border/25 last:border-0 transition-colors hover:bg-white/[0.015]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium tracking-tight">
                          <Link href={`/agents/${a.id}`} className="hover:underline">
                            {a.name}
                          </Link>
                          {agentTest && (
                            <span className="inline-flex items-center gap-0.5 rounded border border-amber-500/40 bg-amber-500/10 px-1 py-px font-mono text-[9px] uppercase tracking-wide text-amber-500">
                              <FlaskConical className="h-2.5 w-2.5" /> test
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                          #{a.id}
                          <a
                            href={explorerAddressUrl(a.contractAddress)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-muted-foreground/60 hover:text-foreground"
                            title="View agent contract on explorer"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{a.jobCount}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatRating(a.avgRating)}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{a.skills.length}</td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            a.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {a.active ? d.activeStatus : d.offStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/agents/${a.id}`} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                          {d.openLink}
                        </Link>
                      </td>
                    </tr>
                    )
                  })}
                  {filteredAgents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        {d.noAgentsMatch}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
