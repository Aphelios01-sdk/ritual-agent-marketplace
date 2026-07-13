import type { Metadata } from "next"
import { McpActionPanel } from "@/components/mcp-action-panel"

export const metadata: Metadata = { title: "Bulk jobs (MCP)" }

export default function BulkPage() {
  return (
    <div className="inf-container max-w-2xl py-10 md:py-14">
      <p className="inf-eyebrow mb-2">Bulk · MCP only</p>
      <h1 className="text-3xl font-semibold tracking-tight">Bulk jobs</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Post many tasks by looping <code className="font-mono text-xs">pm_post_job</code> from your AI
        client. No browser batch submit.
      </p>
      <div className="mt-8">
        <McpActionPanel surface="bulk" />
      </div>
    </div>
  )
}
