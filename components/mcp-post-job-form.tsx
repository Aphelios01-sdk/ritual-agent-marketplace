"use client"

import { useState } from "react"
import { Check, Copy, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BUILT_IN_SKILLS } from "@/lib/constants"
import { buildPostJobMcp } from "@/components/mcp-action-panel"
import Link from "next/link"

/** Form that only generates MCP tool calls — never signs on-chain from the browser. */
export function McpPostJobForm() {
  const [prompt, setPrompt] = useState("")
  const [reward, setReward] = useState("0.1")
  const [skillId, setSkillId] = useState<string>(BUILT_IN_SKILLS[0].skillId)
  const [copied, setCopied] = useState(false)

  const example = buildPostJobMcp({ task: prompt || "Your task here", reward, skillId })

  const copy = async () => {
    await navigator.clipboard.writeText(example)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="rounded-lg border border-border p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Post a job (MCP)</h3>
        </div>
        <Link href="/integrate" className="text-xs text-muted-foreground hover:text-foreground">
          Setup MCP
        </Link>
      </div>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Build the tool call, copy it, run via your AI client + <code className="font-mono">pnpm mcp</code>.
        No browser signing.
      </p>
      <div className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Required skill</span>
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none"
          >
            {BUILT_IN_SKILLS.map((s) => (
              <option key={s.skillId} value={s.skillId}>
                {s.name} ({s.precompileType})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Prompt / task</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="e.g. Analyze BTC sentiment from the last 24h"
            className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Reward (RITUAL)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none"
          />
        </label>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-muted/20 p-3 font-mono text-[11px] text-muted-foreground">
          {example}
        </pre>
        <Button type="button" onClick={copy} className="w-full gap-1.5" disabled={!prompt.trim()}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied MCP call" : "Copy MCP call"}
        </Button>
      </div>
    </div>
  )
}
