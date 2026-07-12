"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, Loader2, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BUILT_IN_SKILLS } from "@/lib/constants"
import { createTemplate, getAgentWallet, postJob } from "@/lib/agent-wallet"

const PRESETS = [
  {
    name: "Summarize URL",
    skillId: BUILT_IN_SKILLS.find((s) => s.name === "summarize-article")?.skillId || BUILT_IN_SKILLS[0].skillId,
    task: "Summarize the following content into 5 bullet points:\n\n",
    reward: "0.05",
  },
  {
    name: "Token price check",
    skillId: BUILT_IN_SKILLS.find((s) => s.name === "fetch-token-price")?.skillId || BUILT_IN_SKILLS[0].skillId,
    task: "Fetch USD price for: bitcoin",
    reward: "0.02",
  },
  {
    name: "Sentiment scan",
    skillId: BUILT_IN_SKILLS.find((s) => s.name === "sentiment-analysis")?.skillId || BUILT_IN_SKILLS[1]?.skillId || BUILT_IN_SKILLS[0].skillId,
    task: "Analyze sentiment of: ",
    reward: "0.05",
  },
  {
    name: "Code review",
    skillId: BUILT_IN_SKILLS.find((s) => s.name === "code-review")?.skillId || BUILT_IN_SKILLS[0].skillId,
    task: "Review this code for bugs and security issues:\n\n",
    reward: "0.1",
  },
]

export default function TemplatesPage() {
  const [name, setName] = useState("My template")
  const [task, setTask] = useState(PRESETS[0].task)
  const [skillId, setSkillId] = useState<string>(PRESETS[0].skillId)
  const [reward, setReward] = useState(PRESETS[0].reward)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const apply = (p: (typeof PRESETS)[0]) => {
    setName(p.name)
    setTask(p.task)
    setSkillId(p.skillId)
    setReward(p.reward)
  }

  const saveOnChain = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const w = getAgentWallet()
      const hash = await createTemplate(
        w,
        name,
        [skillId as `0x${string}`],
        task,
        BigInt(Math.floor(parseFloat(reward) * 1e18)),
      )
      setMsg(`Template tx: ${hash}`)
    } catch (e: any) {
      setMsg(e?.shortMessage || e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const postNow = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const w = getAgentWallet()
      const hash = await postJob(
        w,
        [skillId as `0x${string}`],
        task,
        BigInt(Math.floor(parseFloat(reward) * 1e18)),
      )
      setMsg(`Job posted: ${hash}`)
    } catch (e: any) {
      setMsg(e?.shortMessage || e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inf-container py-10 md:py-14">
      <div className="mb-8 max-w-2xl">
        <p className="inf-eyebrow mb-2">Templates</p>
        <h1 className="text-3xl font-semibold tracking-tight">Job templates</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One-click starters. Save on-chain via JobTemplates or post immediately to JobMarketV2.
        </p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => apply(p)}
            className="okx-card-lift rounded-2xl border border-border/60 bg-card/40 p-4 text-left hover:border-[#00ff99]/30"
          >
            <FileText className="mb-2 h-4 w-4 text-[#00ff99]" />
            <p className="text-sm font-semibold">{p.name}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{p.reward} RITUAL default</p>
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-xl rounded-2xl border border-border/60 bg-card/40 p-5">
        <label className="mb-1 block text-xs text-muted-foreground">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
        />
        <label className="mb-1 block text-xs text-muted-foreground">Skill</label>
        <select
          value={skillId}
          onChange={(e) => setSkillId(e.target.value)}
          className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
        >
          {BUILT_IN_SKILLS.map((s) => (
            <option key={s.skillId} value={s.skillId}>
              {s.name} ({s.precompileType})
            </option>
          ))}
        </select>
        <label className="mb-1 block text-xs text-muted-foreground">Task data</label>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={5}
          className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
        />
        <label className="mb-1 block text-xs text-muted-foreground">Reward (RITUAL)</label>
        <input
          value={reward}
          onChange={(e) => setReward(e.target.value)}
          className="mb-4 w-32 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy}
            className="h-10 gap-1.5 rounded-full bg-[#00ff99] text-black hover:bg-[#00ff99]/90"
            onClick={postNow}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Post job now
          </Button>
          <Button disabled={busy} variant="outline" className="h-10 rounded-full" onClick={saveOnChain}>
            Save template on-chain
          </Button>
          <Button asChild variant="ghost" className="h-10 rounded-full">
            <Link href="/jobs">Open board</Link>
          </Button>
        </div>
        {msg && <p className="mt-3 break-all font-mono text-[11px] text-muted-foreground">{msg}</p>}
      </div>
    </div>
  )
}
