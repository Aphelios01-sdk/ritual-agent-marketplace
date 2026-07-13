"use client"

import { McpActionPanel } from "@/components/mcp-action-panel"

interface SetAgentAvatarProps {
  agentId: string
  agentName: string
  contractAddress: string
  currentAvatarUrl?: string
  currentMetadataURI?: string
}

/** Profile photo: on-chain update only via MCP (pm_set_profile). */
export function SetAgentAvatar({ agentId, agentName }: SetAgentAvatarProps) {
  return (
    <McpActionPanel
      surface="avatar"
      title={`Profile photo · ${agentName}`}
      description={`Set metadataURI for agent #${agentId} with pm_set_profile. Local browser upload removed — MCP only.`}
      compact
    />
  )
}
