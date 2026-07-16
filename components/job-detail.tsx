"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Check,
  ExternalLink,
  Fingerprint,
  RefreshCw,
  FlaskConical,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CONTRACT_ADDRESSES, JOB_STATUS_LABELS, type JobStatus } from "@/lib/constants"
import { type OnchainJob, type OnchainBid, deserializeJob, type SerializedJob } from "@/lib/onchain"
import {
  cn, formatRitual, shortAddress, isZeroAddress,
  explorerAddressUrl, explorerTxUrl, isTestEntity,
} from "@/lib/utils"
import { BlockDeadline } from "@/components/block-deadline"
import { McpActionPanel } from "@/components/mcp-action-panel"
import { useT } from "@/lib/i18n/context"

const POLL_MS = 4_000

const STATUS_TONE: Record<JobStatus, string> = {
  OPEN: "bg-yellow-500/10 text-yellow-500",
  ASSIGNED: "bg-blue-500/10 text-blue-500",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500",
  COMPLETED: "bg-green-500/10 text-green-500",
  DISPUTED: "bg-red-500/10 text-red-500",
  REFUNDED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
}

function timeline(status: JobStatus) {
  const steps = ["Posted", "Assigned", "In progress", "Result submitted", "Completed"]
  const idx =
    { OPEN: 0, ASSIGNED: 1, IN_PROGRESS: 2, COMPLETED: 4, DISPUTED: 3, REFUNDED: 0, CANCELLED: 0 }[
      status
    ] ?? 0
  return steps.map((label, i) => ({ label, done: i < idx, current: i === idx }))
}

function computeResultHash(data: string): string {
  if (!data) return ""
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i)
    hash |= 0
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

type BidView = {
  provider: `0x${string}`
  price: bigint
  estBlocks: bigint
  submittedAt: bigint
}

/** Read-only job view + MCP tools for all writes. */
export function JobDetail({
  job: initialJob,
  bids: initialBids,
}: {
  job: OnchainJob
  bids: OnchainBid[]
  isMock?: boolean
}) {
  const t = useT()
  const [job, setJob] = useState(initialJob)
  const [bids, setBids] = useState<BidView[]>(initialBids)
  const [prevJob, setPrevJob] = useState(initialJob)
  const [prevBids, setPrevBids] = useState(initialBids)
  if (prevJob !== initialJob || prevBids !== initialBids) {
    setPrevJob(initialJob)
    setPrevBids(initialBids)
    setJob(initialJob)
    setBids(initialBids)
  }

  const resultHash = job.resultData ? computeResultHash(job.resultData) : ""
  const hasProvider = !isZeroAddress(job.provider)
  const steps = timeline(job.status)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs?id=${job.id}`, { cache: "no-store" })
      if (!res.ok) return
      const data = (await res.json()) as {
        job: SerializedJob
        bids: { provider: string; price: string; estBlocks: string; submittedAt: string }[]
      }
      setJob(deserializeJob(data.job))
      setBids(
        data.bids.map((b) => ({
          provider: b.provider as `0x${string}`,
          price: BigInt(b.price),
          estBlocks: BigInt(b.estBlocks),
          submittedAt: BigInt(b.submittedAt),
        })),
      )
    } catch {
      /* ignore */
    }
  }, [job.id])

  useEffect(() => {
    const t = setInterval(refresh, POLL_MS)
    return () => clearInterval(t)
  }, [refresh])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <Card className="border border-border shadow-none">
          <CardContent className="p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">Job #{job.id}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_TONE[job.status])}>
                {JOB_STATUS_LABELS[job.status]}
              </span>
              {isTestEntity(job.taskData, job.requester) && (
                <span className="inline-flex items-center gap-0.5 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-amber-500">
                  <FlaskConical className="h-3 w-3" /> {t.common.test}
                </span>
              )}
              <button
                type="button"
                onClick={() => refresh()}
                className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted foreground hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3" /> {t.common.refresh}
              </button>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">{t.jobs.task}</h1>
            <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
              {job.taskData || "·"}
            </pre>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">{t.jobs.reward}</p>
                <p className="font-mono tabular-nums">{formatRitual(job.reward)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">{t.jobs.bond}</p>
                <p className="font-mono tabular-nums">{formatRitual(job.bondRequired)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">{t.jobs.requester}</p>
                <p className="flex items-center gap-1 font-mono text-xs" title={job.requester}>
                  {shortAddress(job.requester)}
                  <a
                    href={explorerAddressUrl(job.requester)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground/60 hover:text-foreground"
                    title="View requester on explorer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">{t.jobs.provider}</p>
                <p className="flex items-center gap-1 font-mono text-xs" title={job.provider}>
                  {hasProvider ? shortAddress(job.provider) : t.jobs.unassigned}
                  {hasProvider && (
                    <a
                      href={explorerAddressUrl(job.provider)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground/60 hover:text-foreground"
                      title="View provider on explorer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </p>
              </div>
            </div>
            {job.deadline > BigInt(0) && (
              <div className="mt-3 text-xs text-muted-foreground">
                Deadline <BlockDeadline deadline={job.deadline} />
              </div>
            )}
            <a
              href={explorerAddressUrl(CONTRACT_ADDRESSES.jobMarketV2)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:underline"
            >
              Market contract <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-none">
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-semibold">{t.jobs.lifecycle}</h3>
            <ol className="flex flex-wrap gap-2">
              {steps.map((s) => (
                <li
                  key={s.label}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-[11px]",
                    s.done && "border border-border text-foreground",
                    s.current && "border-foreground bg-muted",
                    !s.done && !s.current && "border border-border text-muted-foreground",
                  )}
                >
                  {s.label}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-none">
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-semibold">
              {t.jobs.bids} ({bids.length})
            </h3>
            {bids.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.jobs.noBids}</p>
            ) : (
              <ul className="space-y-2">
                {bids.map((b, i) => (
                  <li
                    key={`${b.provider}-${i}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-1 font-mono text-xs">
                      #{i} {shortAddress(b.provider)}
                      <a
                        href={explorerAddressUrl(b.provider)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground/60 hover:text-foreground"
                        title="View bidder on explorer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </span>
                    <span className="tabular-nums">{formatRitual(b.price)}</span>
                    <span className="text-xs text-muted-foreground">{String(b.estBlocks)} blocks</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {job.resultData && (
          <Card className="border border-border shadow-none">
            <CardContent className="p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Check className="h-4 w-4" /> {t.jobs.result}
              </h3>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-border p-3 text-xs">
                {job.resultData}
              </pre>
              <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                <Fingerprint className="h-3 w-3" /> hash {resultHash}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <McpActionPanel
          surface="job-detail"
          jobId={job.id}
          title={`${t.jobs.jobActions} #${job.id}`}
          description={t.jobs.jobActionsBody}
        />
      </div>
    </div>
  )
}
