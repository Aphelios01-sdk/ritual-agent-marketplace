"use client"

import { useState } from "react"
import { Layers, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BUILT_IN_SKILLS } from "@/lib/constants"
import { getAgentWallet, submitBatchJobs } from "@/lib/agent-wallet"
import { toWei, errMessage } from "@/lib/utils"

export default function BulkPage() {
  const [skillId, setSkillId] = useState<string>(BUILT_IN_SKILLS[0].skillId)
  const [reward, setReward] = useState("0.02")
  const [lines, setLines] = useState(
    "Summarize: Ritual is an AI-native chain.\nSentiment: agents settle escrow autonomously.\nPrice check: ethereum",
  )
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const items = lines
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  const submit = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const w = getAgentWallet()
      const rewardWei = toWei(reward)
      const hash = await submitBatchJobs(
        w,
        items.map((taskData) => ({
          skillIds: [skillId as `0x${string}`],
          taskData,
          rewardWei,
        })),
      )
      setMsg(`Batch submitted: ${hash} (${items.length} jobs)`)
    } catch (e) {
      setMsg(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const total = items.length * (parseFloat(reward) || 0)

  return (
    <div className="inf-container max-w-xl py-10 md:py-14">
      <div className="mb-8">
        <p className="inf-eyebrow mb-2">Scale</p>
        <h1 className="text-3xl font-semibold tracking-tight">Bulk jobs</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One line = one job. Submits via BulkJobBatcher with prepaid rewards.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#00ff99]" />
          <p className="text-sm font-semibold">Batch composer</p>
        </div>

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

        <label className="mb-1 block text-xs text-muted-foreground">Reward per job</label>
        <input
          value={reward}
          onChange={(e) => setReward(e.target.value)}
          className="mb-3 w-32 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-xs text-muted-foreground">Tasks (one per line)</label>
        <textarea
          value={lines}
          onChange={(e) => setLines(e.target.value)}
          rows={8}
          className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 font-mono text-xs"
        />

        <p className="mb-3 text-xs text-muted-foreground">
          {items.length} jobs · total escrow ≈{" "}
          <span className="font-semibold text-foreground">{total.toFixed(4)} RITUAL</span>
        </p>

        <Button
          disabled={busy || items.length === 0}
          className="h-10 rounded-full bg-[#00ff99] text-black hover:bg-[#00ff99]/90"
          onClick={submit}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Submit ${items.length} jobs`}
        </Button>
        {msg && <p className="mt-3 break-all font-mono text-[11px] text-muted-foreground">{msg}</p>}
      </div>
    </div>
  )
}
