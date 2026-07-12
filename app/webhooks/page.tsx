"use client"

import { useState } from "react"
import { Webhook, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { eventTypeHash, getAgentWallet, registerWebhook } from "@/lib/agent-wallet"
import type { Address } from "viem"

const EVENTS = ["JobRequested", "JobAssigned", "JobCompleted", "BidSubmitted", "JobDisputed"]

export default function WebhooksPage() {
  const [target, setTarget] = useState("")
  const [selector, setSelector] = useState("0x00000000")
  const [selected, setSelected] = useState<string[]>(["JobAssigned", "JobCompleted"])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const toggle = (e: string) => {
    setSelected((s) => (s.includes(e) ? s.filter((x) => x !== e) : [...s, e]))
  }

  const submit = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const w = getAgentWallet()
      const sel = (selector.startsWith("0x") ? selector : `0x${selector}`) as `0x${string}`
      const hash = await registerWebhook(
        w,
        target as Address,
        sel.padEnd(10, "0").slice(0, 10) as `0x${string}`,
        selected.map(eventTypeHash),
      )
      setMsg(`Webhook registered: ${hash}`)
    } catch (e: any) {
      setMsg(e?.shortMessage || e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inf-container max-w-xl py-10 md:py-14">
      <div className="mb-8">
        <p className="inf-eyebrow mb-2">Automation</p>
        <h1 className="text-3xl font-semibold tracking-tight">Webhooks</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Register on-chain callback targets for job lifecycle events via WebhookRegistry.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Webhook className="h-4 w-4 text-[#00ff99]" />
          <p className="text-sm font-semibold">Register webhook</p>
        </div>

        <label className="mb-1 block text-xs text-muted-foreground">Target contract address</label>
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="0x…"
          className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 font-mono text-sm"
        />

        <label className="mb-1 block text-xs text-muted-foreground">Selector (bytes4)</label>
        <input
          value={selector}
          onChange={(e) => setSelector(e.target.value)}
          className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 font-mono text-sm"
        />

        <p className="mb-2 text-xs text-muted-foreground">Event types</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {EVENTS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => toggle(e)}
              className={`rounded-full border px-3 py-1 text-[11px] ${
                selected.includes(e)
                  ? "border-[#00ff99]/40 bg-[#00ff99]/10 text-[#00ff99]"
                  : "border-border/60 text-muted-foreground"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <Button
          disabled={busy || !target || selected.length === 0}
          className="h-10 rounded-full bg-[#00ff99] text-black hover:bg-[#00ff99]/90"
          onClick={submit}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register"}
        </Button>
        {msg && <p className="mt-3 break-all font-mono text-[11px] text-muted-foreground">{msg}</p>}
      </div>
    </div>
  )
}
