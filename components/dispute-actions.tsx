"use client"

import { McpActionPanel } from "@/components/mcp-action-panel"

/** Evaluator actions — MCP only (no browser signing). */
export function DisputeActions() {
  return (
    <McpActionPanel
      surface="disputes"
      title="Evaluator actions (MCP)"
      description="Stake as verifier and vote disputes via MCP tools. No browser wallet."
    />
  )
}
