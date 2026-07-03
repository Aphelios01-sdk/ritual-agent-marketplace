import { createPublicClient, http, type Address } from "viem"
import { RITUAL_CHAIN, type AgentInfo, type SkillDefinition, type JobStatus } from "./constants"
import { AGENT_REGISTRY_ABI } from "./contract-abi"
import { JOB_MARKET_V2_ABI } from "./contract-abi-v2"

// Public client to read on-chain state (without a wagmi provider)
export const publicClient = createPublicClient({
  chain: RITUAL_CHAIN,
  transport: http(),
})

import { CONTRACT_ADDRESSES } from "./constants"
const CONTRACT_ADDR = CONTRACT_ADDRESSES.agentRegistry as Address

// Map a precompile address -> skill type
function precompileType(addr: Address): "HTTP" | "LLM" {
  const a = addr.toLowerCase()
  if (a === "0x0000000000000000000000000000000000000801") return "HTTP"
  if (a === "0x0000000000000000000000000000000000000802") return "LLM"
  return "HTTP"
}

// On-chain Skill struct (viem decodes to an array of objects)
type RawSkill = {
  skillId: `0x${string}`
  name: string
  description: string
  precompileAddr: Address
  configData: `0x${string}`
  active: boolean
}

// On-chain AgentInfo struct — mapping getter returns a tuple (viem)
// (id, name, description, agentContract, bondAmount, totalEarnings, avgRating, jobCount, active)
type RawAgent = readonly [
  bigint, string, string, Address, bigint, bigint, bigint, bigint, boolean
]

async function fetchAgentSkills(agentId: bigint): Promise<SkillDefinition[]> {
  const raw = (await publicClient.readContract({
    address: CONTRACT_ADDR,
    abi: AGENT_REGISTRY_ABI,
    functionName: "getAgentSkills",
    args: [agentId],
  })) as RawSkill[]

  return raw.map((s) => ({
    skillId: s.skillId,
    name: s.name,
    description: s.description,
    precompileType: precompileType(s.precompileAddr),
    config: {},
    active: s.active,
    source: "official" as const,
  }))
}

// Client-side override for on-chain descriptions that contain Indonesian text.
// These were stored on-chain before the i18n fix. Uses prefix match because
// the exact on-chain string may differ from what we assume.
const FIX_DESC_PREFIX: [string, string][] = [
  ["Analisis sentimen pasar crypto via HTTP fetch + LLM analysis",
   "Analyzes crypto market sentiment using HTTP fetch + LLM analysis. Provides a daily sentiment summary."],
]

/// Read all agents from the on-chain Registry. Falls back to [] on RPC error.
export async function fetchAgents(): Promise<AgentInfo[]> {
  try {
    const count = (await publicClient.readContract({
      address: CONTRACT_ADDR,
      abi: AGENT_REGISTRY_ABI,
      functionName: "nextAgentId",
    })) as bigint

    if (count === BigInt(0)) return []

    const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i + 1))

    const agents: AgentInfo[] = []
    for (const id of ids) {
      const raw = (await publicClient.readContract({
        address: CONTRACT_ADDR,
        abi: AGENT_REGISTRY_ABI,
        functionName: "agents",
        args: [id],
      })) as RawAgent

      const name = raw[1]?.trim()
      if (!name) continue // skip zombie entries with no name

      // Client-side override for on-chain descriptions that leaked Indonesian.
      // The actual fix requires an on-chain transaction via the agent SDK.
      const rawDesc = raw[2]?.trim() || ""
      const description = FIX_DESC_PREFIX.find(([p]) => rawDesc.startsWith(p))?.[1] ?? rawDesc

      const skills = await fetchAgentSkills(id)
      agents.push({
        id: id.toString(),
        name,
        description,
        contractAddress: raw[3],
        skills,
        bondAmount: raw[4],
        totalEarnings: raw[5],
        avgRating: Number(raw[6]) / 100, // scaled *100 on-chain
        jobCount: Number(raw[7]),
        active: raw[8],
      })
    }
    return agents
  } catch (e) {
    console.error("fetchAgents failed:", e)
    return []
  }
}

