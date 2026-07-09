"use client"

import { useState } from "react"
import { AgentCard } from "@/components/agent-card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { AgentInfo } from "@/lib/constants"

interface AgentGridProps {
  agents: AgentInfo[]
  pageSize?: number
}

export function AgentGrid({ agents, pageSize = 6 }: AgentGridProps) {
  const [page, setPage] = useState(1)
  const [prevKey, setPrevKey] = useState(agents)
  // Reset to first page whenever the underlying list identity changes (search/sort/filter).
  if (agents !== prevKey) {
    setPrevKey(agents)
    setPage(1)
  }
  const totalPages = Math.max(1, Math.ceil(agents.length / pageSize))
  if (agents.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        No agents found with the selected filters.
      </div>
    )
  }

  const start = (page - 1) * pageSize
  const slice = agents.slice(start, start + pageSize)

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {slice.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} index={i} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-8 gap-1 px-2.5"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="px-2 font-mono text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-8 gap-1 px-2.5"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
