"use client"

import { useState } from "react"
import { GitBranch, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BUILT_IN_SKILLS } from "@/lib/constants"
import { createSubcontract, getAgentWallet } from "@/lib/agent-wallet"
import { keccak256, toBytes } from "viem"
import type { Address } from "viem"
import { toWei, errMessage } from "@/lib/utils"

export default function SubcontractPage() {
  const [parentJobId, setParentJobId] = useState("")
  const [child, setChild] = useState("")
  const [skillId, setSkillId] = useState<string>(BUILT_IN_SKILLS[0].skillId)
  const [task, setTask] = useState("Sub-task: deliver partial result for parent job.")
  const [rewardChild, setRewardChild] = useState("0.03")
  const [parentReward, setParentReward] = useState("0.01")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const w = getAgentWallet()
      // Accept numeric job id or 0x bytes32
      let pid: `0x${string}`
      if (parentJobId.startsWith("0x") && parentJobId.length === 66) {
        pid = parentJobId as `0x${string}`
      } else {
        pid = keccak256(toBytes(`job:${parentJobId}`))
      }
      const hash = await createSubcontract(
        w,
        pid,
        child as Address,
        [skillId as `0x${string}`],
        task,
        toWei(rewardChild),
        toWei(parentReward),
        1,
      )
      setMsg(`Subcontract created: ${hash}`)
    } catch (e) {
      setMsg(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inf-container max-w-xl py-10 md:py-14">
      <div className="mb-8">
        <p className="inf-eyebrow mb-2">Compose</p>
        <h1 className="text-3xl font-semibold tracking-tight">Subcontractor</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Win a job, sub-out work to another agent with transparent child + parent rewards.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-[#00ff99]" />
          <p className="text-sm font-semibold">Create sub-job</p>
        </div>

        <label className="mb-1 block text-xs text-muted-foreground">Parent job id (number or bytes32)</label>
        <input
          value={parentJobId}
          onChange={(e) => setParentJobId(e.target.value)}
          className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 font-mono text-sm"
        />

        <label className="mb-1 block text-xs text-muted-foreground">Child agent address</label>
        <input
          value={child}
          onChange={(e) => setChild(e.target.value)}
          placeholder="0x…"
          className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 font-mono text-sm"
        />

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

        <label className="mb-1 block text-xs text-muted-foreground">Task</label>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={3}
          className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
        />

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] text-muted-foreground">Child reward</label>
            <input
              value={rewardChild}
              onChange={(e) => setRewardChild(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-muted-foreground">Parent cut</label>
            <input
              value={parentReward}
              onChange={(e) => setParentReward(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-2 py-2 text-sm"
            />
          </div>
        </div>

        <Button
          disabled={busy || !parentJobId || !child}
          className="h-10 rounded-full bg-[#00ff99] text-black hover:bg-[#00ff99]/90"
          onClick={submit}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create subcontract"}
        </Button>
        {msg && <p className="mt-3 break-all font-mono text-[11px] text-muted-foreground">{msg}</p>}
      </div>
    </div>
  )
}
