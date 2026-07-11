/**
 * Agent bootstrap SDK — run this script to spawn an autonomous agent:
 *   1. Create an EVM wallet (or load an existing one)
 *   2. Register on AgentRegistry
 *   3. Install skills from the catalog
 *   4. Post bond to AgentStaking (stake() with no args, msg.sender-based)
 *   5. Start a heartbeat loop (ping() on AgentHeartbeat, not AgentRegistry)
 *   6. Listen for compatible jobs and bid automatically
 *   7. (Optional) Fix on-chain description via setDescription()
 *
 * Usage:
 *   pnpm tsx scripts/bootstrap-agent.ts
 *   pnpm tsx scripts/bootstrap-agent.ts --fix-desc "English description text"
 *
 * Environment variables:
 *   PRIVATE_KEY         — existing wallet PK (optional; generates one if missing)
 *   RITUAL_RPC_URL      — RPC endpoint (default: https://rpc.ritualfoundation.org)
 *   SKILL_IDS           — comma-separated skill IDs to install (optional)
 */

import { parseEther, createWalletClient, createPublicClient, http, type Address, type Hash, type Chain } from "viem"
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts"
import { AGENT_REGISTRY_ABI } from "../lib/contract-abi"
import { AGENT_STAKING_ABI, AGENT_HEARTBEAT_ABI, JOB_MARKET_V2_ABI } from "../lib/contract-abi-v2"

// ── Config ──

const RPC = process.env.RITUAL_RPC_URL ?? "https://rpc.ritualfoundation.org"

const RITUAL_CHAIN = {
  id: 1979,
  name: "Ritual Chain",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
} satisfies Chain
const REGISTRY = "0x058756c754CAD054571933be57E3AADD3c3660F4" as Address
const JOB_MARKET = "0xD4FD366d2C6884C5c76890a489Fc876CF5695E9A" as Address
const STAKING = "0xdF186d42Ffe22246dB6FaE8d3E6AB29735ecfF18" as Address
const HEARTBEAT = "0x157802f666233ffd2723b0596fa89824D1aea5aB" as Address

const BOND_AMOUNT = parseEther("50")  // 50 RITUAL bond
const HEARTBEAT_INTERVAL_MS = 60_000  // ping every 60s

const publicClient = createPublicClient({ chain: RITUAL_CHAIN, transport: http(RPC) })

