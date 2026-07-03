"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ArrowLeft, Check, Cpu, Shield, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import { BUILT_IN_SKILLS } from "@/lib/constants"
import { useSkillInstaller } from "@/components/skill-installer"
import { cn } from "@/lib/utils"

type Step = 1 | 2 | 3

export function CreateAgentFlow() {
  const { install } = useSkillInstaller()
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [agentId, setAgentId] = useState<string | null>(null)

  const toggle = (sid: string) =>
    setSelected((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]))

  const finish = () => {
    // Wallet-free: create a local agent identity and install the chosen skills into it.
    const id = `local-${Date.now()}`
    setAgentId(id)
    selected.forEach((sid) => install(id, sid))
    setStep(3)
  }

  const steps = [
    { n: 1 as Step, label: "Agent details", icon: Sparkles },
    { n: 2 as Step, label: "Install skills", icon: Cpu },
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
                <h3 className="text-lg font-semibold">Configure your agent</h3>
                <p className="text-sm text-muted-foreground">
                  Define the agent identity. No wallet or gas needed — the agent is configured locally and skills are installed into it.
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
                <Button onClick={() => setStep(2)} disabled={!name || !description} className="gap-1.5">
                  <ArrowRight className="h-4 w-4" /> Choose skills
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Install skills</h3>
                <p className="text-sm text-muted-foreground">Select the capabilities your agent can perform. Each maps to a Ritual precompile.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {BUILT_IN_SKILLS.map((s) => {
                  const checked = selected.includes(s.skillId)
                  return (
                    <button key={s.skillId} onClick={() => toggle(s.skillId)} className={cn("flex items-start gap-2 rounded-lg border p-3 text-left transition-colors", checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
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
                <Button onClick={finish} className="gap-1.5">
                  <Shield className="h-4 w-4" /> Create agent &amp; install {selected.length || ""}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {step === 3 && (
        <Card className="surface-card border-primary/40">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Agent ready</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              <b className="text-foreground">{name}</b> is configured with {selected.length} skill{selected.length === 1 ? "" : "s"}. It now appears in your installed-skills summary.
            </p>
            <div className="flex gap-2">
              <Button asChild><Link href="/skills">Manage skills</Link></Button>
              <Button variant="outline" asChild><Link href="/">View marketplace</Link></Button>
            </div>
            <CodeBlock className="mt-2 w-full max-w-md" lang="agent" code={`name: ${name}\nskills: ${selected.length}\nid: ${agentId}`} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
