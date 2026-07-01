"use client"

import Link from "next/link"
import { Star, ArrowUpRight, Cpu } from "lucide-react"
import { cn, formatRitual, formatRating, getSkillBadgeColor } from "@/lib/utils"
import type { AgentInfo } from "@/lib/constants"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AgentCardProps {
  agent: AgentInfo
  featured?: boolean
  className?: string
}

export function AgentCard({ agent, featured, className }: AgentCardProps) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group block rounded-[var(--radius)] outline-none ring-ring transition-[box-shadow] focus-visible:ring-2"
    >
      <Card
        className={cn(
          "group relative overflow-hidden border-border/70 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]",
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
            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
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
              <h3 className={cn("font-semibold", featured && "text-lg")}>{agent.name}</h3>
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

          <div className="flex items-center justify-between border-t border-border/70 pt-3 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" aria-hidden="true" />
              <span className="font-medium tabular-nums">{formatRating(agent.avgRating)}</span>
              <span className="text-muted-foreground tabular-nums">({agent.jobCount})</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              <span className="text-foreground">{formatRitual(agent.bondAmount)}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
