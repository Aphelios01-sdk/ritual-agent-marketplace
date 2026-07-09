/**
 * Audit + fix on-chain Indonesian descriptions in AgentRegistry.
 *
 * Audits: scans all agents and reports descriptions matching Indonesian prefixes.
 * Fix:    with --fix, sends a setDescription transaction for each matching agent.
 *         Requires PRIVATE_KEY env var (the agent's own key or registry owner).
 *
 * Usage:
 *   pnpm tsx scripts/fix-descriptions.ts              # audit only
 *   pnpm tsx scripts/fix-descriptions.ts --fix        # audit + fix on-chain
 *
 * Environment:
 *   RITUAL_RPC_URL  — RPC endpoint (optional)
 *   PRIVATE_KEY     — agent's private key (required for --fix)
 */

import { createPublicClient, createWalletClient, http, type Address, type Chain } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { AGENT_REGISTRY_ABI } from "../lib/contract-abi"

const RPC = process.env.RITUAL_RPC_URL ?? "https://rpc.ritualfoundation.org"

const RITUAL_CHAIN = {
  id: 1979,
  name: "Ritual Chain",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
} satisfies Chain

const REGISTRY = "0x058756c754CAD054571933be57E3AADD3c3660F4" as Address

// Map of Indonesian prefixes → English replacement text
const REPLACEMENTS: [string, string][] = [
  ["Analisis sentimen pasar crypto via HTTP fetch + LLM analysis",
   "Analyzes crypto market sentiment using HTTP fetch + LLM analysis. Provides a daily sentiment summary."],
]

const publicClient = createPublicClient({ chain: RITUAL_CHAIN, transport: http(RPC) })

async function main() {
  const doFix = process.argv.includes("--fix")
  const pk = process.env.PRIVATE_KEY

  const count = (await publicClient.readContract({
    address: REGISTRY,
    abi: AGENT_REGISTRY_ABI,
    functionName: "nextAgentId",
  })) as bigint

  let found = 0
  const toFix: { id: bigint; desc: string; replacement: string }[] = []

  for (let id = BigInt(1); id <= count; id++) {
    const raw = (await publicClient.readContract({
      address: REGISTRY,
      abi: AGENT_REGISTRY_ABI,
      functionName: "agents",
      args: [id],
    })) as readonly [bigint, string, string, Address, bigint, bigint, bigint, bigint, boolean]

    const desc = raw[2]?.trim() || ""
    const match = REPLACEMENTS.find(([p]) => desc.startsWith(p))
    if (match) {
      console.log(`[FOUND] Agent #${id} (${raw[1]}): ${desc.slice(0, 60)}…`)
      found++
      toFix.push({ id, desc, replacement: match[1] })
    }
  }

  if (found === 0) {
    console.log("No Indonesian descriptions found. Clean!")
    return
  }

  console.log(`\n${found} agent(s) with Indonesian descriptions.`)

  if (!doFix || !pk) {
    console.log("To fix on-chain: pnpm tsx scripts/fix-descriptions.ts --fix (requires PRIVATE_KEY)")
    return
  }

  // Fix: send setDescription for each matching agent
  console.log("\nFixing descriptions on-chain…")
  const account = privateKeyToAccount(pk as `0x${string}`)
  const walletClient = createWalletClient({ account, chain: RITUAL_CHAIN, transport: http(RPC) })

  for (const item of toFix) {
    try {
      const tx = await walletClient.writeContract({
        address: REGISTRY,
        abi: AGENT_REGISTRY_ABI,
        functionName: "setDescription",
        args: [item.id, item.replacement],
      })
      console.log(`  Agent #${item.id} → ${tx}`)
      await publicClient.waitForTransactionReceipt({ hash: tx })
      console.log(`  ✓ Fixed agent #${item.id}`)
    } catch (e) {
      console.error(`  ✗ Agent #${item.id} failed:`, (e as Error).message)
      console.log("    (setDescription requires msg.sender == agent's own contract address)")
    }
  }

  console.log("\nDone.")
}

main().catch((e) => {
  console.error("Fatal:", e)
  process.exit(1)
})
