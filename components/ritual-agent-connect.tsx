"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Wallet,
  Shield,
  Cpu,
  HeartPulse,
  Sparkles,
  Plug,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  getAgentWallet,
  connectBrowserWallet,
  tryReconnectBrowserWallet,
  hasBrowserWallet,
  getBalance,
  registerAgent,
  readAgentId,
  setAgentSkills,
  stakeBond,
  pingHeartbeat,
  waitTx,
  type AgentWallet,
} from "@/lib/agent-wallet"
import {
  RITUAL_DOCS,
  PROMPT_MARKET,
  DEFAULT_CONNECT_SKILL_IDS,
  MIN_RECOMMENDED_STAKE,
  MIN_RECOMMENDED_GAS,
  skillsToRegistryInput,
} from "@/lib/ritual-bridge"
import { BUILT_IN_SKILLS } from "@/lib/constants"
import { formatRitual, shortAddress, toWei, errMessage, cn } from "@/lib/utils"

type Step = 0 | 1 | 2 | 3 | 4 | 5

const STEP_META: { n: Step; label: string; icon: typeof Wallet }[] = [
  { n: 0, label: "Connect", icon: Plug },
  { n: 1, label: "Fund", icon: Wallet },
  { n: 2, label: "Register", icon: Sparkles },
  { n: 3, label: "Skills", icon: Cpu },
  { n: 4, label: "Bond", icon: Shield },
  { n: 5, label: "Live", icon: HeartPulse },
]

/**
 * Wizard: connect wallet (browser extension or session agent) → Prompt Market.
 * No private-key import or paste.
 */
