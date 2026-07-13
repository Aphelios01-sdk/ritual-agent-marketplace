"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { ExternalLink, Inbox, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CONTRACT_ADDRESSES, JOB_STATUS_LABELS, type JobStatus } from "@/lib/constants"
import { type OnchainJob, type SerializedJob, deserializeJob } from "@/lib/onchain"
import { cn, formatRitual, shortAddress, isZeroAddress } from "@/lib/utils"
import { BlockDeadline } from "@/components/block-deadline"
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

type Tab = "available" | "active" | "done" | "all"

export function JobsBoard({ jobs: initialJobs }: { jobs: OnchainJob[] }) {
  const t = useT()
  const [jobs, setJobs] = useState<OnchainJob[]>(initialJobs)
  const [tab, setTab] = useState<Tab>("available")
  const [live, setLive] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastTs, setLastTs] = useState<number | null>(null)
  const [serverJobs, setServerJobs] = useState(initialJobs)
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
    const open = jobs.filter((j) => j.status === "OPEN").length
    const active = jobs.filter((j) => j.status === "ASSIGNED" || j.status === "IN_PROGRESS").length
    const done = jobs.filter(
      (j) =>
        j.status === "COMPLETED" ||
        j.status === "REFUNDED" ||
        j.status === "CANCELLED" ||
        j.status === "DISPUTED",
    ).length
    return { open, active, done, total: jobs.length }
  }, [jobs])

  const visible = useMemo(() => {
    switch (tab) {
      case "available":
        return jobs.filter((j) => j.status === "OPEN")
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
  }, [jobs, tab])

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: "available", label: t.jobs.available, n: counts.open },
    { id: "active", label: t.jobs.active, n: counts.active },
    { id: "done", label: t.jobs.done, n: counts.done },
    { id: "all", label: t.jobs.all, n: counts.total },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <McpPostJobForm />
        <McpActionPanel surface="jobs" compact title={t.mcp.jobTools} />
      </div>

      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  tab === t.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {t.label} <span className="tabular-nums opacity-70">{t.n}</span>
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
          <Card className="border-dashed border border-border shadow-none">
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
            {visible.map((job) => (
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
                      STATUS_COLOR[job.status],
                    )}
                  >
                    {JOB_STATUS_LABELS[job.status]}
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
                  {job.deadline > BigInt(0) && <BlockDeadline deadline={job.deadline} />}
                </div>
              </Link>
            ))}
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
