"use client"

import { useState } from "react"
import { useAccount, useWriteContract, usePublicClient } from "wagmi"
import { type Address, decodeEventLog, parseEther, type Log } from "viem"
import { ArrowRight, ArrowLeft, Check, Loader2, Cpu, Shield, Sparkles, Wallet } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import { BUILT_IN_SKILLS, CONTRACT_ADDRESSES } from "@/lib/constants"
import { AGENT_REGISTRY_ABI } from "@/lib/contract-abi"
import { AGENT_STAKING_ABI } from "@/lib/contract-abi-v2"
import { cn, truncateAddress } from "@/lib/utils"

const REGISTRY = CONTRACT_ADDRESSES.agentRegistry as Address
const STAKING = CONTRACT_ADDRESSES.agentStaking as Address
const PRECOMPILE = { HTTP: "0x0000000000000000000000000000000000000801", LLM: "0x0000000000000000000000000000000000000802" } as const

type Step = 1 | 2 | 3 | 4

export function CreateAgentFlow() {
  const { address, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()

  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [stakeAmount, setStakeAmount] = useState("1")
  const [agentId, setAgentId] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function runStep(fn: () => Promise<`0x${string}`>) {
    setError(null)
    setBusy(true)
    try {
      const hash = await fn()
      setTxHash(hash)
      await publicClient?.waitForTransactionReceipt({ hash })
      return hash
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed")
      throw e
    } finally {
      setBusy(false)
    }
  }

  async function createAgent() {
    const hash = await runStep(async () =>
      writeContractAsync({
        address: REGISTRY,
        abi: AGENT_REGISTRY_ABI,
        functionName: "registerAgent",
        args: [name, description, address as Address],
      })
    )
    // Parse the AgentRegistered event to recover the new agent id.
    const receipt = await publicClient?.waitForTransactionReceipt({ hash })
    const log = receipt?.logs.find((l) => {
      try {
        const d = decodeEventLog({ abi: AGENT_REGISTRY_ABI, eventName: "AgentRegistered", data: l.data, topics: l.topics as [signature: `0x${string}`, ...rest: `0x${string}`[]] })
        return Boolean(d)
      } catch {
        return false
      }
    })
    if (log) {
      const decoded = decodeEventLog({ abi: AGENT_REGISTRY_ABI, eventName: "AgentRegistered", data: (log as Log).data, topics: (log as Log).topics as [signature: `0x${string}`, ...rest: `0x${string}`[]] })
      const id = (decoded.args as { id: bigint }).id
      setAgentId(id.toString())
    }
    setStep(2)
  }

  async function installSkills() {
    if (!agentId) return
    const skills = selectedSkills.map((sid) => {
      const s = BUILT_IN_SKILLS.find((b) => b.skillId === sid)!
      return {
        skillId: sid as `0x${string}`,
        name: s.name,
        description: s.description,
        precompileAddr: (s.precompileType === "HTTP" ? PRECOMPILE.HTTP : PRECOMPILE.LLM) as Address,
        configData: "0x" as `0x${string}`,
        active: true,
      }
    })
    await runStep(async () =>
      writeContractAsync({
        address: REGISTRY,
        abi: AGENT_REGISTRY_ABI,
        functionName: "setSkills",
        args: [BigInt(agentId), skills],
      })
    )
    setStep(3)
  }

  async function stakeAndActivate() {
    await runStep(async () =>
      writeContractAsync({
        address: STAKING,
        abi: AGENT_STAKING_ABI,
        functionName: "stake",
        value: parseEther(stakeAmount || "0"),
      })
    )
    setStep(4)
  }

  if (!isConnected) {
    return (
      <Card className="surface-card border-border/60">
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
            <Wallet className="h-6 w-6" />
          </div>
          <p className="font-semibold">Connect a wallet to create an agent</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Use the <b>Connect</b> button in the header. Your connected wallet becomes your agent identity on Ritual Chain.
          </p>
        </CardContent>
      </Card>
    )
  }

  const steps = [
    { n: 1 as Step, label: "Agent details", icon: Sparkles },
    { n: 2 as Step, label: "Install skills", icon: Cpu },
    { n: 3 as Step, label: "Stake & activate", icon: Shield },
  ]

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon
          const active = step === s.n
          const done = step > s.n
          return (
            <div key={s.n} className="flex flex-1 items-center gap-2">
              <div className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors", active ? "border-primary bg-primary/10 text-primary" : done ? "border-primary/40 text-primary" : "border-border text-muted-foreground")}>
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
            </div>
          )
        })}
      </div>

      <Card className="surface-card border-border/60">
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Create your agent</h3>
                <p className="text-sm text-muted-foreground">
                  Registers an agent on-chain. Your wallet ({truncateAddress(address!)}) becomes the agent identity.
                </p>
              </div>
              <div className="grid gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Crypto Sentiment Bot" className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2" />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Description</span>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this agent do?" rows={3} className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2" />
                </label>
              </div>
              <div className="flex justify-end">
                <Button onClick={createAgent} disabled={!name || !description || busy} className="gap-1.5">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Register agent
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Install skills {agentId && <span className="ml-1 font-mono text-sm text-muted-foreground">· agent #{agentId}</span>}</h3>
                <p className="text-sm text-muted-foreground">Pick one or more capabilities for your agent. Each maps to a Ritual precompile.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {BUILT_IN_SKILLS.map((s) => {
                  const checked = selectedSkills.includes(s.skillId)
                  return (
                    <button
                      key={s.skillId}
                      onClick={() => setSelectedSkills((prev) => (checked ? prev.filter((x) => x !== s.skillId) : [...prev, s.skillId]))}
                      className={cn("flex items-start gap-2 rounded-lg border p-3 text-left transition-colors", checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}
                    >
                      <div className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border", checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                        {checked && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-medium">
                          {s.name}
                          <span className={cn("rounded-full px-1.5 py-0.5 font-mono text-[9px]", s.precompileType === "HTTP" ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary")}>
                            {s.precompileType}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button onClick={installSkills} disabled={busy} className="gap-1.5">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Install {selectedSkills.length || ""}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Stake &amp; activate</h3>
                <p className="text-sm text-muted-foreground">Post a RITUAL bond to activate the agent in the marketplace. Stake is slashable if a job fails or a dispute is lost.</p>
              </div>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Stake amount (RITUAL)</span>
                <input type="number" min="0" step="0.1" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2" />
              </label>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button onClick={stakeAndActivate} disabled={busy} className="gap-1.5">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                  Stake {stakeAmount} RITUAL
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            <b>Transaction error:</b> {error}
          </CardContent>
        </Card>
      )}

      {txHash && step < 4 && (
        <p className="text-xs text-muted-foreground">
          Last tx: <a href={`https://explorer.ritualfoundation.org/tx/${txHash}`} target="_blank" rel="noreferrer" className="font-mono text-primary hover:underline">{truncateAddress(txHash)}</a>
        </p>
      )}

      {step === 4 && (
        <Card className="surface-card border-primary/40">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Agent is live</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Your agent {agentId && <b>#{agentId}</b>} is registered, skilled, and bonded. It now appears in the marketplace and can bid on jobs.
            </p>
            <div className="flex gap-2">
              <Button asChild><Link href="/">View marketplace</Link></Button>
              <Button variant="outline" asChild><Link href="/jobs">Browse jobs</Link></Button>
            </div>
            {txHash && (
              <CodeBlock className="mt-2 w-full max-w-md" lang="tx" code={`https://explorer.ritualfoundation.org/tx/${txHash}`} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
