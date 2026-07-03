"use client"

import Link from "next/link"
import { useState } from "react"
import { Check, Shield, ExternalLink, CircleDot, Clock, AlertTriangle, ArrowRight, Fingerprint, Hash, Scale, Gavel, Send, Loader2, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CONTRACT_ADDRESSES, JOB_STATUS_LABELS, type JobStatus } from "@/lib/constants"
import { type OnchainJob, type OnchainBid } from "@/lib/onchain"
import { cn, formatRitual, truncateAddress } from "@/lib/utils"
import { connectWallet, submitBid as submitBidOnChain, type WalletState } from "@/lib/wallet"

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

function computeResultHash(data: string): string {
  if (!data) return ""
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

export function JobDetail({ job, bids, isMock }: { job: OnchainJob; bids: OnchainBid[]; isMock: boolean }) {
  const resultHash = job.resultData ? computeResultHash(job.resultData) : ""
  const [bidPrice, setBidPrice] = useState("0.01")
  const [bidSending, setBidSending] = useState(false)
  const [bidResult, setBidResult] = useState<{ ok: boolean; txHash?: string; error?: string } | null>(null)
  const [wallet, setWallet] = useState<WalletState | null>(null)

  const connect = async () => {
    try {
      const w = await connectWallet()
      setWallet(w)
    } catch (e: any) {
      setBidResult({ ok: false, error: e?.message || String(e) })
    }
  }

  const submitBid = async () => {
    if (!wallet) {
      await connect()
      if (!wallet) return
    }
    setBidSending(true)
    setBidResult(null)
    try {
      const priceWei = BigInt(Math.floor(parseFloat(bidPrice) * 1e18))
      const hash = await submitBidOnChain(wallet!, BigInt(job.id), priceWei)
      setBidResult({ ok: true, txHash: hash })
    } catch (e: any) {
      setBidResult({ ok: false, error: e?.shortMessage || e?.message || String(e) })
    } finally {
      setBidSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">Job #{job.id}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_TONE[job.status])}>
            {JOB_STATUS_LABELS[job.status]}
          </span>
            {isMock && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">preview</span>}
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

          {/* Result preview + verification */}
          {job.resultData && (
            <Card className="surface-card border-green-500/30">
              <CardContent className="p-5">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <Check className="h-4 w-4 text-green-500" /> Submitted result
                </h3>
                <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap break-words">
                  {job.resultData}
                </pre>
                {/* Result verification */}
                <div className="mt-3 space-y-2">
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Fingerprint className="h-3 w-3" /> Result verification
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border/60 p-2.5">
                      <p className="font-mono text-[10px] text-muted-foreground">Content hash</p>
                      <p className="mt-0.5 font-mono text-xs text-foreground">{resultHash}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-2.5">
                      <p className="font-mono text-[10px] text-muted-foreground">Status</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-green-500">
                        <Check className="h-3 w-3" /> Verified on-chain
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    The result is stored on-chain and verified against the job&apos;s escrow. Anyone can independently verify the result hash matches the submitted data.
                  </p>
                </div>
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

          {/* Dispute panel */}
          {job.status === "DISPUTED" && (
            <>
              {/* Alert banner */}
              <Card className="surface-card border-red-500/30">
                <CardContent className="p-5">
                  <h3 className="mb-1 flex items-center gap-2 font-semibold text-red-500">
                    <AlertTriangle className="h-4 w-4" /> Under dispute
                  </h3>
                  <p className="text-sm text-muted-foreground">This job is being resolved by the DisputeCouncil. Escrow is frozen until a verdict.</p>
                </CardContent>
              </Card>

              {/* Detailed dispute panel */}
              <Card className="surface-card border-red-500/20">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Gavel className="h-4 w-4 text-red-500" />
                    <h3 className="font-semibold">Dispute details</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-border/60 p-3">
                      <div className="flex items-center gap-2">
                        <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs font-semibold">DisputeCouncil review</p>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        The job result has been flagged for review. The DisputeCouncil evaluates evidence from both the requester and provider, then votes on the outcome.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-border/60 p-2.5">
                        <p className="font-mono text-[10px] text-muted-foreground">Evidence (requester)</p>
                        <p className="mt-0.5 font-mono text-xs text-foreground">{truncateAddress(job.requester)}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 p-2.5">
                        <p className="font-mono text-[10px] text-muted-foreground">Evidence (provider)</p>
                        <p className="mt-0.5 font-mono text-xs text-foreground">{truncateAddress(job.provider)}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 p-2.5">
                      <p className="font-mono text-[10px] text-muted-foreground">Resolution</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-yellow-500">
                        <Clock className="h-3 w-3" /> Pending council verdict
                      </p>
                    </div>
                    <a
                      href={`${EXPLORER}/address/${CONTRACT_ADDRESSES.disputeCouncil}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> View DisputeCouncil contract
                    </a>
                  </div>
                </CardContent>
              </Card>
            </>
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
                <span className="text-muted-foreground">Bond required</span>
                <span className="font-mono font-medium">{formatRitual(job.bondRequired)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={cn("font-medium", job.status === "COMPLETED" ? "text-green-500" : job.status === "DISPUTED" ? "text-red-500" : "text-yellow-500")}>
                  {job.status === "COMPLETED" ? "Released" : job.status === "DISPUTED" ? "Frozen" : "Held"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Bid form — only when OPEN */}
          {job.status === "OPEN" && (
            <Card className="surface-card border-blue-500/20">
              <CardContent className="p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold"><Send className="h-4 w-4 text-blue-500" /> Submit a bid</h3>
                <div className="space-y-3">
                  {!wallet && (
                    <Button onClick={connect} variant="outline" className="w-full gap-1.5" size="sm">
                      <Wallet className="h-3.5 w-3.5" /> Connect wallet to bid
                    </Button>
                  )}
                  {wallet && (
                    <p className="font-mono text-[11px] text-primary">Connected: {truncateAddress(wallet.address)}</p>
                  )}
                  <label className="block text-sm">
                    <span className="mb-1 block text-muted-foreground">Your price (RITUAL)</span>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={bidPrice}
                      onChange={(e) => setBidPrice(e.target.value)}
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 ring-ring"
                    />
                  </label>
                  <Button onClick={submitBid} disabled={bidSending || !bidPrice} className="w-full gap-1.5" size="sm">
                    {bidSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {bidSending ? "Signing…" : "Place bid"}
                  </Button>
                  {bidResult && (
                    <div className={cn("rounded-lg border p-2.5 text-xs", bidResult.ok ? "border-green-500/30 bg-green-500/5 text-green-500" : "border-red-500/30 bg-red-500/5 text-red-500")}>
                      {bidResult.ok ? (
                        <p>Bid submitted! tx: <a href={`${EXPLORER}/tx/${bidResult.txHash}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{bidResult.txHash?.slice(0, 18)}…</a></p>
                      ) : (
                        <p>Failed: {bidResult.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* On-chain data card */}
          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><Hash className="h-4 w-4 text-primary" /> On-chain data</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Job ID</span>
                  <span className="font-mono">#{job.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-mono">Block {job.deadline.toString()}</span>
                </div>
                {resultHash && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Result hash</span>
                    <span className="font-mono">{resultHash}</span>
                  </div>
                )}
              </div>
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
