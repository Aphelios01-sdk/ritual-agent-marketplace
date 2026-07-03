/**
 * Agent bootstrap SDK — run this script to spawn an autonomous agent:
 *   1. Create an EVM wallet (or load an existing one)
 *   2. Register on AgentRegistry
 *   3. Install skills from the catalog
 *   4. Post bond to AgentStaking
 *   5. Start a heartbeat loop
 *   6. Listen for compatible jobs and bid automatically
 *
 * Usage:
 *   pnpm tsx scripts/bootstrap-agent.ts
 *
 * Environment variables:
 *   PRIVATE_KEY         — existing wallet PK (optional; generates one if missing)
 *   RITUAL_RPC_URL      — RPC endpoint (default: https://rpc.ritualfoundation.org)
 *   SKILL_IDS           — comma-separated skill IDs to install (optional)
 */

import { parseEther, createWalletClient, createPublicClient, http, type Address, type Hash, type Chain } from "viem"
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts"
import { AGENT_REGISTRY_ABI } from "../lib/contract-abi"
import { AGENT_STAKING_ABI, JOB_MARKET_V2_ABI } from "../lib/contract-abi-v2"

// ── Config ──

const RPC = process.env.RITUAL_RPC_URL ?? "https://rpc.ritualfoundation.org"

// Inline chain config — avoids importing constants.ts (which has DOM/BigInt deps not needed here)
const RITUAL_CHAIN = {
  id: 1979,
  name: "Ritual Chain",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
} satisfies Chain
const REGISTRY = "0x9dE50bd72941a418B8346d81F9c7217D5b0E0cF5" as Address
const JOB_MARKET = "0xA7AA5FDC4DcE7036B31b3C57f938832616b27f1A" as Address
const STAKING = "0x8C2Ab37A6e9721fb2dE113acf0AC787eD937DdcB" as Address

const BOND_AMOUNT = parseEther("50")  // 50 RITUAL bond
const HEARTBEAT_INTERVAL_MS = 60_000  // ping every 60s

// ── Clients ──

const publicClient = createPublicClient({ chain: RITUAL_CHAIN, transport: http(RPC) })

async function main() {
  // 1. Wallet
  const pk = process.env.PRIVATE_KEY
  const account = pk
    ? privateKeyToAccount(pk as `0x${string}`)
    : privateKeyToAccount(generatePrivateKey())
  console.log(`Agent address: ${account.address}`)

  const walletClient = createWalletClient({ account, chain: RITUAL_CHAIN, transport: http(RPC) })

  // 2. Register on AgentRegistry
  console.log("Registering agent…")
  const name = `AutoAgent-${account.address.slice(2, 8)}`
  const tx1: Hash = await walletClient.writeContract({
    address: REGISTRY,
    abi: AGENT_REGISTRY_ABI,
    functionName: "registerAgent",
    args: [name, "Autonomous agent spawned by bootstrap script"],
  })
  console.log(`  tx: ${tx1}`)
  const receipt = await publicClient.waitForTransactionReceipt({ hash: tx1 })
  const agentId = extractAgentId(receipt.logs)
  console.log(`  Agent ID: ${agentId}`)

  // 3. Install skills
  const skillIds = parseSkillIds(process.env.SKILL_IDS)
  if (skillIds.length > 0) {
    console.log(`Installing ${skillIds.length} skill(s)…`)
    // Build Skill structs: read from the registry's skill catalog
    const skills = await fetchSkills(skillIds)
    const tx2 = await walletClient.writeContract({
      address: REGISTRY,
      abi: AGENT_REGISTRY_ABI,
      functionName: "setSkills",
      args: [agentId, skills],
    })
    console.log(`  setSkills tx: ${tx2}`)
    await publicClient.waitForTransactionReceipt({ hash: tx2 })
  }

  // 4. Post bond
  console.log(`Posting bond (${BOND_AMOUNT} RITUAL)…`)
  const tx3 = await walletClient.writeContract({
    address: STAKING,
    abi: AGENT_STAKING_ABI,
    functionName: "stake",
    args: [agentId],
    value: BOND_AMOUNT,
  })
  console.log(`  stake tx: ${tx3}`)
  await publicClient.waitForTransactionReceipt({ hash: tx3 })

  // 5. Heartbeat loop
  console.log(`Starting heartbeat loop (every ${HEARTBEAT_INTERVAL_MS / 1000}s)…`)
  startHeartbeat(agentId, walletClient)

  // 6. Listen for compatible jobs
  console.log("Listening for compatible jobs…")
  pollForJobs(agentId, skillIds, walletClient)
}

// ── Helpers ──

function extractAgentId(logs: readonly { data?: `0x${string}`; topics?: `0x${string}`[] }[]): bigint {
  // The AgentRegistered event emits agentId as a topic or in data
  // Fallback: assume first log's first topic is the agent ID
  for (const log of logs) {
    if (log.topics && log.topics.length > 1) {
      return BigInt(log.topics[1])
    }
  }
  return BigInt(0)
}

function parseSkillIds(raw?: string): `0x${string}`[] {
  if (!raw) return []
  return raw.split(",").map((s) => s.trim() as `0x${string}`)
}

async function fetchSkills(ids: `0x${string}`[]): Promise<readonly { skillId: `0x${string}`; name: string; description: string; precompileAddr: Address; configData: `0x${string}`; active: boolean }[]> {
  // Read skills from the registry's on-chain catalog
  const raw: readonly { skillId: `0x${string}`; name: string; description: string; precompileAddr: Address; configData: `0x${string}`; active: boolean }[] = await publicClient.readContract({
    address: REGISTRY,
    abi: AGENT_REGISTRY_ABI,
    functionName: "getSkills",
    args: [ids],
  })
  return raw.filter((s) => s.active)
}

async function startHeartbeat(agentId: bigint, wallet: ReturnType<typeof createWalletClient>) {
  const ping = async () => {
    try {
      const tx = await wallet.writeContract({
        address: REGISTRY,
        abi: AGENT_REGISTRY_ABI,
        functionName: "ping",
        args: [agentId],
      })
      console.log(`  heartbeat tx: ${tx}`)
    } catch (e) {
      console.error("  heartbeat failed:", (e as Error).message)
    }
  }
  await ping()
  setInterval(ping, HEARTBEAT_INTERVAL_MS)
}

async function pollForJobs(agentId: bigint, skillIds: `0x${string}`[], wallet: ReturnType<typeof createWalletClient>) {
  const poll = async () => {
    try {
      const jobCount = await publicClient.readContract({
        address: JOB_MARKET,
        abi: JOB_MARKET_V2_ABI,
        functionName: "nextJobId",
      }) as bigint

      for (let id = BigInt(1); id < jobCount; id++) {
        // Check if compatible (simplified — real agent would match skill requirements)
        const status = await publicClient.readContract({
          address: JOB_MARKET,
          abi: JOB_MARKET_V2_ABI,
          functionName: "getJobStatus",
          args: [id],
        }) as number
        if (status === 0) { // OPEN
          console.log(`Found open job #${id}, submitting bid…`)
          const tx = await wallet.writeContract({
            address: JOB_MARKET,
            abi: JOB_MARKET_V2_ABI,
            functionName: "submitBid",
            args: [id, parseEther("0.01"), BigInt(100)], // price, estBlocks
          })
          console.log(`  bid tx: ${tx}`)
        }
      }
    } catch (e) {
      // Skip transient RPC errors
    }
  }
  setInterval(poll, 15_000)
}

main().catch((e) => {
  console.error("Fatal:", e)
  process.exit(1)
})
