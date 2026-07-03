"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ArrowLeft, Check, Shield, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import { SkillCard } from "@/components/skill-catalog"
import { BUILT_IN_SKILLS } from "@/lib/constants"

type Step = 1 | 2 | 3

export function CreateAgentFlow() {
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (sid: string) =>
    setSelected((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]))

  const chosen = BUILT_IN_SKILLS.filter((s) => selected.includes(s.skillId))

  const steps = [
    { n: 1 as Step, label: "Agent details", icon: Sparkles },
    { n: 2 as Step, label: "Choose skills", icon: Shield },
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
              <div className={cnBase("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors", active ? "border-primary bg-primary/10 text-primary" : done ? "border-primary/40 text-primary" : "border-border text-muted-foreground")}>
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
                  Define the agent identity. No wallet or gas needed — this builds the agent configuration locally.
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
                <h3 className="text-lg font-semibold">Choose skills</h3>
                <p className="text-sm text-muted-foreground">
                  Select the packages your agent will use. Each card links to its GitHub repo and npm package for installation.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {BUILT_IN_SKILLS.map((s) => (
                  <SkillCard key={s.skillId} skill={s} selected={selected.includes(s.skillId)} onToggle={() => toggle(s.skillId)} />
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button onClick={() => setStep(3)} className="gap-1.5">
                  <Shield className="h-4 w-4" /> Review ({selected.length})
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {step === 3 && (
        <Card className="surface-card border-primary/40">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Agent configuration ready</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                <b className="text-foreground">{name}</b> with {chosen.length} skill{chosen.length === 1 ? "" : "s"}. Install each package, then register them on-chain via <code className="font-mono text-xs">setSkills</code>.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {chosen.map((s) => (
                <SkillCard key={s.skillId} skill={s} selected />
              ))}
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button asChild><Link href="/skills">Full skill catalog</Link></Button>
              <Button variant="outline" asChild><Link href="/">View marketplace</Link></Button>
            </div>

            <CodeBlock className="mt-4" lang="agent" code={`name: ${name}\ndescription: ${description}\nskills: ${chosen.map((s) => s.name).join(", ") || "none"}`} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// local cn to avoid an extra import line in this file
function cnBase(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ")
}
