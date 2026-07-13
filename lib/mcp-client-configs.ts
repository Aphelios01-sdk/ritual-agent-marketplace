/**
 * Client config snippets for Ritual Agentry MCP server.
 * Used by /integrate UI. keep secrets as placeholders only.
 */

export type McpClientId =
  | "claude"
  | "cursor"
  | "hermes"
  | "openclaw"
  | "ritual"
  | "mcporter"
  | "cli"

export function mcpEnv(agentKey = "0xYOUR_AGENT_KEY") {
  return {
    AGENT_PRIVATE_KEY: agentKey,
    RITUAL_RPC_URL: "https://rpc.ritualfoundation.org",
  }
}

/** Shared stdio block: command + args + env */
export function stdioServer(serverPath: string, agentKey?: string) {
  return {
    command: "node",
    args: [serverPath],
    env: mcpEnv(agentKey),
  }
}

export function claudeDesktopJson(serverPath: string, agentKey?: string) {
  return JSON.stringify(
    {
      mcpServers: {
        "ritual-agentry": stdioServer(serverPath, agentKey),
      },
    },
    null,
    2,
  )
}

export function cursorMcpJson(serverPath: string, agentKey?: string) {
  return claudeDesktopJson(serverPath, agentKey)
}

/** Hermes: ~/.hermes/config.yaml under mcp_servers */
export function hermesYaml(serverPath: string, agentKey?: string) {
  const env = mcpEnv(agentKey)
  return `# ~/.hermes/config.yaml. merge under mcp_servers
mcp_servers:
  ritual-agentry:
    command: node
    args:
      - ${serverPath} env: AGENT_PRIVATE_KEY: "${env.AGENT_PRIVATE_KEY}" RITUAL_RPC_URL: "${env.RITUAL_RPC_URL}"
`
}

/** OpenClaw CLI add + config file shape (mcp.servers) */
export function openclawAddCommand(serverPath: string, agentKey?: string) {
  const env = mcpEnv(agentKey)
  return `# Add Ritual Agentry as OpenClaw managed MCP server
openclaw mcp add ritual-agentry \\
  --command node \\
  --arg "${serverPath}" \\
  --env AGENT_PRIVATE_KEY=${env.AGENT_PRIVATE_KEY} \\
  --env RITUAL_RPC_URL=${env.RITUAL_RPC_URL} # Probe
openclaw mcp doctor ritual agentry --probe
openclaw mcp tools ritual agentry
`
}

export function openclawJson(serverPath: string, agentKey?: string) {
  const env = mcpEnv(agentKey)
  return JSON.stringify(
    {
      mcp: {
        servers: {
          "ritual-agentry": {
            command: "node",
            args: [serverPath],
            env: {
              AGENT_PRIVATE_KEY: env.AGENT_PRIVATE_KEY,
              RITUAL_RPC_URL: env.RITUAL_RPC_URL,
            },
          },
        },
      },
    },
    null,
    2,
  )
}

/**
 * Ritual Agentry agent worker:
 * - EOA must match on chain agent (register via pm_integrate)
 * - Optional soul/memory for Sovereign or Persistent agent loops (docs.ritualfoundation.org)
 */
export function ritualAgentYaml(serverPath: string, agentKey?: string) {
  const env = mcpEnv(agentKey)
  return `# ritual agent.yaml. worker for agents listed on Ritual Agentry
# AGENT_PRIVATE_KEY must be the same EOA registered as agentContract.

agent:
  name: "RitualAgent"
  chain_id: 1979
  rpc: ${env.RITUAL_RPC_URL} # Fund this address (faucet) for gas + stake + RitualWallet precompile fees # address: derived from AGENT_PRIVATE_KEY mcp: ritual-agentry: command: node args: ["${serverPath}"] env: AGENT_PRIVATE_KEY: "${env.AGENT_PRIVATE_KEY}" RITUAL_RPC_URL: "${env.RITUAL_RPC_URL}" # Bootstrap on first run (AI client should call these tools):
# pm_status
# pm_integrate name="RitualAgent" stake_amount="0.1"
# pm_set_profile metadata_uri="https://…/avatar.png"
# Loop (ASP):
# pm_list_jobs status=OPEN → pm_submit_bid → pm_start_processing → pm_submit_result # Optional: Ritual Sovereign / Persistent runtime (docs.ritualfoundation.org)
# harness: openclaw | hermes | claude code | crush
# precompile:
# sovereign: "0x000000000000000000000000000000000000080C"
# persistent: "0x0000000000000000000000000000000000000820"
`
}

export function ritualAgentBootstrapSh(serverPath: string) {
  return `#!/usr/bin/env bash
# bootstrap-ritual-agent.sh. wire a marketplace agent to MCP
set -euo pipefail
export RITUAL_RPC_URL="\${RITUAL_RPC_URL:-https://rpc.ritualfoundation.org}"
: "\${AGENT_PRIVATE_KEY:?set AGENT_PRIVATE_KEY to the agent EOA private key}" REPO="\$(cd "\$(dirname "$0")/.." && pwd)"
SERVER="\${SERVER:-${serverPath}}"
# If relative, prefer repo mcp/server.mjs
if [[ ! -f "\$SERVER" ]]; then
  SERVER="\$REPO/mcp/server.mjs"
fi

echo "Starting Ritual Agentry MCP: \$SERVER"
exec node "\$SERVER"
`
}

export function mcporterAdd(serverPath: string, agentKey?: string) {
  const env = mcpEnv(agentKey)
  return `mcporter config add ritual-agentry \\ --command node \\ --arg "${serverPath}" \\
  --env AGENT_PRIVATE_KEY=${env.AGENT_PRIVATE_KEY} \\
  --env RITUAL_RPC_URL=${env.RITUAL_RPC_URL}`
}

export function cliSmoke() {
  return `export AGENT_PRIVATE_KEY=0x…
export RITUAL_RPC_URL=https://rpc.ritualfoundation.org
pnpm mcp
# stdio MCP. Attach from Hermes / OpenClaw / Claude / Cursor`
}

export const CLIENT_TABS: { id: McpClientId; label: string; blurb: string }[] = [
  { id: "hermes", label: "Hermes", blurb: "~/.hermes/config.yaml · mcp_servers" },
  { id: "openclaw", label: "OpenClaw", blurb: "openclaw mcp add · mcp.servers" },
  { id: "ritual", label: "Ritual agent", blurb: "Ritual Agentry agent worker + soul loop" },
  { id: "claude", label: "Claude Desktop", blurb: "claude_desktop_config.json" },
  { id: "cursor", label: "Cursor / Grok", blurb: "mcp.json" },
  { id: "mcporter", label: "mcporter", blurb: "CLI registry" },
  { id: "cli", label: "CLI", blurb: "pnpm mcp smoke" },
]
