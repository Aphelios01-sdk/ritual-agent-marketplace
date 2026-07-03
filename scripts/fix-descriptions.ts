/**
 * Detect Indonesian descriptions stored on-chain in AgentRegistry.
 *
 * The AgentRegistry contract does NOT expose a setDescription function,
 * so on-chain descriptions cannot be updated without a contract upgrade.
 * This script scans all agents and reports any descriptions that match
 * known Indonesian patterns so you can deploy a fix contract.
 *
 * The frontend applies a client-side override in `fetchAgents()` (lib/onchain.ts)
 * so the Indonesian text is never shown to users — this script just audits.
 *
 * Usage:
 *   pnpm tsx scripts/fix-descriptions.ts
 *
 * Environment:
 *   RITUAL_RPC_URL  — RPC endpoint (optional)
 */

import { createPublicClient, http, type Address, type Chain } from "viem"
import { AGENT_REGISTRY_ABI } from "../lib/contract-abi"

const RPC = process.env.RITUAL_RPC_URL ?? "https://rpc.ritualfoundation.org"

const RITUAL_CHAIN = {
  id: 1979,
  name: "Ritual Chain",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
} satisfies Chain

const REGISTRY = "0x9dE50bd72941a418B8346d81F9c7217D5b0E0cF5" as Address

// Keep in sync with lib/onchain.ts FIX_DESC
const INDONESIAN_PATTERNS = [
  "Analisis sentimen pasar crypto via HTTP fetch + LLM analysis",
]

const publicClient = createPublicClient({ chain: RITUAL_CHAIN, transport: http(RPC) })

async function main() {
  const count = (await publicClient.readContract({
    address: REGISTRY,
    abi: AGENT_REGISTRY_ABI,
    functionName: "nextAgentId",
  })) as bigint

  let found = 0
  for (let id = BigInt(1); id <= count; id++) {
    const raw = (await publicClient.readContract({
      address: REGISTRY,
      abi: AGENT_REGISTRY_ABI,
      functionName: "agents",
      args: [id],
    })) as readonly [bigint, string, string, Address, bigint, bigint, bigint, bigint, boolean]

    const desc = raw[2]?.trim() || ""
    const isIndonesian = INDONESIAN_PATTERNS.some((p) => desc.includes(p))

    if (isIndonesian) {
      console.log(`[FOUND] Agent #${id} (${raw[1]}): ${desc}`)
      found++
    }
  }

  if (found === 0) {
    console.log("No Indonesian descriptions found. Clean!")
  } else {
    console.log(`\n${found} agent(s) with Indonesian descriptions.`)
    console.log("Frontend applies client-side override in fetchAgents().")
    console.log("To fix on-chain: deploy an upgrade to AgentRegistry with a setDescription function.")
  }
}

main().catch((e) => {
  console.error("Fatal:", e)
  process.exit(1)
})
