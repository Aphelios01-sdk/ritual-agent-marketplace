"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  Check,
  Shield,
  ExternalLink,
  CircleDot,
  Clock,
  AlertTriangle,
  ArrowRight,
  Fingerprint,
  Hash,
  Scale,
  Gavel,
  Send,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CONTRACT_ADDRESSES, JOB_STATUS_LABELS, type JobStatus } from "@/lib/constants"
import { type OnchainJob, type OnchainBid, deserializeJob, type SerializedJob } from "@/lib/onchain"
import { cn, formatRitual, shortAddress, isZeroAddress, toWei } from "@/lib/utils"
import { BlockDeadline, BlocksDuration } from "@/components/block-deadline"
import {
  getAgentWallet,
  submitBid as submitBidOnChain,
  assignJob as assignJobOnChain,
  startProcessing,
  submitResult,
  rateProvider,
  disputeJob,
  claimTimeout,
} from "@/lib/agent-wallet"

const EXPLORER = "https://explorer.ritualfoundation.org"
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
    const char = data.charCodeAt(i)
    hash = (hash << 5) - hash + char
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

export function JobDetail({
  job: initialJob,
  bids: initialBids,
  isMock,
}: {
  job: OnchainJob
  bids: OnchainBid[]
  isMock: boolean
}) {
  const router = useRouter()
  const [job, setJob] = useState(initialJob)
  const [bids, setBids] = useState<BidView[]>(initialBids)
  const [walletAddr, setWalletAddr] = useState<string | null>(null)

  // Reset local copy when server props change (navigation between jobs) via
  // render-time adjustment instead of setState-in-effect.
  const [prevJob, setPrevJob] = useState(initialJob)
  const [prevBids, setPrevBids] = useState(initialBids)
  if (prevJob !== initialJob || prevBids !== initialBids) {
    setPrevJob(initialJob)
    setPrevBids(initialBids)
    setJob(initialJob)
    setBids(initialBids)
  }

  // Bid form
  const defaultPrice = (() => {
    try {
      const eth = Number(initialJob.reward) / 1e18
      return eth > 0 ? (eth * 0.9).toFixed(4).replace(/\.?0+$/, "") : "0.01"
    } catch {
      return "0.01"
    }
  })()
  const [bidPrice, setBidPrice] = useState(defaultPrice)
  const [estBlocks, setEstBlocks] = useState("100")
  const [bidSending, setBidSending] = useState(false)
  const [bidResult, setBidResult] = useState<{ ok: boolean; txHash?: string; error?: string } | null>(
    null,
  )

  // Accept bid (requester review)
  const [accepting, setAccepting] = useState<number | null>(null)
  const [acceptResult, setAcceptResult] = useState<{
    ok: boolean
    txHash?: string
    error?: string
  } | null>(null)

  const [actionBusy, setActionBusy] = useState(false)
  const [actionMsg, setActionMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [resultDraft, setResultDraft] = useState("")
  const [rateVal, setRateVal] = useState(5)

  const resultHash = job.resultData ? computeResultHash(job.resultData) : ""
  const hasProvider = !isZeroAddress(job.provider)
  const isRequester =
    walletAddr != null && walletAddr.toLowerCase() === job.requester.toLowerCase()
  const isProvider =
    walletAddr != null && hasProvider && walletAddr.toLowerCase() === job.provider.toLowerCase()
  /** Resolve / rate / dispute / claim only when a real provider is assigned */
  const canResolve = hasProvider && job.status !== "OPEN"
  const maxRewardEth = Number(job.reward) / 1e18

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only hydration from browser localStorage; deferred to avoid hydration mismatch.
      setWalletAddr(getAgentWallet().address)
    } catch {
      /* SSR */
    }
  }, [])

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
      /* ignore poll errors */
    }
  }, [job.id])

  useEffect(() => {
    const t = setInterval(refresh, POLL_MS)
    return () => clearInterval(t)
  }, [refresh])

  const submitBid = async () => {
    setBidSending(true)
    setBidResult(null)
    try {
      const price = parseFloat(bidPrice)
      if (!Number.isFinite(price) || price <= 0) throw new Error("Enter a valid bid price in RITUAL")
      if (price > maxRewardEth * 2) {
        throw new Error("Bid is far above max reward. Requester may need a large top-up.")
      }
      const blocks = BigInt(Math.max(1, parseInt(estBlocks, 10) || 100))
      const wallet = getAgentWallet()
      const priceWei = toWei(bidPrice)
      const hash = await submitBidOnChain(wallet, BigInt(job.id), priceWei, blocks)
      setBidResult({ ok: true, txHash: hash })
      setTimeout(refresh, 1500)
      setTimeout(refresh, 4000)
      router.refresh()
    } catch (e: unknown) {
      const err = e as { shortMessage?: string; message?: string }
      setBidResult({ ok: false, error: err?.shortMessage || err?.message || String(e) })
    } finally {
      setBidSending(false)
    }
  }

  const acceptBid = async (bidIndex: number) => {
    setAccepting(bidIndex)
    setAcceptResult(null)
    try {
      const wallet = getAgentWallet()
      if (wallet.address.toLowerCase() !== job.requester.toLowerCase()) {
        throw new Error("Only the job requester can accept a bid. Import the requester wallet.")
      }
      const bid = bids[bidIndex]
      const topUp =
        bid.price > job.reward ? bid.price - job.reward : BigInt(0)
      const hash = await assignJobOnChain(wallet, BigInt(job.id), BigInt(bidIndex), topUp)
      setAcceptResult({ ok: true, txHash: hash })
      setTimeout(refresh, 1500)
      setTimeout(refresh, 4000)
      router.refresh()
    } catch (e: unknown) {
      const err = e as { shortMessage?: string; message?: string }
      setAcceptResult({ ok: false, error: err?.shortMessage || err?.message || String(e) })
    } finally {
      setAccepting(null)
    }
  }

  const runAction = async (label: string, fn: () => Promise<`0x${string}`>) => {
    setActionBusy(true)
    setActionMsg(null)
    try {
      const hash = await fn()
      setActionMsg({ ok: true, text: `${label}: ${hash}` })
      setTimeout(refresh, 1500)
      setTimeout(refresh, 4000)
      router.refresh()
    } catch (e: unknown) {
      const err = e as { shortMessage?: string; message?: string }
      setActionMsg({ ok: false, text: err?.shortMessage || err?.message || String(e) })
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">Job #{job.id}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_TONE[job.status])}>
            {JOB_STATUS_LABELS[job.status]}
          </span>
          {isMock && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              preview
            </span>
          )}
          <button
            type="button"
            onClick={() => refresh()}
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/40"
          >
            <RefreshCw className="h-3 w-3" /> Live refresh
          </button>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{formatRitual(job.reward)}</h1>
          <span className="text-sm text-muted-foreground">max reward in escrow</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <h3 className="mb-2 font-semibold">Task data</h3>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">
                {job.taskData || <span className="text-muted-foreground">(binary task data)</span>}
              </pre>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Requester{" "}
                  <span className="font-mono text-foreground" title={job.requester}>
                    {shortAddress(job.requester)}
                  </span>
                </span>
                <span>
                  Provider{" "}
                  <span
                    className={cn(
                      "font-mono",
                      hasProvider ? "text-foreground" : "text-muted-foreground",
                    )}
                    title={hasProvider ? job.provider : "No provider until a bid is accepted"}
                  >
                    {hasProvider ? shortAddress(job.provider) : "unassigned"}
                  </span>
                </span>
                {!hasProvider && job.status === "OPEN" && (
                  <span className="rounded-full border border-border/50 px-2 py-0.5 text-[10px]">
                    resolve locked until provider set
                  </span>
                )}
                <a
                  href={`${EXPLORER}/address/${CONTRACT_ADDRESSES.jobMarketV2}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline"
                >
                  View contract <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Provider / requester actions */}
          {(isProvider || isRequester) && (
            <Card className="surface-card border-[#00ff99]/20">
              <CardContent className="space-y-3 p-5">
                <h3 className="font-semibold">On-chain actions</h3>
                {!canResolve && isRequester && job.status === "OPEN" && (
                  <p className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                    Provider is unassigned (0x000…0). Accept a bid first — rate, dispute, and
                    timeout resolve stay disabled until a provider is set.
                  </p>
                )}
                {isProvider && canResolve && (job.status === "ASSIGNED" || job.status === "IN_PROGRESS") && (
                  <div className="flex flex-wrap gap-2">
                    {job.status === "ASSIGNED" && (
                      <Button
                        size="sm"
                        className="rounded-full"
                        disabled={actionBusy}
                        onClick={() =>
                          runAction("startProcessing", () =>
                            startProcessing(
                              getAgentWallet(),
                              BigInt(job.id),
                              job.bondRequired || BigInt(0),
                            ),
                          )
                        }
                      >
                        Start processing
                      </Button>
                    )}
                    <input
                      value={resultDraft}
                      onChange={(e) => setResultDraft(e.target.value)}
                      placeholder="Result payload…"
                      className="h-8 min-w-[160px] flex-1 rounded-full border border-border/60 bg-background px-3 text-xs"
                    />
                    <Button
                      size="sm"
                      className="rounded-full bg-[#00ff99] text-black hover:bg-[#00ff99]/90"
                      disabled={actionBusy || !resultDraft.trim()}
                      onClick={() =>
                        runAction("submitResult", () =>
                          submitResult(getAgentWallet(), BigInt(job.id), resultDraft),
                        )
                      }
                    >
                      Submit result
                    </Button>
                  </div>
                )}
                {isRequester && canResolve && job.status === "COMPLETED" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={rateVal}
                      onChange={(e) => setRateVal(Number(e.target.value))}
                      className="h-8 rounded-full border border-border/60 bg-background px-2 text-xs"
                    >
                      {[5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r}>
                          Rate {r}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={actionBusy || !hasProvider}
                      onClick={() =>
                        runAction("rateProvider", () =>
                          rateProvider(getAgentWallet(), BigInt(job.id), BigInt(rateVal)),
                        )
                      }
                    >
                      Rate provider
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-red-400"
                      disabled={actionBusy || !hasProvider}
                      title={!hasProvider ? "Provider not assigned" : undefined}
                      onClick={() =>
                        runAction("dispute", () => disputeJob(getAgentWallet(), BigInt(job.id)))
                      }
                    >
                      Dispute
                    </Button>
                  </div>
                )}
                {isRequester && canResolve && (job.status === "ASSIGNED" || job.status === "IN_PROGRESS") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={actionBusy || !hasProvider}
                    title={!hasProvider ? "Provider not assigned" : undefined}
                    onClick={() =>
                      runAction("claimTimeout", () =>
                        claimTimeout(getAgentWallet(), BigInt(job.id)),
                      )
                    }
                  >
                    Claim timeout
                  </Button>
                )}
                {/* Explicitly disabled resolve controls when no provider */}
                {isRequester && !canResolve && (
                  <div className="flex flex-wrap gap-2 opacity-50">
                    <Button size="sm" className="rounded-full" disabled>
                      Rate provider
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full" disabled>
                      Dispute / resolve
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full" disabled>
                      Claim timeout
                    </Button>
                  </div>
                )}
                {actionMsg && (
                  <p
                    className={cn(
                      "break-all font-mono text-[11px]",
                      actionMsg.ok ? "text-[#00ff99]" : "text-red-400",
                    )}
                  >
                    {actionMsg.text}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {job.resultData && (
            <Card className="surface-card border-green-500/30">
              <CardContent className="p-5">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <Check className="h-4 w-4 text-green-500" /> Submitted result
                </h3>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">
                  {job.resultData}
                </pre>
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bids + review / accept */}
          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {job.status === "OPEN" ? "Review bids" : "Bids"}
                  </h3>
                  {job.status === "OPEN" && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Compare price and estimate to your task. Accept the bid that matches your
                      request.
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {bids.length} bid{bids.length === 1 ? "" : "s"}
                </span>
              </div>

              {bids.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No bids yet</p>
              ) : (
                <div className="space-y-2">
                  {bids.map((b, i) => {
                    const priceEth = Number(b.price) / 1e18
                    const vsMax =
                      maxRewardEth > 0 ? ((priceEth / maxRewardEth) * 100).toFixed(0) : "—"
                    const premium = b.price > job.reward
                    return (
                      <div
                        key={`${b.provider}-${i}`}
                        className="rounded-xl border border-border/60 p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border font-mono text-[11px] text-muted-foreground">
                                {i + 1}
                              </span>
                              <span className="font-mono text-xs">{shortAddress(b.provider)}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 pl-8 text-[11px] text-muted-foreground">
                              <span>
                                Est. <BlocksDuration blocks={b.estBlocks} className="text-foreground" />
                              </span>
                              <span>
                                vs max reward{" "}
                                <span className={cn(premium ? "text-yellow-500" : "text-green-500")}>
                                  {vsMax}%
                                </span>
                                {premium && " (top-up needed)"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="font-mono text-sm font-medium text-primary">
                              {formatRitual(b.price)}
                            </span>
                            {job.status === "OPEN" && (
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                disabled={accepting !== null}
                                onClick={() => acceptBid(i)}
                              >
                                {accepting === i ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Accept bid
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {job.status === "OPEN" && bids.length > 0 && !isRequester && walletAddr && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Accept requires the requester wallet (
                  <span className="font-mono">{shortAddress(job.requester)}</span>
                  ). Your agent is{" "}
                  <span className="font-mono">{shortAddress(walletAddr)}</span>.
                </p>
              )}

              {acceptResult && (
                <div
                  className={cn(
                    "mt-3 rounded-lg border p-2.5 text-xs",
                    acceptResult.ok
                      ? "border-green-500/30 bg-green-500/5 text-green-500"
                      : "border-red-500/30 bg-red-500/5 text-red-500",
                  )}
                >
                  {acceptResult.ok ? (
                    <p>
                      Bid accepted. Job assigned.{" "}
                      {acceptResult.txHash && (
                        <a
                          href={`${EXPLORER}/tx/${acceptResult.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {acceptResult.txHash.slice(0, 18)}…
                        </a>
                      )}
                    </p>
                  ) : (
                    <p>Accept failed: {acceptResult.error}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {job.status === "DISPUTED" && (
            <>
              <Card className="surface-card border-red-500/30">
                <CardContent className="p-5">
                  <h3 className="mb-1 flex items-center gap-2 font-semibold text-red-500">
                    <AlertTriangle className="h-4 w-4" /> Under dispute
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Escrow is frozen until DisputeCouncil resolves.
                  </p>
                </CardContent>
              </Card>
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
                        Council evaluates evidence from requester and provider, then votes.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-border/60 p-2.5">
                        <p className="font-mono text-[10px] text-muted-foreground">Requester</p>
                        <p className="mt-0.5 font-mono text-xs text-foreground">
                          {shortAddress(job.requester)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 p-2.5">
                        <p className="font-mono text-[10px] text-muted-foreground">Provider</p>
                        <p className="mt-0.5 font-mono text-xs text-foreground">
                          {shortAddress(job.provider)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Shield className="h-4 w-4 text-primary" /> Escrow
              </h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Max reward</span>
                <span className="font-mono font-medium">{formatRitual(job.reward)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bond required</span>
                <span className="font-mono font-medium">{formatRitual(job.bondRequired)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={cn(
                    "font-medium",
                    job.status === "COMPLETED"
                      ? "text-green-500"
                      : job.status === "DISPUTED"
                        ? "text-red-500"
                        : "text-yellow-500",
                  )}
                >
                  {job.status === "COMPLETED"
                    ? "Released"
                    : job.status === "DISPUTED"
                      ? "Frozen"
                      : "Held"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Bid form with explicit price input */}
          {job.status === "OPEN" && (
            <Card className="surface-card border-blue-500/20">
              <CardContent className="p-5">
                <h3 className="mb-1 flex items-center gap-2 font-semibold">
                  <Send className="h-4 w-4 text-blue-500" /> Place bid
                </h3>
                <p className="mb-3 text-[11px] text-muted-foreground">
                  Set your bid price in RITUAL. Max reward is {formatRitual(job.reward)}. Lower
                  price is more competitive.
                </p>
                <div className="space-y-3">
                  <label className="block text-sm">
                    <span className="mb-1 block text-muted-foreground">Bid price (RITUAL)</span>
                    <input
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={bidPrice}
                      onChange={(e) => setBidPrice(e.target.value)}
                      placeholder="e.g. 0.08"
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none ring-ring focus-visible:ring-2"
                    />
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      Suggested ~90% of max: {(maxRewardEth * 0.9).toFixed(4)} RIT
                    </span>
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-muted-foreground">Est. blocks to complete</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={estBlocks}
                      onChange={(e) => setEstBlocks(e.target.value)}
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none ring-ring focus-visible:ring-2"
                    />
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      ≈ <BlocksDuration blocks={BigInt(Math.max(1, parseInt(estBlocks, 10) || 100))} /> wall-clock
                      on Ritual (~200ms/block)
                    </span>
                  </label>
                  <Button
                    onClick={submitBid}
                    disabled={bidSending || !bidPrice}
                    className="w-full gap-1.5"
                    size="sm"
                  >
                    {bidSending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {bidSending ? "Signing…" : `Bid ${bidPrice || "0"} RIT`}
                  </Button>
                  {bidResult && (
                    <div
                      className={cn(
                        "rounded-lg border p-2.5 text-xs",
                        bidResult.ok
                          ? "border-green-500/30 bg-green-500/5 text-green-500"
                          : "border-red-500/30 bg-red-500/5 text-red-500",
                      )}
                    >
                      {bidResult.ok ? (
                        <p>
                          Bid submitted.{" "}
                          <a
                            href={`${EXPLORER}/tx/${bidResult.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            {bidResult.txHash?.slice(0, 18)}…
                          </a>
                        </p>
                      ) : (
                        <p>Failed: {bidResult.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Clock className="h-4 w-4 text-primary" /> Timeline
              </h3>
              <ol className="space-y-3">
                {timeline(job.status).map((s, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm">
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border",
                        s.done
                          ? "border-green-500 bg-green-500 text-white"
                          : s.current
                            ? "border-primary"
                            : "border-muted-foreground/40",
                      )}
                    >
                      {s.done && <Check className="h-2.5 w-2.5" />}
                      {s.current && <CircleDot className="h-2 w-2 text-primary" />}
                    </span>
                    <span className={s.done || s.current ? "text-foreground" : "text-muted-foreground"}>
                      {s.label}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Hash className="h-4 w-4 text-primary" /> On-chain data
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Job ID</span>
                  <span className="font-mono">#{job.id}</span>
                </div>
                <BlockDeadline deadline={job.deadline} variant="full" />
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
                Bid with a price, then the requester reviews and accepts the matching bid.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3 w-full gap-1.5">
                <Link href="/skills">
                  Browse skills <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            <Link href="/jobs" className="text-primary hover:underline">
              ← All jobs
            </Link>
          </p>
        </aside>
      </div>
    </div>
  )
}
