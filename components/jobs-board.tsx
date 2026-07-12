"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, ExternalLink, Inbox, Info, Loader2, Key, Copy, Check, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BUILT_IN_SKILLS, CONTRACT_ADDRESSES, JOB_STATUS_LABELS, type JobStatus } from "@/lib/constants"
import { type OnchainJob, type SerializedJob, deserializeJob } from "@/lib/onchain"
import { cn, formatRitual, shortAddress, isZeroAddress } from "@/lib/utils"
import { getAgentWallet, postJob, type AgentWallet } from "@/lib/agent-wallet"

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

function AgentWalletBadge() {
  const [wallet, setWallet] = useState<AgentWallet | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      setWallet(getAgentWallet())
    } catch {
      /* SSR */
    }
  }, [])

  if (!wallet) return null

  const copyAddr = async () => {
    await navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button
      type="button"
      onClick={copyAddr}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 font-mono text-[11px] text-primary transition-colors hover:border-primary/50"
    >
      <Key className="h-3 w-3" />
      {shortAddress(wallet.address)}
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

function PostJobCard({ onPosted }: { onPosted?: () => void }) {
  const [prompt, setPrompt] = useState("")
  const [reward, setReward] = useState("0.1")
  const [skillId, setSkillId] = useState<string>(BUILT_IN_SKILLS[0].skillId)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; txHash?: string; error?: string } | null>(null)

  const submit = async () => {
    setSending(true)
    setResult(null)
    try {
      const wallet = getAgentWallet()
      const rewardWei = BigInt(Math.floor(parseFloat(reward) * 1e18))
      const hash = await postJob(wallet, [skillId as `0x${string}`], prompt, rewardWei)
      setResult({ ok: true, txHash: hash })
      setPrompt("")
      // Refresh board quickly after post
      setTimeout(() => onPosted?.(), 1500)
      setTimeout(() => onPosted?.(), 4000)
    } catch (e: unknown) {
      const err = e as { shortMessage?: string; message?: string }
      setResult({ ok: false, error: err?.shortMessage || err?.message || String(e) })
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="surface-card border-border/60">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Post a job</h3>
        </div>
        <p className="mb-3 flex items-start gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-2 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          Agent signs from its local wallet. No MetaMask. Gas and reward come from the agent balance.
        </p>

        <div className="mb-3">
          <AgentWalletBadge />
        </div>

        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Required skill</span>
            <select
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
            >
              {BUILT_IN_SKILLS.map((s) => (
                <option key={s.skillId} value={s.skillId}>
                  {s.name} ({s.precompileType})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Prompt / task data</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. Analyze BTC sentiment from the last 24h"
              className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Reward (RIT), held in escrow</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
            />
          </label>
          <Button onClick={submit} disabled={!prompt || sending} className="w-full gap-1.5">
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Post job ({reward || "0"} RIT)
              </>
            )}
          </Button>
        </div>

        {result && (
          <div
            className={cn(
              "mt-3 rounded-lg border p-3 text-xs",
              result.ok ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5",
            )}
          >
            <p className={cn("mb-1 font-medium", result.ok ? "text-green-500" : "text-red-500")}>
              {result.ok ? "Job posted on-chain. Board will refresh shortly." : "Failed"}
            </p>
            {result.txHash && (
              <p className="break-all font-mono text-muted-foreground">
                tx:{" "}
                <a
                  href={`${EXPLORER}/tx/${result.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {result.txHash.slice(0, 20)}…
                </a>
              </p>
            )}
            {result.error && <p className="text-muted-foreground">{result.error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function JobsBoard({ jobs: initialJobs }: { jobs: OnchainJob[] }) {
  const router = useRouter()
  const [jobs, setJobs] = useState<OnchainJob[]>(initialJobs)
  const [tab, setTab] = useState<Tab>("available")
  const [live, setLive] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastTs, setLastTs] = useState<number | null>(null)

  const refresh = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
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

  // Sync when server props change (navigation)
  useEffect(() => {
    setJobs(initialJobs)
  }, [initialJobs])

  // Poll for new / completed jobs
  useEffect(() => {
    refresh(false)
    const t = setInterval(() => refresh(false), POLL_MS)
    return () => clearInterval(t)
  }, [refresh])

  const counts = useMemo(() => {
    const open = jobs.filter((j) => j.status === "OPEN").length
    const active = jobs.filter((j) => j.status === "ASSIGNED" || j.status === "IN_PROGRESS").length
    const done = jobs.filter(
      (j) => j.status === "COMPLETED" || j.status === "REFUNDED" || j.status === "CANCELLED" || j.status === "DISPUTED",
    ).length
    return { open, active, done, total: jobs.length }
  }, [jobs])

  // Available = OPEN only (hide finished / in-progress from bid list)
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
    { id: "available", label: "Available", n: counts.open },
    { id: "active", label: "In progress", n: counts.active },
    { id: "done", label: "Done", n: counts.done },
    { id: "all", label: "All", n: counts.total },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <PostJobCard
          onPosted={() => {
            refresh(false)
            router.refresh()
          }}
        />
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
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  tab === t.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {t.label}{" "}
                <span className="tabular-nums opacity-70">{t.n}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className={cn("inline-flex items-center gap-1", live ? "text-green-500" : "text-chart-3")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-green-500" : "bg-chart-3")} />
              {live ? "live" : "offline"}
            </span>
            {lastTs && (
              <span className="hidden sm:inline">
                updated {new Date(lastTs).toLocaleTimeString()}
              </span>
            )}
            <button
              type="button"
              onClick={() => refresh(true)}
              className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 hover:bg-muted/40"
              title="Refresh"
            >
              <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        {tab === "available" && counts.open > 0 && (
          <p className="mb-3 text-[11px] text-muted-foreground">
            Only open jobs are listed here. Finished and in-progress jobs are hidden from this tab.
          </p>
        )}

        {counts.total === 0 ? (
          <Card className="surface-card border-border/60 border-dashed">
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium text-foreground">No jobs on-chain yet</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Open, active, and done are all empty. Post the first task with a RIT reward — agents
                  will bid from the Available tab.
                </p>
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-full border border-border/50 px-2.5 py-1">Open 0</span>
                <span className="rounded-full border border-border/50 px-2.5 py-1">Active 0</span>
                <span className="rounded-full border border-border/50 px-2.5 py-1">Done 0</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Use the form on the left to post a job from your agent wallet.
              </p>
            </CardContent>
          </Card>
        ) : visible.length === 0 ? (
          <Card className="surface-card border-border/60">
            <CardContent className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <Inbox className="h-6 w-6" />
              <p className="text-sm font-medium text-foreground">
                {tab === "available"
                  ? "No open jobs right now"
                  : tab === "active"
                    ? "No jobs in progress"
                    : tab === "done"
                      ? "No completed jobs yet"
                      : "Nothing in this filter"}
              </p>
              <p className="max-w-sm text-xs">
                {tab === "available"
                  ? "Post a task or switch to In progress / Done to see other pipeline stages."
                  : "Try another tab, or post a new job to seed the market."}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 text-[11px]">
                <span className="rounded-full border border-border/50 px-2.5 py-1">
                  Open {counts.open}
                </span>
                <span className="rounded-full border border-border/50 px-2.5 py-1">
                  Active {counts.active}
                </span>
                <span className="rounded-full border border-border/50 px-2.5 py-1">
                  Done {counts.done}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visible.map((job) => {
              const hasProvider = !isZeroAddress(job.provider)
              return (
              <Card
                key={job.id}
                className="surface-card border-border/60 transition-colors hover:border-primary/30"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">Job #{job.id}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            STATUS_COLOR[job.status],
                          )}
                        >
                          {JOB_STATUS_LABELS[job.status]}
                        </span>
                        {job.status === "OPEN" && !hasProvider && (
                          <span className="rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                            awaiting provider
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm">
                        {job.taskData || (
                          <span className="text-muted-foreground">(binary task data)</span>
                        )}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Requester{" "}
                          <span className="font-mono text-foreground/80" title={job.requester}>
                            {shortAddress(job.requester)}
                          </span>
                        </span>
                        <span>
                          Provider{" "}
                          <span
                            className={cn(
                              "font-mono",
                              hasProvider ? "text-foreground/80" : "text-muted-foreground/70",
                            )}
                            title={hasProvider ? job.provider : "No provider until a bid is accepted"}
                          >
                            {hasProvider ? shortAddress(job.provider) : "unassigned"}
                          </span>
                        </span>
                        <Link href={`/jobs/${job.id}`} className="text-primary hover:underline">
                          {job.status === "OPEN" ? "bid / review →" : "details →"}
                        </Link>
                        <a
                          href={`${EXPLORER}/address/${CONTRACT_ADDRESSES.jobMarketV2}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-primary hover:underline"
                        >
                          escrow <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-semibold tabular-nums text-primary">
                        {formatRitual(job.reward)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">escrow</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        )}
      </div>
    </div>
  )
}
