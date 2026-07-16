"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { ExternalLink, Inbox, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CONTRACT_ADDRESSES, type JobStatus } from "@/lib/constants"
import { type OnchainJob, type SerializedJob, deserializeJob, displayJobStatus, isJobExpired } from "@/lib/onchain"
import { cn, formatRitual, shortAddress, isZeroAddress } from "@/lib/utils"
import { BlockDeadline } from "@/components/block-deadline"
import { useLiveBlock } from "@/hooks/use-live-block"
import { McpPostJobForm } from "@/components/mcp-post-job-form"
import { McpActionPanel } from "@/components/mcp-action-panel"
import { useT } from "@/lib/i18n/context"

const EXPLORER = "https://explorer.ritualfoundation.org"
const POLL_MS = 4_000

const STATUS_COLOR: Record<JobStatus, string> = {
  OPEN: "bg-yellow-500/10 text-yellow-500",
  ASSIGNED: "bg-blue-500/10 text-blue-500",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500",
  COMPLETED: "bg-green-500/10 text-green-500",
  DISPUTED: "bg-red-500/10 text-red-500",
  REFUNDED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
}

const EXPIRED_TONE = "bg-red-500/10 text-red-400"

type Tab = "available" | "active" | "done" | "all"

export function JobsBoard({ jobs: initialJobs }: { jobs: OnchainJob[] }) {
  const t = useT()
  const [jobs, setJobs] = useState<OnchainJob[]>(initialJobs)
  const [tab, setTab] = useState<Tab>("available")
  const [live, setLive] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastTs, setLastTs] = useState<number | null>(null)
  const [serverJobs, setServerJobs] = useState(initialJobs)
  const chainHead = useLiveBlock(0, 4_000)
  const head = chainHead.block > 0 ? BigInt(chainHead.block) : BigInt(0)
  if (serverJobs !== initialJobs) {
    setServerJobs(initialJobs)
    setJobs(initialJobs)
  }

  const refresh = useCallback(async (manual = false) => {
    try {
      const res = await fetch("/api/jobs", { cache: "no-store" })
      if (!res.ok) return
      const data = (await res.json()) as { jobs: SerializedJob[]; ts?: number }
      setJobs(data.jobs.map(deserializeJob))
      setLastTs(data.ts ?? Date.now())
      setLive(true)
    } catch {
      setLive(false)
    } finally {
      if (manual) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    refresh(false)
    const t = setInterval(() => refresh(false), POLL_MS)
    return () => clearInterval(t)
  }, [refresh])

  const counts = useMemo(() => {
    const open = jobs.filter((j) => j.status === "OPEN" && !isJobExpired(j, head)).length
    const expired = jobs.filter((j) => j.status === "OPEN" && isJobExpired(j, head)).length
    const active = jobs.filter((j) => j.status === "ASSIGNED" || j.status === "IN_PROGRESS").length
    const done = jobs.filter(
      (j) =>
        j.status === "COMPLETED" ||
        j.status === "REFUNDED" ||
        j.status === "CANCELLED" ||
        j.status === "DISPUTED",
    ).length
    return { open, expired, active, done, total: jobs.length }
  }, [jobs, head])

  const visible = useMemo(() => {
    switch (tab) {
      case "available":
        return jobs.filter((j) => j.status === "OPEN" && !isJobExpired(j, head))
      case "active":
        return jobs.filter((j) => j.status === "ASSIGNED" || j.status === "IN_PROGRESS")
      case "done":
        return jobs.filter(
          (j) =>
            j.status === "COMPLETED" ||
            j.status === "REFUNDED" ||
            j.status === "CANCELLED" ||
            j.status === "DISPUTED",
        )
      default:
        return jobs
    }
  }, [jobs, tab, head])

  const expiredOpen = useMemo(
    () => (tab === "available" ? jobs.filter((j) => j.status === "OPEN" && isJobExpired(j, head)) : []),
    [jobs, tab, head],
  )

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: "available", label: t.jobs.available, n: counts.open },
    { id: "active", label: t.jobs.active, n: counts.active },
    { id: "done", label: t.jobs.done, n: counts.done },
    { id: "all", label: t.jobs.all, n: counts.total },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* On mobile: board first, form second */}
      <div className="order-2 space-y-4 lg:order-1 lg:sticky lg:top-20 lg:self-start">
        <McpPostJobForm />
        <McpActionPanel surface="jobs" compact title={t.mcp.jobTools} />
      </div>

      <div className="order-1 min-w-0 lg:order-2">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
            {tabs.map((tabItem) => (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => setTab(tabItem.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === tabItem.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {tabItem.label}{" "}
                <span className="tabular-nums opacity-70">{tabItem.n}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className={cn("inline-flex items-center gap-1", live ? "text-primary" : "text-muted-foreground")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-primary" : "bg-muted-foreground")} />
              {live ? t.common.live : t.common.offline}
            </span>
            {lastTs && (
              <span className="hidden sm:inline">{new Date(lastTs).toLocaleTimeString()}</span>
            )}
            <button
              type="button"
              onClick={() => {
                setRefreshing(true)
                refresh(true)
              }}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 hover:bg-muted"
            >
              <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
              {t.common.refresh}
            </button>
          </div>
        </div>

        {counts.total === 0 ? (
          <Card className="border-dashed border-border shadow-none">
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">{t.jobs.empty}</p>
              <p className="max-w-sm text-xs text-muted-foreground">{t.jobs.emptyHint}</p>
            </CardContent>
          </Card>
        ) : visible.length === 0 ? (
          <Card className="border border-border shadow-none">
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              {t.jobs.emptyTab}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {visible.map((job) => {
              const display = displayJobStatus(job, head)
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-lg border border-border p-4 transition-colors hover:bg-card-hover"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">#{job.id}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        display.expired ? EXPIRED_TONE : STATUS_COLOR[job.status],
                      )}
                    >
                      {display.label}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm">{job.taskData || "·"}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span className="tabular-nums">
                      {formatRitual(job.reward)} {t.jobs.reward.toLowerCase()}
                    </span>
                    <span className="font-mono" title={job.requester}>
                      req {shortAddress(job.requester)}
                    </span>
                    {!isZeroAddress(job.provider) && (
                      <span className="font-mono" title={job.provider}>
                        prov {shortAddress(job.provider)}
                      </span>
                    )}
                    {job.deadline > BigInt(0) && <BlockDeadline deadline={job.deadline} initialBlock={chainHead.block} />}
                  </div>
                </Link>
              )
            })}
            {expiredOpen.length > 0 && (
              <div className="pt-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Expired ({expiredOpen.length})
                </p>
                <div className="space-y-2 opacity-80">
                  {expiredOpen.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block rounded-lg border border-dashed border-border/80 p-4 transition-colors hover:bg-card-hover"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs text-muted-foreground">#{job.id}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", EXPIRED_TONE)}>
                          Expired
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{job.taskData || "·"}</p>
                      {job.deadline > BigInt(0) && (
                        <div className="mt-3 text-[11px] text-muted-foreground">
                          <BlockDeadline deadline={job.deadline} initialBlock={chainHead.block} />
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-4 text-[11px] text-muted-foreground">
          {t.common.market}{" "}
          <a
            href={`${EXPLORER}/address/${CONTRACT_ADDRESSES.jobMarketV2}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 hover:underline"
          >
            {shortAddress(CONTRACT_ADDRESSES.jobMarketV2)} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </p>
      </div>
    </div>
  )
}