/// Read live chain info (block number + chain id). Falls back to null on RPC error.
export async function fetchChainInfo(): Promise<{ block: bigint; chainId: number } | null> {
  try {
    const [block, chainId] = await Promise.all([
      publicClient.getBlockNumber(),
      publicClient.getChainId(),
    ])
    return { block, chainId }
  } catch (e) {
    console.error("fetchChainInfo failed:", e)
    return null
  }
}

// On-chain JobStatus enum order (must match JobMarketV2.JobStatus).
const JOB_STATUS_ORDER: JobStatus[] = ["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "DISPUTED", "REFUNDED", "CANCELLED"]

export interface OnchainJob {
  id: string
  requester: `0x${string}`
  provider: `0x${string}`
  reward: bigint
  bondRequired: bigint
  status: JobStatus
  statusRaw: number
  deadline: bigint
  taskData: string
  resultData: string
  rating: number
}

const JOB_MARKET_V2 = CONTRACT_ADDRESSES.jobMarketV2 as Address

function decodeBytesToText(hex: `0x${string}`): string {
  if (!hex || hex === "0x") return ""
  try {
    const str = Buffer.from(hex.slice(2), "hex").toString("utf8")
    // Heuristic: if it parses as JSON-ish or is mostly printable, return it
    return str
  } catch {
    return hex
  }
}

export interface OnchainBid {
  provider: `0x${string}`
  price: bigint
  estBlocks: bigint
  submittedAt: bigint
}

/// Read bids for a job. Falls back to [] on RPC error.
export async function fetchBids(jobId: string): Promise<OnchainBid[]> {
  try {
    const raw = (await publicClient.readContract({
      address: JOB_MARKET_V2,
      abi: JOB_MARKET_V2_ABI,
      functionName: "getBids",
      args: [BigInt(jobId)],
    })) as readonly { provider: Address; price: bigint; estBlocks: bigint; submittedAt: bigint }[]
    return raw.map((b) => ({ provider: b.provider, price: b.price, estBlocks: b.estBlocks, submittedAt: b.submittedAt }))
  } catch (e) {
    console.error("fetchBids failed:", e)
    return []
  }
}

/// Read a single job by id. Returns null if not found / RPC error.
export async function fetchJob(id: string): Promise<OnchainJob | null> {
  const all = await fetchJobs()
  return all.find((j) => j.id === id) ?? null
}
export async function fetchJobs(): Promise<OnchainJob[]> {
  try {
    const count = (await publicClient.readContract({
      address: JOB_MARKET_V2,
      abi: JOB_MARKET_V2_ABI,
      functionName: "nextJobId",
    })) as bigint

    if (count === BigInt(0)) return []

    const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i + 1))
    const jobs: OnchainJob[] = []

    for (const id of ids) {
      const raw = (await publicClient.readContract({
        address: JOB_MARKET_V2,
        abi: JOB_MARKET_V2_ABI,
        functionName: "jobs",
        args: [id],
      })) as readonly [
        bigint, Address, `0x${string}`, bigint, bigint, number, Address, `0x${string}`, bigint, bigint, bigint
      ]

      const statusRaw = raw[5]
      // Skip zombie jobs (requester is zero address or status is out of range)
      if (raw[1] === "0x0000000000000000000000000000000000000000" || statusRaw >= JOB_STATUS_ORDER.length) continue

      jobs.push({
        id: id.toString(),
        requester: raw[1],
        provider: raw[6],
        reward: raw[3],
        bondRequired: raw[4],
        status: JOB_STATUS_ORDER[statusRaw] ?? "OPEN",
        statusRaw,
        deadline: raw[8],
        taskData: decodeBytesToText(raw[2]),
        resultData: decodeBytesToText(raw[7]),
        rating: Number(raw[9] ?? 0),
      })
    }
    return jobs
  } catch (e) {
    console.error("fetchJobs failed:", e)
    return []
  }
}