export function RitualAgentConnect() {
  const [step, setStep] = useState<Step>(0)
  const [wallet, setWallet] = useState<AgentWallet | null>(null)
  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const [agentId, setAgentId] = useState<bigint>(BigInt(0))
  const [name, setName] = useState("")
  const [description, setDescription] = useState(
    "Ritual Chain agent serving jobs on Prompt Market via HTTP/LLM precompiles.",
  )
  const [selectedSkills, setSelectedSkills] = useState<string[]>([...DEFAULT_CONNECT_SKILL_IDS])
  const [stakeAmount, setStakeAmount] = useState(MIN_RECOMMENDED_STAKE)
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [browserAvailable, setBrowserAvailable] = useState(false)

  const pushLog = (line: string) => setLog((prev) => [...prev.slice(-12), line])

  const refresh = useCallback(async (w: AgentWallet) => {
    const [bal, id] = await Promise.all([getBalance(w.address), readAgentId(w.address)])
    setBalance(bal)
    setAgentId(id)
    setName((prev) => prev || `RitualAgent-${w.address.slice(2, 8)}`)
  }, [])

  useEffect(() => {
    setBrowserAvailable(hasBrowserWallet())
    let cancelled = false
    ;(async () => {
      try {
        const re = await tryReconnectBrowserWallet()
        if (cancelled) return
        if (re) {
          setWallet(re)
          pushLog(`Browser wallet ${re.address}`)
          await refresh(re)
          return
        }
        // Prefer not auto-creating local wallet until user chooses "session agent"
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const useSessionAgent = () => {
    setError(null)
    try {
      const w = getAgentWallet()
      setWallet(w)
      setName(`RitualAgent-${w.address.slice(2, 8)}`)
      pushLog(`Session agent ${w.address}`)
      refresh(w)
      setStep(1)
    } catch (e) {
      setError(errMessage(e) || "Could not create session agent")
    }
  }

  const onConnectBrowser = () =>
    run(async () => {
      pushLog("Requesting browser wallet…")
      const w = await connectBrowserWallet()
      setWallet(w)
      setName(`RitualAgent-${w.address.slice(2, 8)}`)
      pushLog(`Connected ${w.address}`)
      await refresh(w)
      setStep(1)
    })

  const copyAddr = async () => {
    if (!wallet) return
    try {
      await navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(errMessage(e) || "Transaction failed")
    } finally {
      setBusy(false)
    }
  }

  const onRegister = () =>
    run(async () => {
      if (!wallet) return
      if (agentId > BigInt(0)) {
        pushLog(`Already registered as agent #${agentId}`)
        setStep(3)
        return
      }
      if (!name.trim()) throw new Error("Name required")
      pushLog("registerAgent…")
      const hash = await registerAgent(wallet, name.trim(), description.trim())
      pushLog(`tx ${hash}`)
      await waitTx(hash)
      const id = await readAgentId(wallet.address)
      setAgentId(id)
      pushLog(`Registered agent #${id}`)
      setStep(3)
    })

  const onSkills = () =>
    run(async () => {
      if (!wallet) return
      let id = agentId
      if (id === BigInt(0)) {
        id = await readAgentId(wallet.address)
        setAgentId(id)
      }
      if (id === BigInt(0)) throw new Error("Register the agent first")
      const defs = BUILT_IN_SKILLS.filter((s) => selectedSkills.includes(s.skillId))
      if (defs.length === 0) throw new Error("Select at least one skill")
      const skills = skillsToRegistryInput(defs)
      pushLog(`setSkills (${skills.length})…`)
      const hash = await setAgentSkills(wallet, id, skills)
      pushLog(`tx ${hash}`)
      await waitTx(hash)
      pushLog("Skills installed")
      setStep(4)
    })

  const onStake = () =>
    run(async () => {
      if (!wallet) return
      const wei = toWei(stakeAmount)
      if (wei <= BigInt(0)) throw new Error("Stake amount must be > 0")
      pushLog(`stake ${stakeAmount} RITUAL…`)
      const hash = await stakeBond(wallet, wei)
      pushLog(`tx ${hash}`)
      await waitTx(hash)
      await refresh(wallet)
      pushLog("Bond posted")
      setStep(5)
    })

  const onHeartbeat = () =>
    run(async () => {
      if (!wallet) return
      pushLog("ping heartbeat…")
      const hash = await pingHeartbeat(wallet)
      pushLog(`tx ${hash}`)
      await waitTx(hash)
      pushLog("Agent is live on Prompt Market")
    })

  const toggleSkill = (sid: string) =>
    setSelectedSkills((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
    )

  const funded = balance > BigInt(0)

  return (
    <Card className="surface-card border-border">
      <CardContent className="space-y-5 p-5 md:p-6">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Interactive bridge
          </p>
          <h3 className="text-lg font-semibold">Connect Ritual agent → Prompt Market</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect a browser wallet (no private key paste) or use a session agent, then register,
            install skills, stake, and go live. Docs:{" "}
            <a href={RITUAL_DOCS.docs} target="_blank" rel="noreferrer" className="text-foreground underline-offset-4 hover:underline">
              docs.ritualfoundation.org
            </a>
            .
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STEP_META.map((s) => {
            const Icon = s.icon
            const active = step === s.n
            const done = step > s.n
            return (
              <button
                key={s.n}
                type="button"
                onClick={() => setStep(s.n)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] transition-colors",
                  active && "border-foreground bg-muted text-foreground",
                  done && !active && "border-border text-foreground",
                  !active && !done && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                {s.label}
              </button>
            )
          })}
        </div>

        {wallet && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
            <Badge variant="secondary" className="text-[10px]">
              {wallet.source === "browser" ? "Browser" : "Session"}
            </Badge>
            <code className="font-mono text-foreground">{shortAddress(wallet.address, 6)}</code>
            <button type="button" onClick={copyAddr} className="text-muted-foreground hover:text-foreground" aria-label="Copy">
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <span className="text-muted-foreground">·</span>
            <span className="tabular-nums">{formatRitual(balance)} RITUAL</span>
            {agentId > BigInt(0) && (
              <Badge variant="outline" className="text-[10px]">
                #{agentId.toString()}
              </Badge>
            )}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose how to sign. Private keys stay in your extension or in this browser session —
              never pasted into a form.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onConnectBrowser}
                disabled={busy || !browserAvailable}
                className={cn(
                  "rounded-lg border border-border p-4 text-left transition-colors hover:bg-card-hover",
                  !browserAvailable && "opacity-50",
                )}
              >
                <Plug className="mb-2 h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Browser wallet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {browserAvailable
                    ? "MetaMask / Rabby / injected — approve connection and switch to Ritual (1979)."
                    : "No extension detected. Install a wallet or use session agent."}
                </p>
              </button>
              <button
                type="button"
                onClick={useSessionAgent}
                disabled={busy}
                className="rounded-lg border border-border p-4 text-left transition-colors hover:bg-card-hover"
              >
                <Wallet className="mb-2 h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Session agent</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Auto wallet for this browser. Fund the address, then register — no extension needed.
                </p>
              </button>
            </div>
            {wallet && (
              <Button type="button" size="sm" variant="outline" onClick={() => setStep(1)}>
                Continue with {shortAddress(wallet.address)} <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3 text-sm">
            {!wallet ? (
              <p className="text-muted-foreground">Connect a wallet first (step 1).</p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Fund this address on Ritual Chain (chainId 1979) for gas + stake. Deposit into{" "}
                  <a href={RITUAL_DOCS.docs} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                    RitualWallet
                  </a>{" "}
                  if you will call HTTP/LLM precompiles.
                </p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>
                    Faucet:{" "}
                    <a href={RITUAL_DOCS.faucet} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                      faucet.ritualfoundation.org
                    </a>
                  </li>
                  <li>Recommended gas: ≥ {MIN_RECOMMENDED_GAS} RITUAL</li>
                  <li>Recommended stake: ≥ {MIN_RECOMMENDED_STAKE} RITUAL</li>
                  <li>
                    Explorer:{" "}
                    <a
                      href={`${RITUAL_DOCS.explorer}/address/${wallet.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 underline-offset-4 hover:underline"
                    >
                      view address <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                </ul>
                <p className={cn("font-mono text-xs", funded ? "text-success" : "text-muted-foreground")}>
                  Balance: {formatRitual(balance)} RITUAL {funded ? "(ready)" : "(fund me)"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => refresh(wallet)} disabled={busy}>
                    Refresh balance
                  </Button>
                  <Button type="button" size="sm" onClick={() => setStep(2)}>
                    Next: Register <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Agent name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Registry: <code className="font-mono">{shortAddress(PROMPT_MARKET.registry, 6)}</code>
              {agentId > BigInt(0) && (
                <span className="ml-2 text-success">Already registered as #{agentId.toString()}</span>
              )}
            </p>
            {wallet?.source === "browser" && (
              <p className="text-xs text-muted-foreground">
                Confirm each transaction in your wallet extension.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={onRegister} disabled={busy || !wallet}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {agentId > BigInt(0) ? "Skip (registered)" : "Register on-chain"}
              </Button>
              {agentId > BigInt(0) && (
                <Button type="button" size="sm" variant="outline" onClick={() => setStep(3)}>
                  Next: Skills
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select skills to advertise (HTTP <code className="font-mono text-[10px]">0x0801</code> / LLM{" "}
              <code className="font-mono text-[10px]">0x0802</code>).
            </p>
            <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
              {BUILT_IN_SKILLS.map((s) => {
                const on = selectedSkills.includes(s.skillId)
                return (
                  <button
                    key={s.skillId}
                    type="button"
                    onClick={() => toggleSkill(s.skillId)}
                    className={cn(
                      "rounded-lg border p-3 text-left text-sm transition-colors",
                      on ? "border-foreground bg-muted" : "border-border hover:bg-card-hover",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{s.name}</span>
                      <Badge variant="secondary" className="text-[9px]">
                        {s.precompileType}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                  </button>
                )
              })}
            </div>
            <Button type="button" size="sm" onClick={onSkills} disabled={busy || selectedSkills.length === 0 || !wallet}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Install {selectedSkills.length} skill(s)
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Post a slashable bond on AgentStaking. Active stake is required to bid on jobs.
            </p>
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Stake amount (RITUAL)</span>
              <input
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none ring-ring focus-visible:ring-2"
              />
            </label>
            <Button type="button" size="sm" onClick={onStake} disabled={busy || !wallet}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Stake bond
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ping marketplace heartbeat, then open the job board.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={onHeartbeat} disabled={busy || !wallet}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HeartPulse className="h-3.5 w-3.5" />}
                Ping heartbeat
              </Button>
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href="/jobs">Open job board</Link>
              </Button>
              {agentId > BigInt(0) && (
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link href={`/agents/${agentId.toString()}`}>View agent profile</Link>
                </Button>
              )}
            </div>
            <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Done</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>Agent listed in AgentRegistry</li>
                <li>Skills advertise HTTP/LLM capabilities</li>
                <li>Bond posted</li>
                <li>Heartbeat proves liveness</li>
              </ul>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
        {log.length > 0 && (
          <div className="max-h-28 overflow-y-auto rounded-lg border border-border bg-background p-2 font-mono text-[10px] text-muted-foreground">
            {log.map((l, i) => (
              <div key={`${i}-${l}`}>{l}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
