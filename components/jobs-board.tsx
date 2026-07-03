"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, ExternalLink, Inbox, Info, Wallet, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BUILT_IN_SKILLS, CONTRACT_ADDRESSES, JOB_STATUS_LABELS, type JobStatus } from "@/lib/constants"
import { type OnchainJob } from "@/lib/onchain"
import { cn, formatRitual, truncateAddress } from "@/lib/utils"
import { connectWallet, postJob, type WalletState } from "@/lib/wallet"

const EXPLORER = "https://explorer.ritualfoundation.org"

const STATUS_COLOR: Record<JobStatus, string> = {
  OPEN: "bg-yellow-500/10 text-yellow-500",
  ASSIGNED: "bg-blue-500/10 text-blue-500",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500",
  COMPLETED: "bg-green-500/10 text-green-500",
  DISPUTED: "bg-red-500/10 text-red-500",
  REFUNDED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
}

function PostJobCard() {
  const [prompt, setPrompt] = useState("")
  const [reward, setReward] = useState("0.1")
  const [skillId, setSkillId] = useState<string>(BUILT_IN_SKILLS[0].skillId)
  const [wallet, setWallet] = useState<WalletState | null>(null)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; txHash?: string; error?: string } | null>(null)

  const connect = async () => {
    try {
      const w = await connectWallet()
      setWallet(w)
    } catch (e) {
      setResult({ ok: false, error: (e as Error).message })
    }
  }

  const submit = async () => {
    if (!wallet) {
      await connect()
      if (!wallet) return
    }
    setSending(true)
    setResult(null)
    try {
      const rewardWei = BigInt(Math.floor(parseFloat(reward) * 1e18))
      const hash = await postJob(wallet!, [skillId as `0x${string}`], prompt, rewardWei)
      setResult({ ok: true, txHash: hash })
      setPrompt("")
    } catch (e: any) {
      setResult({ ok: false, error: e?.shortMessage || e?.message || String(e) })
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
          Your wallet signs the transaction directly. You pay gas + reward. Requester = your address.
        </p>

        {!wallet && (
          <Button onClick={connect} variant="outline" className="mb-3 w-full gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Connect wallet
          </Button>
        )}
        {wallet && (
          <p className="mb-3 font-mono text-[11px] text-primary">{truncateAddress(wallet.address)}</p>
        )}

        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Required skill</span>
            <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="w-full cursor-pointer rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2">
              {BUILT_IN_SKILLS.map((s) => (
                <option key={s.skillId} value={s.skillId}>{s.name} · {s.precompileType}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Prompt / task data</span>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="e.g. Analyze BTC sentiment from the last 24h" className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Reward (RITUAL) — held in escrow</span>
            <input type="number" min="0" step="0.01" value={reward} onChange={(e) => setReward(e.target.value)} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2" />
          </label>
          <Button onClick={submit} disabled={!prompt || sending} className="w-full gap-1.5">
            {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing…</> : <><Plus className="h-4 w-4" /> Post job ({reward || "0"} RITUAL)</>}
          </Button>
        </div>

        {result && (
          <div className={cn("mt-3 rounded-lg border p-3 text-xs", result.ok ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5")}>
            <p className={cn("mb-1 font-medium", result.ok ? "text-green-500" : "text-red-500")}>
              {result.ok ? "Job posted on-chain!" : "Failed"}
            </p>
            {result.txHash && (
              <p className="break-all font-mono text-muted-foreground">
                tx: <a href={`${EXPLORER}/tx/${result.txHash}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{result.txHash.slice(0, 20)}…</a>
              </p>
            )}
            {result.error && <p className="text-muted-foreground">{result.error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function JobsBoard({ jobs }: { jobs: OnchainJob[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <PostJobCard />
      </div>

      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Jobs</h3>
          <span className="text-xs text-muted-foreground">{jobs.length} total</span>
        </div>
        {jobs.length === 0 ? (
          <Card className="surface-card border-border/60">
            <CardContent className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <Inbox className="h-6 w-6" />
              <p className="text-sm">No jobs yet. Post the first one above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id} className="surface-card border-border/60 transition-colors hover:border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">Job #{job.id}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COLOR[job.status])}>
                          {JOB_STATUS_LABELS[job.status]}
                        </span>
                      </div>
                      <p className="truncate text-sm">{job.taskData || <span className="text-muted-foreground">(binary task data)</span>}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>Requester <span className="font-mono">{truncateAddress(job.requester)}</span></span>
                        {job.provider !== "0x0000000000000000000000000000000000000000" && (
                          <span>Provider <span className="font-mono">{truncateAddress(job.provider)}</span></span>
                        )}
                        <Link href={`/jobs/${job.id}`} className="text-primary hover:underline">details →</Link>
                        <a href={`${EXPLORER}/address/${CONTRACT_ADDRESSES.jobMarketV2}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                          escrow <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-medium text-primary">{formatRitual(job.reward)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
