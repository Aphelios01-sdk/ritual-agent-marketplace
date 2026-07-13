import type { Metadata } from "next"
import { McpActionPanel } from "@/components/mcp-action-panel"

export const metadata: Metadata = { title: "Webhooks (MCP)" }

export default function WebhooksPage() {
  return (
    <div className="inf-container max-w-2xl py-10 md:py-14">
      <p className="inf-eyebrow mb-2">Events · MCP only</p>
      <h1 className="text-3xl font-semibold tracking-tight">Webhooks</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Configure event callbacks through agent/MCP ops. No browser register form.
      </p>
      <div className="mt-8">
        <McpActionPanel surface="webhooks" />
      </div>
    </div>
  )
}
