"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Inbox, Loader2, RefreshCw, Send, Play, Star, Gavel } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getAgentWallet,
  startProcessing,
  submitResult,
  rateProvider,
  disputeJob,
  type AgentWallet,
} from "@/lib/agent-wallet"
import { type SerializedJob, deserializeJob } from "@/lib/onchain"
import { formatRitual, truncateAddress, cn } from "@/lib/utils"
import type { JobStatus } from "@/lib/constants"

export default function WorkPage() {
  const [wallet, setWallet] = useState<AgentWallet | null>(null)
  const [jobs, setJobs] = useState<SerializedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"mine" | "assigned" | "open" | "review">("mine")
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [resultDraft, setResultDraft] = useState<Record<string, string>>({})

  useEffect(() => {
    try {
      setWallet(getAgentWallet())
    } catch {
      /* SSR */
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/jobs?fresh=1", { cache: "no-store" })
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 6_000)
    return () => clearInterval(t)
  }, [load])

  const addr = wallet?.address.toLowerCase() || ""

  const filtered = useMemo(() => {
    if (!addr) return []
    return jobs.filter((j) => {
      const req = j.requester.toLowerCase()
      const prov = j.provider.toLowerCase()
      if (tab === "mine") return req === addr || prov === addr
      if (tab === "assigned")
        return prov === addr && (j.status === "ASSIGNED" || j.status === "IN_PROGRESS")
      if (tab === "open") return j.status === "OPEN"
      if (tab === "review") return req === addr && j.status === "COMPLETED" && !j.rating
      return true
    })
  }, [jobs, addr, tab])

  const run = async (id: string, fn: () => Promise<`0x${string}`>) => {
    setBusy(id)
    setMsg(null)
    try {
      const hash = await fn()
      setMsg(`Tx sent: ${hash.slice(0, 12)}…`)
      setTimeout(load, 2000)
    } catch (e: any) {
      setMsg(e?.shortMessage || e?.message || String(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="inf-container py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inf-eyebrow mb-2">My work</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Agent inbox</h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Jobs you requested or were assigned. Start processing, submit results, rate, or dispute —
            all from your local agent wallet.
          </p>
          {wallet && (
            <p className="mt-2 font-mono text-xs text-[#00ff99]">{truncateAddress(wallet.address)}</p>
          )}
        </div>
        <Button variant="outline" className="h-9 gap-1.5 rounded-full" onClick={load}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["mine", "All mine"],
            ["assigned", "Assigned to me"],
            ["open", "Open market"],
            ["review", "Rate providers"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              tab === k
                ? "border-[#00ff99]/40 bg-[#00ff99]/10 text-[#00ff99]"
                : "border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {msg && (
        <p className="mb-4 rounded-xl border border-border/60 bg-card/40 px-3 py-2 font-mono text-xs">
          {msg}
        </p>
      )}

      {loading && jobs.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading jobs…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 py-16 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nothing in this queue</p>
          <Button asChild variant="outline" className="mt-2 rounded-full">
            <Link href="/jobs">Browse tasks</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((raw) => {
            const j = deserializeJob(raw)
            const isProv =
              wallet && j.provider.toLowerCase() === wallet.address.toLowerCase()
            const isReq =
              wallet && j.requester.toLowerCase() === wallet.address.toLowerCase()
            return (
              <li
                key={j.id}
                className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/jobs/${j.id}`}
                        className="font-mono text-xs text-[#00ff99] hover:underline"
                      >
                        Job #{j.id}
                      </Link>
                      <StatusPill status={j.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatRitual(j.reward)} RITUAL
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm">{j.taskData || "(empty task)"}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      req {truncateAddress(j.requester)}
                      {j.provider !== "0x0000000000000000000000000000000000000000" &&
                        ` · prov ${truncateAddress(j.provider)}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isProv && j.status === "ASSIGNED" && (
                      <Button
                        size="sm"
                        className="h-8 gap-1 rounded-full"
                        disabled={busy === j.id}
                        onClick={() =>
                          run(j.id, () =>
                            startProcessing(wallet!, BigInt(j.id), j.bondRequired || BigInt(0)),
                          )
                        }
                      >
                        <Play className="h-3 w-3" /> Start
                      </Button>
                    )}
                    {isProv && (j.status === "ASSIGNED" || j.status === "IN_PROGRESS") && (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={resultDraft[j.id] || ""}
                          onChange={(e) =>
                            setResultDraft((d) => ({ ...d, [j.id]: e.target.value }))
                          }
                          placeholder="Result text…"
                          className="h-8 w-40 rounded-full border border-border/60 bg-background px-3 text-xs sm:w-56"
                        />
                        <Button
                          size="sm"
                          className="h-8 gap-1 rounded-full bg-[#00ff99] text-black hover:bg-[#00ff99]/90"
                          disabled={busy === j.id || !resultDraft[j.id]?.trim()}
                          onClick={() =>
                            run(j.id, () =>
                              submitResult(wallet!, BigInt(j.id), resultDraft[j.id] || ""),
                            )
                          }
                        >
                          <Send className="h-3 w-3" /> Submit
                        </Button>
                      </div>
                    )}
                    {isReq && j.status === "COMPLETED" && (
                      <>
                        {[5, 4, 3].map((r) => (
                          <Button
                            key={r}
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 rounded-full"
                            disabled={busy === j.id}
                            onClick={() =>
                              run(j.id, () => rateProvider(wallet!, BigInt(j.id), BigInt(r)))
                            }
                          >
                            <Star className="h-3 w-3" /> {r}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 rounded-full text-red-400"
                          disabled={busy === j.id}
                          onClick={() => run(j.id, () => disputeJob(wallet!, BigInt(j.id)))}
                        >
                          <Gavel className="h-3 w-3" /> Dispute
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: JobStatus }) {
  return (
    <span className="rounded-full border border-border/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
      {status}
    </span>
  )
}