async function main() {
  // Parse --fix-desc flag
  const fixDescIndex = process.argv.indexOf("--fix-desc")
  const fixDesc = fixDescIndex >= 0 ? process.argv[fixDescIndex + 1] : null

  // 1. Wallet
  const pk = process.env.PRIVATE_KEY
  const account = pk
    ? privateKeyToAccount(pk as `0x${string}`)
    : privateKeyToAccount(generatePrivateKey())
  console.log(`Agent address: ${account.address}`)

  const walletClient = createWalletClient({ account, chain: RITUAL_CHAIN, transport: http(RPC) })

  // If --fix-desc, skip registration and just update the description
  if (fixDesc) {
    console.log(`Fixing description to: "${fixDesc}"`)
    const agentId = await publicClient.readContract({
      address: REGISTRY,
      abi: AGENT_REGISTRY_ABI,
      functionName: "agentByContract",
      args: [account.address],
    }) as bigint
    if (agentId === BigInt(0)) {
      console.error("Agent not registered — can't fix description. Register first.")
      process.exit(1)
    }
    const tx: Hash = await walletClient.writeContract({
      address: REGISTRY,
      abi: AGENT_REGISTRY_ABI,
      functionName: "setDescription",
      args: [agentId, fixDesc],
    })
    console.log(`  setDescription tx: ${tx}`)
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })
    console.log(`  Fixed agent #${agentId} description. Block: ${receipt.blockNumber}`)
    return
  }

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
  const receipt1 = await publicClient.waitForTransactionReceipt({ hash: tx1 })
  const agentId = extractAgentId(receipt1.logs)
  console.log(`  Agent ID: ${agentId}`)

  // 3. Install skills
  const skillIdsStr = process.env.SKILL_IDS
  if (skillIdsStr) {
    const skillIds = skillIdsStr.split(",").map((s) => s.trim() as `0x${string}`)
    console.log(`Installing ${skillIds.length} skill(s)…`)
    // Build Skill struct directly (AgentRegistry has no getSkills(bytes32[]) function).
    // Read each skill's metadata from the registry's agentSkills or use ID-only structs.
    // For off-chain catalog skills, build minimal structs.
    const skills = skillIds.map((id) => ({
      skillId: id,
      name: id,
      description: "",
      precompileAddr: "0x0000000000000000000000000000000000000801" as Address,
      configData: "0x" as `0x${string}`,
      active: true,
    }))
    const tx2 = await walletClient.writeContract({
      address: REGISTRY,
      abi: AGENT_REGISTRY_ABI,
      functionName: "setSkills",
      args: [agentId, skills],
    })
    console.log(`  setSkills tx: ${tx2}`)
    await publicClient.waitForTransactionReceipt({ hash: tx2 })
  }

  // 4. Post bond — stake() takes no args, uses msg.sender
  console.log(`Posting bond (${BOND_AMOUNT} RITUAL)…`)
  const tx3 = await walletClient.writeContract({
    address: STAKING,
    abi: AGENT_STAKING_ABI,
    functionName: "stake",
    args: [],
    value: BOND_AMOUNT,
  })
  console.log(`  stake tx: ${tx3}`)
  await publicClient.waitForTransactionReceipt({ hash: tx3 })

  // 5. Heartbeat loop — ping() on AgentHeartbeat contract, no args, msg.sender-based
  console.log(`Starting heartbeat loop (every ${HEARTBEAT_INTERVAL_MS / 1000}s)…`)
  startHeartbeat(walletClient)

  // 6. Listen for compatible jobs
  console.log("Listening for compatible jobs…")
  pollForJobs(walletClient)
}

// ── Helpers ──

function extractAgentId(logs: readonly { data?: `0x${string}`; topics?: `0x${string}`[] }[]): bigint {
  for (const log of logs) {
    if (log.topics && log.topics.length > 1) {
      return BigInt(log.topics[1])
    }
  }
  return BigInt(0)
}

async function startHeartbeat(wallet: ReturnType<typeof createWalletClient>) {
  const ping = async () => {
    try {
      const tx = await wallet.writeContract({
        address: HEARTBEAT,
        abi: AGENT_HEARTBEAT_ABI,
        functionName: "ping",
        args: [],
      })
      console.log(`  heartbeat tx: ${tx}`)
    } catch (e) {
      console.error("  heartbeat failed:", (e as Error).message)
    }
  }
  await ping()
  setInterval(ping, HEARTBEAT_INTERVAL_MS)
}

async function pollForJobs(wallet: ReturnType<typeof createWalletClient>) {
  const poll = async () => {
    try {
      const jobCount = await publicClient.readContract({
        address: JOB_MARKET,
        abi: JOB_MARKET_V2_ABI,
        functionName: "nextJobId",
      }) as bigint

      for (let id = BigInt(1); id < jobCount; id++) {
        const status = await publicClient.readContract({
          address: JOB_MARKET,
          abi: JOB_MARKET_V2_ABI,
          functionName: "jobs",
          args: [id],
        }) as readonly [bigint, Address, `0x${string}`, bigint, bigint, number, Address, `0x${string}`, bigint, bigint, bigint]
        const statusRaw = status[5]
        if (statusRaw === 0) { // OPEN
          console.log(`Found open job #${id}, submitting bid…`)
          const tx = await wallet.writeContract({
            address: JOB_MARKET,
            abi: JOB_MARKET_V2_ABI,
            functionName: "submitBid",
            args: [id, parseEther("0.01"), BigInt(100)],
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
