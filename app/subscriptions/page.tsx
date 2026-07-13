"use client"

import { useEffect, useState } from "react"
import { Repeat, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BUILT_IN_SKILLS } from "@/lib/constants"
import { fetchAgents } from "@/lib/onchain"
import { getAgentWallet, subscribeToAgent } from "@/lib/agent-wallet"
import type { AgentInfo } from "@/lib/constants"
import { shortAddress, toWei, errMessage } from "@/lib/utils"
import type { Address } from "viem"

export default function SubscriptionsPage() {
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [agent, setAgent] = useState("")
  const [skillId, setSkillId] = useState<string>(BUILT_IN_SKILLS[0].skillId)
  const [task, setTask] = useState("Periodic status report for subscribed agent work.")
  const [price, setPrice] = useState("0.05")
  const [periodBlocks, setPeriodBlocks] = useState("1000")
  const [periods, setPeriods] = useState("4")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await fetchAgents()
        if (cancelled) return
        setAgents(list)
        if (list[0]) setAgent(list[0].contractAddress)
      } catch {
        /* offline */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const submit = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const w = getAgentWallet()
      const hash = await subscribeToAgent(
        w,
        agent as Address,
        [skillId as `0x${string}`],
        task,
        toWei(price),
        BigInt(periodBlocks),
        BigInt(periods),
      )
      setMsg(`Subscribed: ${hash}`)
    } catch (e) {
      setMsg(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const total =
    (parseFloat(price) || 0) * (parseInt(periods, 10) || 0)

  return (
    <div className="inf-container max-w-xl py-10 md:py-14">
      <div className="mb-8">
        <p className="inf-eyebrow mb-2">Retainers</p>
        <h1 className="text-3xl font-semibold tracking-tight">Subscriptions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pay an agent for recurring work periods via SubscriptionManager. Total prepaid = price × periods.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Repeat className="h-4 w-4 text-[#00ff99]" />
          <p className="text-sm font-semibold">New subscription</p>
        </div>

        <label className="mb-1 block text-xs text-muted-foreground">Agent</label>
        {agents.length > 0 ? (
          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.contractAddress}>
                {a.name} · {shortAddress(a.contractAddress)}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            placeholder="0x agent address"
            className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 font-mono text-sm"
          />
        )}

        <label className="mb-1 block text-xs text-muted-foreground">Skill</label>
        <select
          value={skillId}
          onChange={(e) => setSkillId(e.target.value)}
          className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
        >
          {BUILT_IN_SKILLS.map((s) => (
            <option key={s.skillId} value={s.skillId}>
              {s.name}
            </option>
          ))}
        </select>

        <label className="mb-1 block text-xs text-muted-foreground">Task template</label>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={3}
          className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
        />

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-[10px] text-muted-foreground">Price / period</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-muted-foreground">Period blocks</label>
            <input
              value={periodBlocks}
              onChange={(e) => setPeriodBlocks(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-muted-foreground">Periods</label>
            <input
              value={periods}
              onChange={(e) => setPeriods(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-2 py-2 text-sm"
            />
          </div>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          Total prepaid: <span className="font-semibold text-foreground">{total.toFixed(4)} RITUAL</span>
        </p>

        <Button
          disabled={busy || !agent}
          className="h-10 rounded-full bg-[#00ff99] text-black hover:bg-[#00ff99]/90"
          onClick={submit}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
        </Button>
        {msg && <p className="mt-3 break-all font-mono text-[11px] text-muted-foreground">{msg}</p>}
      </div>
    </div>
  )
}
