"use client"

import { useState } from "react"
import { useAccount, useWriteContract } from "wagmi"
import { type Address, toHex, parseEther } from "viem"
import Link from "next/link"
import {
  Loader2,
  Check,
  Gavel,
  Send,
  Star,
  Shield,
  ExternalLink,
  CircleDot,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { JOB_MARKET_V2_ABI } from "@/lib/contract-abi-v2"
import { CONTRACT_ADDRESSES, JOB_STATUS_LABELS, type JobStatus } from "@/lib/constants"
import { type OnchainJob, type OnchainBid } from "@/lib/onchain"
import { cn, formatRitual, truncateAddress } from "@/lib/utils"

const JOB_MARKET_V2 = CONTRACT_ADDRESSES.jobMarketV2 as Address
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

// Timeline steps derived from status.
function timeline(status: JobStatus) {
  const steps = ["Posted", "Assigned", "In progress", "Result submitted", "Completed"]
  const idx = { OPEN: 0, ASSIGNED: 1, IN_PROGRESS: 2, COMPLETED: 4, DISPUTED: 3, REFUNDED: 0, CANCELLED: 0 }[status] ?? 0
  return steps.map((label, i) => ({ label, done: i < idx, current: i === idx }))
}

export function JobDetail({ job, bids, isMock }: { job: OnchainJob; bids: OnchainBid[]; isMock: boolean }) {
  const { address, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [result, setResult] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  async function run(label: string, fn: () => Promise<`0x${string}`>) {
    setError(null)
    setOk(null)
    setBusy(true)
    try {
      await fn()
      setOk(`${label} transaction sent. Refresh in a moment to see updated state.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : `${label} failed`)
    } finally {
      setBusy(false)
    }
  }

  const isRequester = !!address && address.toLowerCase() === job.requester.toLowerCase()
  const isProvider = !!address && job.provider !== "0x0000000000000000000000000000000000000000" && address.toLowerCase() === job.provider.toLowerCase()

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
                <a href={`${EXPLORER}/address/${JOB_MARKET_V2}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
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
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-primary">{formatRitual(b.price)}</span>
                        {isRequester && job.status === "OPEN" && (
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => run("Assign", () => writeContractAsync({ address: JOB_MARKET_V2, abi: JOB_MARKET_V2_ABI, functionName: "assignJob", args: [BigInt(job.id), BigInt(i)], value: parseEther("0") }))} className="h-7 px-2 text-xs">
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Assign"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
              <h3 className="mb-3 font-semibold">Timeline</h3>
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

          {/* Actions */}
          {isConnected && (
            <Card className="surface-card border-border/60">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold">Actions</h3>

                {/* Provider: submit result */}
                {isProvider && (job.status === "ASSIGNED" || job.status === "IN_PROGRESS") && (
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Submit result (provider)</label>
                    <textarea value={result} onChange={(e) => setResult(e.target.value)} rows={3} placeholder="Result data / prompt output" className="mb-2 w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-xs outline-none ring-ring focus-visible:ring-2" />
                    <Button size="sm" disabled={busy || !result} onClick={() => run("Submit result", () => writeContractAsync({ address: JOB_MARKET_V2, abi: JOB_MARKET_V2_ABI, functionName: "submitResult", args: [BigInt(job.id), toHex(result)] }))} className="w-full gap-1.5">
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Submit result
                    </Button>
                  </div>
                )}

                {/* Requester: rate provider */}
                {isRequester && job.status === "COMPLETED" && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Rate provider</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <Button key={r} size="sm" variant="outline" disabled={busy} onClick={() => run("Rate", () => writeContractAsync({ address: JOB_MARKET_V2, abi: JOB_MARKET_V2_ABI, functionName: "rateProvider", args: [BigInt(job.id), BigInt(r)] }))} className="h-7 w-7 p-0">
                          <Star className="h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requester/Provider: dispute */}
                {(isRequester || isProvider) && (job.status === "COMPLETED" || job.status === "ASSIGNED" || job.status === "IN_PROGRESS") && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => run("Dispute", () => writeContractAsync({ address: JOB_MARKET_V2, abi: JOB_MARKET_V2_ABI, functionName: "dispute", args: [BigInt(job.id)] }))} className="w-full gap-1.5 border-red-500/30 text-red-500 hover:bg-red-500/10">
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />} Open dispute
                  </Button>
                )}

                {!isProvider && !isRequester && (
                  <p className="text-xs text-muted-foreground">Connect as this job&apos;s requester or provider to act on it.</p>
                )}
              </CardContent>
            </Card>
          )}

          <p className="text-center text-xs text-muted-foreground">
            <Link href="/jobs" className="text-primary hover:underline">← All jobs</Link>
          </p>
        </aside>
      </div>

      {(error || ok) && (
        <Card className={cn("border-border/60", error ? "border-red-500/40 bg-red-500/5" : "border-green-500/40 bg-green-500/5")}>
          <CardContent className="p-4 text-sm">
            {error ? <span className="text-red-500"><b>Error:</b> {error}</span> : <span className="text-green-500"><Gavel className="mr-1 inline h-3.5 w-3.5" />{ok}</span>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
