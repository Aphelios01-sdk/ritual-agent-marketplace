"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard, Bot, Briefcase, Layers, Activity, BookOpen,
  ArrowUpRight, Zap, Clock, Search,
} from "lucide-react"
import type { AgentInfo, JobRequestInfo } from "@/lib/constants"
import { JOB_STATUS_LABELS } from "@/lib/constants"
import { formatRating, formatRitual, shortAddress, isZeroAddress, cn } from "@/lib/utils"
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

  const recentJobs = useMemo(() => [...jobs].slice(0, 7), [jobs])

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
    <div className="flex min-h-[calc(100dvh-3.5rem)]">
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
        <div className="border-b border-border/40 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row-sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{d.overview}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                <span>
                  {d.console}: {live.online || onchain ? d.live : d.degraded}
                </span>
                <LiveBlock initialBlock={initialBlock} variant="compact" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/jobs" className="inf-btn inf-btn-ghost h-8 px-3 text-xs">
                {d.postTask}
              </Link>
              <Link href="/create" className="inf-btn inf-btn-primary h-8 px-3 text-xs">
                {d.deploy}
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k) => {
              const Icon = k.icon
              return (
                <div key={k.label} className="inf-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">{k.label}</p>
                    <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                    <AnimatedNumber value={k.value} decimals={0} />
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{k.sub}</p>
                </div>
              )
            })}
            <LiveBlock initialBlock={initialBlock} variant="card" />
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
                <div className="rounded-xl border border-border-dashed border border-border/50 bg-background/30 px-4 py-8 text-center">
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
                {recentJobs.map((j) => (
                  <li key={j.id}>
                    <Link
                      href={`/jobs/${j.id}`}
                      className="flex items-start justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium tracking-tight">
                          Job #{j.id}{" "}
                          <span className="font-mono text-[11px] font-normal text-[#00ff99]/90">
                            {formatRitual(j.reward)}
                          </span>
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {j.taskData || "n/a"}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">
                          {shortAddress(j.requester)}
                          {!isZeroAddress(j.provider) ? ` → ${shortAddress(j.provider)}` : ` · ${d.awaitingProvider}`}
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
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div id="agents" className="inf-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border/40 p-4 sm:flex-row-sm:items-center sm:justify-between">
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
                  {filteredAgents.map((a) => (
                    <tr key={a.id} className="border-b border-border/25 last:border-0 transition-colors hover:bg-white/[0.015]">
                      <td className="px-4 py-3">
                        <div className="font-medium tracking-tight">{a.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">#{a.id}</div>
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
                  ))}
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
