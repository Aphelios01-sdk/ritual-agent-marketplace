"use client"

import Link from "next/link"
import { Star, Cpu, BadgeCheck, Zap } from "lucide-react"
import { cn, formatRitual, formatRating, getSkillBadgeColor } from "@/lib/utils"
import type { AgentInfo } from "@/lib/constants"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AgentCardProps {
  agent: AgentInfo
  featured?: boolean
  index?: number
  className?: string
}

// Derived trust signals from on-chain data.
function trustInfo(agent: AgentInfo) {
  const verified = agent.jobCount >= 10 && agent.avgRating >= 4
  const trending = agent.jobCount >= 80
  return { verified, trending }
}

export function AgentCard({ agent, featured, index = 0, className }: AgentCardProps) {
  const { verified, trending } = trustInfo(agent)
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group block rounded-[var(--radius)] outline-none ring-ring transition-[box-shadow] focus-visible:ring-2 animate-fade-up"
      style={{ animationDelay: "0ms" }}
    >
      <Card
        className={cn(
          "surface-card sheen group relative overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_-18px_color-mix(in_oklch,var(--color-primary)_40%,transparent)] active:scale-[0.99]",
          featured && "md:col-span-2 md:row-span-2",
          className
        )}
      >
        <CardContent className={cn("flex h-full flex-col justify-between p-5", featured && "p-6")}>
          <div className="mb-4 flex items-start justify-between">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-primary/10 font-mono text-primary",
                featured && "h-12 w-12"
              )}
            >
              <span className={cn("text-sm font-bold", featured && "text-base")}>
                {agent.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">#{agent.id.padStart(3, "0")}</span>
          </div>

          <div className="flex-1">
            <div className="mb-1 flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  agent.active ? "bg-primary" : "bg-muted-foreground/50"
                )}
                aria-label={agent.active ? "Active" : "Inactive"}
              />
              <h3 className={cn("font-semibold leading-tight", featured && "text-lg")}>{agent.name}</h3>
              {verified && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
              )}
              {trending && (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-primary">
                  <Zap className="h-2.5 w-2.5" />TRENDING
                </span>
              )}
            </div>
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{agent.description}</p>

            {/* Skills */}
            <div className="mb-3 flex flex-wrap gap-1">
              {agent.skills.slice(0, 3).map((skill) => (
                <Badge key={skill.skillId} className={cn(getSkillBadgeColor(skill.precompileType), "gap-1 text-[10px]")}>
                  <Cpu className="h-2.5 w-2.5" />
                  {skill.name}
                </Badge>
              ))}
              {agent.skills.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{agent.skills.length - 3}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rating</p>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" aria-hidden="true" />
                <span className="font-medium tabular-nums">{formatRating(agent.avgRating)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">({agent.jobCount})</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bond</p>
              <p className="font-mono text-xs font-medium tabular-nums">{formatRitual(agent.bondAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Earned</p>
              <p className="font-mono text-xs font-medium tabular-nums">{formatRitual(agent.totalEarnings)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
