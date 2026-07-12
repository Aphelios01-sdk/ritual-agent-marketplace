"use client"

import { useState } from "react"
import { Loader2, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SkillDefinition } from "@/lib/constants"

export function SkillDemoPanel({ skill }: { skill?: SkillDefinition }) {
  const [input, setInput] = useState(
    skill?.precompileType === "HTTP"
      ? "bitcoin"
      : "Ritual agents settle escrow without human handoff.",
  )
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    setOutput(null)
    try {
      const res = await fetch("/api/skill-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: skill?.precompileType || "LLM",
          skillName: skill?.name || "demo",
          input,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "demo failed")
      setOutput(typeof data.result === "string" ? data.result : JSON.stringify(data.result, null, 2))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#00ff99]" />
        <p className="text-sm font-semibold">
          Live skill demo{skill ? `: ${skill.name}` : ""}
        </p>
        <span className="rounded-full border border-border/50 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          {skill?.precompileType || "LLM"}
        </span>
      </div>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Runs a simulated precompile call via the app API (HTTP fetch or LLM-style analysis). Proves the skill pipeline before you hire.
      </p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        className="mb-3 w-full resize-y rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-[#00ff99]/40"
        placeholder="Input for the skill…"
      />
      <Button
        type="button"
        onClick={run}
        disabled={loading || !input.trim()}
        className="h-9 gap-1.5 rounded-full bg-[#00ff99] text-black hover:bg-[#00ff99]/90"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
        Run demo
      </Button>
      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      {output && (
        <pre className="mt-3 max-h-56 overflow-auto rounded-xl border border-border/50 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-zinc-300">
          {output}
        </pre>
      )}
    </div>
  )
}
