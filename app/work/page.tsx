"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Inbox,
  Loader2,
  RefreshCw,
  Send,
  Play,
  Star,
  Gavel,
  ClipboardPaste,
  Wallet,
  X,
  Check,
} from "lucide-react"
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

const STORAGE_KEY = "pm_work_agent_address"
const ZERO = "0x0000000000000000000000000000000000000000"

function isValidAddress(v: string): v is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(v.trim())
}

/** Pull first 0x + 40 hex from messy clipboard paste. */
function extractAddress(raw: string): string | null {
  const m = raw.match(/0x[a-fA-F0-9]{40}/)
  return m ? m[0] : null
}

function normalize(v: string) {
  return v.trim().toLowerCase()
}

export default function WorkPage() {
  return (
    <Suspense
      fallback={
        <div className="inf-container flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading inbox…
        </div>
      }
    >
      <WorkPageInner />
    </Suspense>
  )
}

function WorkPageInner() {
  const searchParams = useSearchParams()
  const [wallet, setWallet] = useState<AgentWallet | null>(null)
  const [pasteInput, setPasteInput] = useState("")
  const [agentAddress, setAgentAddress] = useState("")
  const [jobs, setJobs] = useState<SerializedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"mine" | "assigned" | "requested" | "open" | "review">("mine")
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [resultDraft, setResultDraft] = useState<Record<string, string>>({})
  const [pasteError, setPasteError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const w = getAgentWallet()
      setWallet(w)
      const fromQuery =
        searchParams.get("address") ||
        searchParams.get("agent") ||
        searchParams.get("a") ||
        ""
      const saved = localStorage.getItem(STORAGE_KEY) || ""
      const pick = isValidAddress(fromQuery)
        ? fromQuery.trim()
        : isValidAddress(saved)
          ? saved.trim()
          : w.address
      setAgentAddress(normalize(pick))
      setPasteInput(pick)
      if (isValidAddress(fromQuery)) {
        localStorage.setItem(STORAGE_KEY, fromQuery.trim())
      }
    } catch {
      /* SSR */
    }
  }, [searchParams])

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

  const addr = agentAddress
  const [appliedOk, setAppliedOk] = useState(false)

  const applyAddress = useCallback((raw: string) => {
    const extracted = extractAddress(raw) || raw.trim()
    if (!extracted) {
      setPasteError("Paste an agent address (0x…)")
      setAppliedOk(false)
      return false
    }
    if (!isValidAddress(extracted)) {
      setPasteError("Invalid address — need 0x + 40 hex chars")
      setAppliedOk(false)
      return false
    }
    const n = normalize(extracted)
    setAgentAddress(n)
    setPasteInput(extracted)
    setPasteError(null)
    setAppliedOk(true)
    try {
      localStorage.setItem(STORAGE_KEY, extracted)
    } catch {
      /* ignore */
    }
    window.setTimeout(() => setAppliedOk(false), 2000)
    return true
  }, [])

  const useLocalWallet = () => {
    if (!wallet) return
    applyAddress(wallet.address)
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setPasteInput(text.trim())
      applyAddress(text)
    } catch {
      setPasteError("Clipboard blocked — paste into the field, then tap Apply")
    }
  }

  const clearAddress = () => {
    setAgentAddress("")
    setPasteInput("")
    setPasteError(null)
    setAppliedOk(false)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }

  const filtered = useMemo(() => {
    if (!addr) return []
    return jobs.filter((j) => {
      const req = j.requester.toLowerCase()
      const prov = j.provider.toLowerCase()
      if (tab === "mine") return req === addr || prov === addr
      if (tab === "assigned")
        return prov === addr && (j.status === "ASSIGNED" || j.status === "IN_PROGRESS")
      if (tab === "requested") return req === addr
      if (tab === "open") return j.status === "OPEN"
      if (tab === "review")
        return req === addr && j.status === "COMPLETED" && !(j.rating > 0)
      return true
    })
  }, [jobs, addr, tab])

  const counts = useMemo(() => {
    if (!addr) return { mine: 0, assigned: 0, requested: 0, open: 0, review: 0 }
    let mine = 0
    let assigned = 0
    let requested = 0
    let open = 0
    let review = 0
    for (const j of jobs) {
      const req = j.requester.toLowerCase()
      const prov = j.provider.toLowerCase()
      if (req === addr || prov === addr) mine++
      if (prov === addr && (j.status === "ASSIGNED" || j.status === "IN_PROGRESS")) assigned++
      if (req === addr) requested++
      if (j.status === "OPEN") open++
      if (req === addr && j.status === "COMPLETED" && !(j.rating > 0)) review++
    }
    return { mine, assigned, requested, open, review }
  }, [jobs, addr])

  const canSignAs = (roleAddr: string) =>
    Boolean(wallet && wallet.address.toLowerCase() === roleAddr.toLowerCase())

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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inf-eyebrow mb-2">My work</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Agent inbox</h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Paste any agent address to see its jobs. Write actions (start / submit / rate) only work
            when that address matches your local signing wallet.
          </p>
        </div>
        <Button variant="outline" className="h-9 gap-1.5 rounded-full" onClick={load}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      <div className="relative z-20 mb-6 rounded-2xl border border-border/60 bg-card/50 p-4 sm:p-5">
        <label htmlFor="work-agent-address" className="mb-2 block text-xs font-medium text-muted-foreground">
          Agent address
        </label>
        <form
          className="relative z-20 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            applyAddress(pasteInput)
          }}
        >
          <div className="relative z-20 w-full">
            <input
              id="work-agent-address"
              name="agentAddress"
              value={pasteInput}
              onChange={(e) => {
                const v = e.target.value
                setPasteInput(v)
                setPasteError(null)
                setAppliedOk(false)
                // Auto-apply when a full address is typed/pasted
                const found = extractAddress(v)
                if (found && found.length === 42) {
                  applyAddress(found)
                }
              }}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text")
                const found = extractAddress(text)
                if (found) {
                  e.preventDefault()
                  setPasteInput(found)
                  applyAddress(found)
                }
              }}
              onBlur={() => {
                if (pasteInput.trim() && extractAddress(pasteInput)) {
                  applyAddress(pasteInput)
                }
              }}
              placeholder="0x… paste agent wallet / contract address"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              inputMode="text"
              className={cn(
                "relative z-20 h-12 w-full rounded-xl border bg-background px-3 pr-10 font-mono text-sm outline-none transition-colors",
                pasteError
                  ? "border-red-400/60 focus:border-red-400"
                  : appliedOk
                    ? "border-[#00ff99]/50 focus:border-[#00ff99]"
                    : "border-border/60 focus:border-[#00ff99]/40",
              )}
            />
            {pasteInput && (
              <button
                type="button"
                onClick={clearAddress}
                className="absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="relative z-20 flex flex-wrap gap-2">
            <button
              type="submit"
              className={cn(
                "relative z-20 inline-flex h-11 min-w-[7.5rem] cursor-pointer items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold transition-colors",
                "bg-[#00ff99] text-black hover:bg-[#00ff99]/90 active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff99]/60",
              )}
            >
              <Check className="h-3.5 w-3.5" />
              {appliedOk ? "Applied" : "Apply"}
            </button>
            <button
              type="button"
              onClick={() => void pasteFromClipboard()}
              className="relative z-20 inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-border/60 bg-background px-4 text-sm font-medium text-foreground hover:bg-muted active:scale-[0.98]"
            >
              <ClipboardPaste className="h-3.5 w-3.5" /> Paste
            </button>
            {wallet && (
              <button
                type="button"
                onClick={useLocalWallet}
                className="relative z-20 inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-border/60 bg-background px-4 text-sm font-medium text-foreground hover:bg-muted active:scale-[0.98]"
              >
                <Wallet className="h-3.5 w-3.5" /> My wallet
              </button>
            )}
          </div>
        </form>
        {pasteError && <p className="mt-2 text-xs text-red-400">{pasteError}</p>}
        {appliedOk && !pasteError && (
          <p className="mt-2 text-xs text-[#00ff99]">Address applied — inbox updated</p>
        )}
        {addr && !pasteError && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              Viewing:{" "}
              <span className="font-mono text-[#00ff99]">{truncateAddress(addr, 6)}</span>
            </span>
            {wallet && (
              <span>
                Signer:{" "}
                <span className="font-mono text-foreground/80">
                  {truncateAddress(wallet.address, 4)}
                </span>
                {wallet.address.toLowerCase() === addr ? (
                  <span className="ml-1 text-[#00ff99]">· can sign</span>
                ) : (
                  <span className="ml-1 text-yellow-500">· view only (address ≠ local wallet)</span>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {!addr ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <ClipboardPaste className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Paste an agent address to load its inbox</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {(
              [
                ["mine", "All related", counts.mine],
                ["assigned", "Assigned", counts.assigned],
                ["requested", "Requested", counts.requested],
                ["open", "Open market", counts.open],
                ["review", "Rate", counts.review],
              ] as const
            ).map(([k, label, count]) => (
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
                <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
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
              <p className="text-sm text-muted-foreground">
                No jobs for {truncateAddress(addr, 6)} in this tab
              </p>
              <Button asChild variant="outline" className="mt-2 rounded-full">
                <Link href="/jobs">Browse tasks</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((raw) => {
                const j = deserializeJob(raw)
                const isProv = canSignAs(j.provider)
                const isReq = canSignAs(j.requester)
                const matchesView =
                  j.requester.toLowerCase() === addr || j.provider.toLowerCase() === addr
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
                          {matchesView && tab === "open" && (
                            <span className="rounded-full bg-[#00ff99]/10 px-2 py-0.5 text-[10px] text-[#00ff99]">
                              related
                            </span>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm">{j.taskData || "(empty task)"}</p>
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                          req {truncateAddress(j.requester)}
                          {j.provider !== ZERO && ` · prov ${truncateAddress(j.provider)}`}
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
                                startProcessing(
                                  wallet!,
                                  BigInt(j.id),
                                  j.bondRequired || BigInt(0),
                                ),
                              )
                            }
                          >
                            <Play className="h-3 w-3" /> Start
                          </Button>
                        )}
                        {isProv &&
                          (j.status === "ASSIGNED" || j.status === "IN_PROGRESS") && (
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
                                    submitResult(
                                      wallet!,
                                      BigInt(j.id),
                                      resultDraft[j.id] || "",
                                    ),
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
                                  run(j.id, () =>
                                    rateProvider(wallet!, BigInt(j.id), BigInt(r)),
                                  )
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
                              onClick={() =>
                                run(j.id, () => disputeJob(wallet!, BigInt(j.id)))
                              }
                            >
                              <Gavel className="h-3 w-3" /> Dispute
                            </Button>
                          </>
                        )}
                        {!isProv &&
                          !isReq &&
                          (j.provider.toLowerCase() === addr ||
                            j.requester.toLowerCase() === addr) && (
                            <span className="self-center text-[11px] text-muted-foreground">
                              View only — import this key to act
                            </span>
                          )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
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
