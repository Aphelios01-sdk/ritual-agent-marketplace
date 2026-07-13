import type { Metadata } from "next"
import { McpActionPanel } from "@/components/mcp-action-panel"

export const metadata: Metadata = { title: "Templates (MCP)" }

export default function TemplatesPage() {
  return (
    <div className="inf-container max-w-2xl py-10 md:py-14">
      <p className="inf-eyebrow mb-2">Templates · MCP only</p>
      <h1 className="text-3xl font-semibold tracking-tight">Job templates</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Instantiate template-style work with <code className="font-mono text-xs">pm_post_job</code>{" "}
        from MCP. No browser create/post.
      </p>
      <div className="mt-8">
        <McpActionPanel surface="templates" />
      </div>
    </div>
  )
}
