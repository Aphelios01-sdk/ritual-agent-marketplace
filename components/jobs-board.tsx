"use client"

import { useState } from "react"
import { useAccount, useWriteContract } from "wagmi"
import { type Address, parseEther, toHex } from "viem"
import { Loader2, Plus, Gavel, ExternalLink, Inbox } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BUILT_IN_SKILLS, CONTRACT_ADDRESSES, JOB_STATUS_LABELS, type JobStatus } from "@/lib/constants"
import { JOB_MARKET_V2_ABI } from "@/lib/contract-abi-v2"
import { type OnchainJob } from "@/lib/onchain"
import { cn, formatRitual, truncateAddress } from "@/lib/utils"

const JOB_MARKET_V2 = CONTRACT_ADDRESSES.jobMarketV2 as Address
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

function PostJobCard({ onPosted }: { onPosted: () => void }) {
  const { isConnected } = useAccount()
  const { writeContractAsync, isPending } = useWriteContract()
  const [prompt, setPrompt] = useState("")
  const [reward, setReward] = useState("0.1")
  const [skillId, setSkillId] = useState<string>(BUILT_IN_SKILLS[0].skillId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    setBusy(true)
    try {
      await writeContractAsync({
        address: JOB_MARKET_V2,
        abi: JOB_MARKET_V2_ABI,
        functionName: "requestService",
        args: [[skillId as `0x${string}`], toHex(prompt)],
        value: parseEther(reward || "0"),
      })
      setPrompt("")
      onPosted()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post job")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="surface-card border-border/60">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Post a job</h3>
        </div>
        {!isConnected ? (
          <p className="text-sm text-muted-foreground">Connect a wallet to post a job. The reward is locked in escrow until the result is accepted.</p>
        ) : (
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
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={submit} disabled={busy || !prompt} className="w-full gap-1.5">
              {busy || isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Post job &amp; lock {reward || "0"} RITUAL
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BidButton({ jobId }: { jobId: string }) {
  const { isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [price, setPrice] = useState("0.05")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function bid() {
    setBusy(true)
    try {
      await writeContractAsync({
        address: JOB_MARKET_V2,
        abi: JOB_MARKET_V2_ABI,
        functionName: "submitBid",
        args: [BigInt(jobId), parseEther(price || "0"), BigInt(50)],
      })
      setDone(true)
    } catch {
      /* ignore */
    } finally {
      setBusy(false)
    }
  }

  if (!isConnected) return null
  return (
    <div className="flex items-center gap-1.5">
      <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-20 rounded-md border border-border bg-transparent px-2 py-1 text-xs outline-none ring-ring focus-visible:ring-1" />
      <Button size="sm" variant="outline" onClick={bid} disabled={busy || done} className="h-7 gap-1 px-2 text-xs">
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Gavel className="h-3 w-3" />}
        {done ? "Bid sent" : "Bid"}
      </Button>
    </div>
  )
}

export function JobsBoard({ jobs, isMock }: { jobs: OnchainJob[]; isMock: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const list = jobs

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <PostJobCard onPosted={() => setRefreshKey((k) => k + 1)} />
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">
          New jobs appear after the next page load (server reads fresh on-chain state).
        </p>
      </div>

      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Open jobs</h3>
          <span className="text-xs text-muted-foreground">{list.length} total{isMock && " · mock"}</span>
        </div>
        {list.length === 0 ? (
          <Card className="surface-card border-border/60">
            <CardContent className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <Inbox className="h-6 w-6" />
              <p className="text-sm">No jobs yet. Post the first one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3" key={refreshKey}>
            {list.map((job) => (
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
                        <a href={`${EXPLORER}/address/${CONTRACT_ADDRESSES.jobMarketV2}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                          escrow <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="font-mono text-sm font-medium text-primary">{formatRitual(job.reward)}</span>
                      {job.status === "OPEN" && <BidButton jobId={job.id} />}
                    </div>
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
