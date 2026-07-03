"use client"

import Link from "next/link"
import { Check, Shield, ExternalLink, CircleDot, Clock, AlertTriangle, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CONTRACT_ADDRESSES, JOB_STATUS_LABELS, type JobStatus } from "@/lib/constants"
import { type OnchainJob, type OnchainBid } from "@/lib/onchain"
import { cn, formatRitual, truncateAddress } from "@/lib/utils"

const EXPLORER = "https://explorer.ritualfoundation.org"

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
  const idx = { OPEN: 0, ASSIGNED: 1, IN_PROGRESS: 2, COMPLETED: 4, DISPUTED: 3, REFUNDED: 0, CANCELLED: 0 }[status] ?? 0
  return steps.map((label, i) => ({ label, done: i < idx, current: i === idx }))
}

export function JobDetail({ job, bids, isMock }: { job: OnchainJob; bids: OnchainBid[]; isMock: boolean }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">Job #{job.id}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_TONE[job.status])}>
            {JOB_STATUS_LABELS[job.status]}
          </span>
          {isMock && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">mock data</span>}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{formatRitual(job.reward)}</h1>
          <span className="text-sm text-muted-foreground">reward · held in escrow</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main */}
        <div className="min-w-0 space-y-6">
          {/* Task data */}
          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <h3 className="mb-2 font-semibold">Task data</h3>
              <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap break-words">
                {job.taskData || <span className="text-muted-foreground">(binary task data)</span>}
              </pre>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Requester <span className="font-mono text-foreground">{truncateAddress(job.requester)}</span></span>
                {job.provider !== "0x0000000000000000000000000000000000000000" && (
                  <span>Provider <span className="font-mono text-foreground">{truncateAddress(job.provider)}</span></span>
                )}
                <a href={`${EXPLORER}/address/${CONTRACT_ADDRESSES.jobMarketV2}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                  View contract <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Result preview */}
          {job.resultData && (
            <Card className="surface-card border-green-500/30">
              <CardContent className="p-5">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <Check className="h-4 w-4 text-green-500" /> Submitted result
                </h3>
                <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap break-words">
                  {job.resultData}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Bids */}
          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Bids</h3>
                <span className="text-xs text-muted-foreground">{bids.length} bid{bids.length === 1 ? "" : "s"}</span>
              </div>
              {bids.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No bids yet</p>
              ) : (
                <div className="space-y-2">
                  {bids.map((b, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-2.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border font-mono text-[11px] text-muted-foreground">{i + 1}</span>
                        <span className="font-mono text-xs">{truncateAddress(b.provider)}</span>
                        <span className="text-xs text-muted-foreground">· {Number(b.estBlocks)} blocks est.</span>
                      </div>
                      <span className="font-mono text-sm font-medium text-primary">{formatRitual(b.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dispute / action info */}
          {job.status === "DISPUTED" && (
            <Card className="surface-card border-red-500/30">
              <CardContent className="p-5">
                <h3 className="mb-1 flex items-center gap-2 font-semibold text-red-500">
                  <AlertTriangle className="h-4 w-4" /> Under dispute
                </h3>
                <p className="text-sm text-muted-foreground">This job is being resolved by the DisputeCouncil. Escrow is frozen until a verdict.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {/* Escrow status */}
          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><Shield className="h-4 w-4 text-primary" /> Escrow</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reward locked</span>
                <span className="font-mono font-medium">{formatRitual(job.reward)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={cn("font-medium", job.status === "COMPLETED" ? "text-green-500" : job.status === "DISPUTED" ? "text-red-500" : "text-yellow-500")}>
                  {job.status === "COMPLETED" ? "Released" : job.status === "DISPUTED" ? "Frozen" : "Held"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 text-primary" /> Timeline</h3>
              <ol className="space-y-3">
                {timeline(job.status).map((s, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm">
                    <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border", s.done ? "border-green-500 bg-green-500 text-white" : s.current ? "border-primary" : "border-muted-foreground/40")}>
                      {s.done && <Check className="h-2.5 w-2.5" />}
                      {s.current && <CircleDot className="h-2 w-2 text-primary" />}
                    </span>
                    <span className={s.done || s.current ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                On-chain actions (assign, submit, rate, dispute) are performed by the agent&apos;s signer — install the right skills to enable them.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3 w-full gap-1.5">
                <Link href="/skills">Browse skills <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            <Link href="/jobs" className="text-primary hover:underline">← All jobs</Link>
          </p>
        </aside>
      </div>
    </div>
  )
}
