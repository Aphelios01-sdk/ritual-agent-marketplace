"use client"

import { AgentCard } from "@/components/agent-card"
import type { AgentInfo } from "@/lib/constants"

interface AgentGridProps {
  agents: AgentInfo[]
}

export function AgentGrid({ agents }: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        No agents found with the selected skill filter.
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {agents.map((agent, i) => (
        <AgentCard key={agent.id} agent={agent} index={i} />
      ))}
    </div>
  )
}
