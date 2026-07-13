"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Copy, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MCP_TOOLS_BY_SURFACE, fillJobId, type McpToolRef } from "@/lib/mcp-actions"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n/context"

type Props = {
  /** Key into MCP_TOOLS_BY_SURFACE */
  surface: string
  title?: string
  description?: string
  /** Replace JOB_ID placeholder in examples */
  jobId?: string
  /** Extra tools appended */
  extra?: McpToolRef[]
  className?: string
  compact?: boolean
}

/**
 * Replaces browser write UIs: shows MCP tools + copyable examples.
 */
export function McpActionPanel({
  surface,
  title,
  description,
  jobId,
  extra = [],
  className,
  compact,
}: Props) {
  const t = useT()
  const resolvedTitle = title ?? t.mcp.actionsTitle
  const resolvedDesc = description ?? t.mcp.actionsBody
  const base = MCP_TOOLS_BY_SURFACE[surface] || []
  const tools = [...base, ...extra].map((tool) =>
    jobId ? { ...tool, example: fillJobId(tool.example, jobId) } : tool,
  )
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1200)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={cn("rounded-lg border border-border p-4 sm:p-5", className)}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <Terminal className="h-3 w-3" /> {t.mcp.only}
          </p>
          <h3 className={cn("font-semibold", compact ? "text-sm" : "text-base")}>{resolvedTitle}</h3>
          {!compact && <p className="mt-0.5 text-xs text-muted-foreground">{resolvedDesc}</p>}
        </div>
        <Button asChild size="sm" variant="outline" className="h-8 shrink-0 text-xs">
          <Link href="/integrate">{t.mcp.setup}</Link>
        </Button>
      </div>

      <ul className="space-y-2">
        {tools.map((tool) => (
          <li
            key={tool.name + tool.example.slice(0, 24)}
            className="rounded-md border border-border/80 bg-background p-2.5"
          >
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-xs font-medium">{tool.name}</code>
                {tool.role && tool.role !== "any" && (
                  <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted-foreground">
                    {tool.role}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => copy(tool.name, tool.example)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {copied === tool.name ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === tool.name ? t.common.copied : t.common.copy}
              </button>
            </div>
            <p className="mb-1.5 text-[11px] text-muted-foreground">{tool.desc}</p>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded border border-border/60 bg-muted/20 p-2 font-mono text-[10px] text-muted-foreground">
              {tool.example}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Build a post-job MCP example from form fields (still no chain write). */
export function buildPostJobMcp(opts: {
  task: string
  reward: string
  skillId: string
}): string {
  const task = opts.task.replace(/"/g, '\\"')
  return `pm_post_job task="${task}" reward="${opts.reward || "0.1"}" skill_ids=["${opts.skillId}"]`
}
