"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { Check, Cpu, Download, Sparkles, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BUILT_IN_SKILLS, type AgentInfo, type SkillDefinition } from "@/lib/constants"
import { cn } from "@/lib/utils"

// ── Store: which skills are installed into which agent (local, wallet-free) ──

interface InstallState {
  [agentId: string]: string[] // skillIds
}

const STORAGE_KEY = "prompt-market:skill-installs"

interface SkillInstallerCtx {
  installed: InstallState
  install: (agentId: string, skillId: string) => void
  uninstall: (agentId: string, skillId: string) => void
  isInstalled: (agentId: string, skillId: string) => boolean
}

const Ctx = createContext<SkillInstallerCtx | null>(null)

function load(): InstallState {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  } catch {
    return {}
  }
}

export function SkillInstallerProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState<InstallState>(() => load())

  const install = useCallback((agentId: string, skillId: string) => {
    setInstalled((prev) => {
      const cur = prev[agentId] ?? []
      if (cur.includes(skillId)) return prev
      const next = { ...prev, [agentId]: [...cur, skillId] }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const uninstall = useCallback((agentId: string, skillId: string) => {
    setInstalled((prev) => {
      const cur = prev[agentId] ?? []
      const next = { ...prev, [agentId]: cur.filter((s) => s !== skillId) }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const isInstalled = useCallback(
    (agentId: string, skillId: string) => (installed[agentId] ?? []).includes(skillId),
    [installed],
  )

  return (
    <Ctx.Provider value={{ installed, install, uninstall, isInstalled }}>{children}</Ctx.Provider>
  )
}

export function useSkillInstaller() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useSkillInstaller must be used within SkillInstallerProvider")
  return ctx
}

// ── Single skill installer row: pick an agent + install/uninstall ──

export function SkillInstallerRow({ skill, agents }: { skill: SkillDefinition; agents: AgentInfo[] }) {
  const { isInstalled, install, uninstall } = useSkillInstaller()
  const [agentId, setAgentId] = useState<string>(agents[0]?.id ?? "")
  const [flash, setFlash] = useState(false)

  const installedAgents = agents.filter((a) => isInstalled(a.id, skill.skillId))
  const installedInSelected = agentId ? isInstalled(agentId, skill.skillId) : false

  const handleToggle = () => {
    if (!agentId) return
    if (installedInSelected) {
      uninstall(agentId, skill.skillId)
    } else {
      install(agentId, skill.skillId)
      setFlash(true)
      setTimeout(() => setFlash(false), 900)
    }
  }

  const tone = skill.precompileType === "HTTP" ? "blue" : "primary"

  return (
    <Card className={cn("surface-card sheen border-border/60 transition-all", flash && "border-primary/60")}>
      <CardContent className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", tone === "primary" ? "border-primary/25 bg-primary/10 text-primary" : "border-blue-500/25 bg-blue-500/10 text-blue-500")}>
              <Cpu className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="font-semibold leading-tight">{skill.name}</p>
              <span className={cn("rounded-full px-1.5 py-0.5 font-mono text-[9px]", tone === "primary" ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-500")}>
                {skill.precompileType}
              </span>
            </div>
          </div>
          {skill.active ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">
              <Check className="h-2.5 w-2.5" /> available
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">inactive</span>
          )}
        </div>

        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{skill.description}</p>

        {installedAgents.length > 0 && (
          <p className="mb-2 text-[11px] text-muted-foreground">
            Installed into {installedAgents.length} agent{installedAgents.length === 1 ? "" : "s"}:{" "}
            <span className="font-mono text-foreground">{installedAgents.map((a) => a.name).join(", ")}</span>
          </p>
        )}

        <div className="flex items-center gap-2">
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            disabled={agents.length === 0}
            className="min-w-0 flex-1 cursor-pointer rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-xs outline-none ring-ring focus-visible:ring-2 disabled:opacity-50"
          >
            {agents.length === 0 && <option>No agents available</option>}
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={handleToggle}
            disabled={agents.length === 0}
            variant={installedInSelected ? "outline" : "default"}
            className={cn("h-8 gap-1.5", installedInSelected && "border-red-500/40 text-red-500 hover:bg-red-500/10")}
          >
            {installedInSelected ? <X className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
            {installedInSelected ? "Uninstall" : "Install"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Full skill catalog (covers all available features) ──

export function SkillCatalog({ agents }: { agents: AgentInfo[] }) {
  const http = BUILT_IN_SKILLS.filter((s) => s.precompileType === "HTTP")
  const llm = BUILT_IN_SKILLS.filter((s) => s.precompileType === "LLM")

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">HTTP precompile skills</h3>
          <span className="font-mono text-[10px] text-muted-foreground">0x…0801</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {http.map((s) => (
            <SkillInstallerRow key={s.skillId} skill={s} agents={agents} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">LLM precompile skills</h3>
          <span className="font-mono text-[10px] text-muted-foreground">0x…0802</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {llm.map((s) => (
            <SkillInstallerRow key={s.skillId} skill={s} agents={agents} />
          ))}
        </div>
      </section>
    </div>
  )
}

// ── Summary of installed skills for the dashboard ──

export function InstalledSkillsSummary({ agents }: { agents: AgentInfo[] }) {
  const { installed } = useSkillInstaller()
  const total = Object.values(installed).reduce((s, arr) => s + arr.length, 0)

  if (total === 0) {
    return (
      <Card className="surface-card border-border/60">
        <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
          <Download className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm font-medium">No skills installed yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Browse the skill catalog and install capabilities into your agents — no wallet required.
          </p>
          <Button asChild size="sm" className="mt-1"><a href="/skills">Open skill catalog</a></Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="surface-card border-border/60">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">My installed skills</h3>
          <span className="text-xs text-muted-foreground">{total} install{total === 1 ? "" : "s"}</span>
        </div>
        <div className="space-y-2">
          {Object.entries(installed).flatMap(([agentId, skills]) =>
            skills.map((sid) => {
              const agent = agents.find((a) => a.id === agentId)
              const skill = BUILT_IN_SKILLS.find((s) => s.skillId === sid)
              if (!agent || !skill) return null
              return (
                <div key={`${agentId}-${sid}`} className="flex items-center gap-2 rounded-lg border border-border/60 p-2 text-xs">
                  <span className={cn("rounded-full px-1.5 py-0.5 font-mono text-[9px]", skill.precompileType === "HTTP" ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary")}>
                    {skill.precompileType}
                  </span>
                  <span className="font-medium">{skill.name}</span>
                  <span className="ml-auto truncate text-muted-foreground">→ {agent.name}</span>
                </div>
              )
            }),
          )}
        </div>
      </CardContent>
    </Card>
  )
}
