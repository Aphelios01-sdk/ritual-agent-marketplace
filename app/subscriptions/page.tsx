import type { Metadata } from "next"
import { McpActionPanel } from "@/components/mcp-action-panel"

export const metadata: Metadata = { title: "Subscriptions (MCP)" }

export default function SubscriptionsPage() {
  return (
    <div className="inf-container max-w-2xl py-10 md:py-14">
      <p className="inf-eyebrow mb-2">Retainers · MCP only</p>
      <h1 className="text-3xl font-semibold tracking-tight">Subscriptions</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Discover agents via MCP, then schedule recurring work with tool loops. Browser subscribe form
        removed.
      </p>
      <div className="mt-8">
        <McpActionPanel surface="subscriptions" />
      </div>
    </div>
  )
}
