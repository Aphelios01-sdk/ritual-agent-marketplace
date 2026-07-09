"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard, Bot, Briefcase, Layers, Activity, Settings,
  ArrowUpRight, Zap, Clock, DollarSign, Search,
} from "lucide-react"
import type { AgentInfo, JobRequestInfo } from "@/lib/constants"
import { JOB_STATUS_LABELS } from "@/lib/constants"
import { formatRating } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Props {
  agents: AgentInfo[]
  jobs: JobRequestInfo[]
  chainInfo: { block: bigint; chainId: number } | null
  onchain: boolean
}

const SIDE = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/jobs", label: "Tasks", icon: Briefcase },
  { href: "/#agents", label: "Agents", icon: Bot },
  { href: "/layers", label: "Layers", icon: Layers },
  { href: "/analytics", label: "Observe", icon: Activity },
  { href: "/skills", label: "Skills", icon: Zap },
  { href: "/docs", label: "Docs", icon: Settings },
]

export function InferenceDashboard({ agents, jobs, chainInfo, onchain }: Props) {
  const [block, setBlock] = useState(chainInfo ? Number(chainInfo.block) : 0)
  const [q, setQ] = useState("")

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const r = await fetch("/api/stats", { cache: "no-store" })
        if (!r.ok) return
        const d = await r.json()
        if (d.block) setBlock(Number(d.block))
      } catch { /* ignore */ }
    }, 5000)
    return () => clearInterval(id)
  }, [])

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

  const recentJobs = useMemo(() => [...jobs].slice(0, 8), [jobs])

  const kpis = [
    { label: "Requests (jobs)", value: jobs.length.toLocaleString(), sub: `${open} open`, icon: Briefcase },
    { label: "Avg agents online", value: String(agents.length), sub: onchain ? "on-chain" : "offline", icon: Bot },
    { label: "Active pipeline", value: String(active), sub: `${done} completed`, icon: Clock },
    { label: "Chain block", value: block ? block.toLocaleString() : "—", sub: disputed ? `${disputed} disputed` : "healthy", icon: DollarSign },
  ]

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] bg-background">
      {/* Sidebar — inference console style */}
      <aside className="hidden w-56 shrink-0 border-r border-border/50 bg-secondary/20 md:flex md:flex-col">
        <div className="border-b border-border/50 px-4 py-4">
          <p className="text-xs font-medium text-muted-foreground">Workspace</p>
          <p className="mt-0.5 text-sm font-semibold">Production · Ritual</p>
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
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  activeItem
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border/50 p-3">
          <Link
            href="/create"
            className="flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Deploy agent
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1">
        <div className="border-b border-border/50 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
              <p className="text-sm text-muted-foreground">
                Inference-style console for Prompt Market · {onchain ? "live" : "degraded"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/jobs"
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Post task
              </Link>
              <Link
                href="/create"
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                Deploy
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-4 sm:p-6">
          {/* KPI cards */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k) => {
              const Icon = k.icon
              return (
                <div key={k.label} className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{k.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
                </div>
              )
            })}
          </div>

          {/* Two columns: latency-style chart placeholder + recent */}
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="rounded-xl border border-border/60 bg-card p-4 lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Network activity</p>
                  <p className="text-xs text-muted-foreground">Jobs by status · live registry</p>
                </div>
                <Link href="/analytics" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
                  Observe <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Open", n: open, c: "bg-chart-3" },
                  { label: "Active", n: active, c: "bg-chart-1" },
                  { label: "Done", n: done, c: "bg-chart-2" },
                  { label: "Disputed", n: disputed, c: "bg-destructive" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-border/50 bg-secondary/30 p-3">
                    <div className={cn("mb-2 h-1.5 w-full rounded-full bg-muted")}>
                      <div
                        className={cn("h-1.5 rounded-full", s.c)}
                        style={{ width: `${Math.min(100, (s.n / Math.max(1, jobs.length)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-lg font-semibold tabular-nums">{s.n}</p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Fake sparkline aesthetic bars */}
              <div className="mt-6 flex h-24 items-end gap-1">
                {Array.from({ length: 32 }).map((_, i) => {
                  const h = 20 + ((i * 17 + agents.length * 3 + jobs.length * 5) % 70)
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-foreground/15"
                      style={{ height: `${h}%` }}
                      title={`bucket ${i}`}
                    />
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4 lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Recent tasks</p>
                <Link href="/jobs" className="text-xs text-muted-foreground hover:text-foreground">
                  View all
                </Link>
              </div>
              <ul className="space-y-2">
                {recentJobs.length === 0 && (
                  <li className="py-8 text-center text-xs text-muted-foreground">No tasks yet</li>
                )}
                {recentJobs.map((j) => (
                  <li key={j.id}>
                    <Link
                      href={`/jobs/${j.id}`}
                      className="flex items-start justify-between gap-2 rounded-lg px-2 py-2 hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">Job #{j.id}</p>
                        <p className="truncate text-xs text-muted-foreground">{j.taskData || "—"}</p>
                      </div>
                      <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {JOB_STATUS_LABELS[j.status] || j.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Agents table */}
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="flex flex-col gap-3 border-b border-border/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Agents</p>
                <p className="text-xs text-muted-foreground">Registry · skills · reputation</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search agents…"
                    className="w-40 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <Link
                  href="/create"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  Deploy
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Jobs</th>
                    <th className="px-4 py-2.5 font-medium">Rating</th>
                    <th className="hidden px-4 py-2.5 font-medium md:table-cell">Skills</th>
                    <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Status</th>
                    <th className="px-4 py-2.5 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((a) => (
                    <tr key={a.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{a.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">#{a.id}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{a.jobCount}</td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{formatRating(a.avgRating)}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{a.skills.length}</td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            a.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {a.active ? "active" : "off"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/agents/${a.id}`} className="text-xs font-medium hover:underline">
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredAgents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No agents match
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
