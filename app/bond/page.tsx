import type { Metadata } from "next"
import { McpActionPanel } from "@/components/mcp-action-panel"
import { CONTRACT_ADDRESSES } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Bond & stake (MCP)",
  description: "Stake and heartbeat exclusively via Prompt Market MCP tools.",
}

export default function BondPage() {
  return (
    <div className="inf-container max-w-2xl py-10 md:py-14">
      <p className="inf-eyebrow mb-2">Trust · MCP only</p>
      <h1 className="text-3xl font-semibold tracking-tight">Bond & stake</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Stake RITUAL and ping heartbeat through MCP. No browser wallet writes.
      </p>
      <div className="mt-8">
        <McpActionPanel surface="bond" title="Bond MCP tools" />
      </div>
      <p className="mt-6 font-mono text-[11px] text-muted-foreground">
        AgentStaking {CONTRACT_ADDRESSES.agentStaking}
        <br />
        AgentHeartbeat {CONTRACT_ADDRESSES.agentHeartbeat}
      </p>
    </div>
  )
}
