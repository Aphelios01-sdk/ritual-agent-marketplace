import { createPublicClient, http, type Address } from "viem"
import { RITUAL_CHAIN, type AgentInfo, type SkillDefinition, type JobStatus, CONTRACT_ADDRESSES } from "./constants"
import { AGENT_REGISTRY_ABI } from "./contract-abi"
import { JOB_MARKET_V2_ABI } from "./contract-abi-v2"

const RPC = process.env.RITUAL_RPC_URL || RITUAL_CHAIN.rpcUrls.default.http[0]
export const publicClient = createPublicClient({
  chain: RITUAL_CHAIN,
  transport: http(RPC, { timeout: 6_000, retryCount: 1 }),
})

const CONTRACT_ADDR = CONTRACT_ADDRESSES.agentRegistry as Address
const JOB_MARKET_V2 = CONTRACT_ADDRESSES.jobMarketV2 as Address

/** Short in-memory cache so rapid nav between pages reuses the last RPC result. */
const CACHE_TTL_MS = 5_000
type CacheEntry<T> = { at: number; data: T }
let agentsCache: CacheEntry<AgentInfo[]> | null = null
let jobsCache: CacheEntry<OnchainJob[]> | null = null
let chainCache: CacheEntry<{ block: bigint; chainId: number } | null> | null = null

function fromCache<T>(entry: CacheEntry<T> | null): T | null {
  if (!entry) return null
  if (Date.now() - entry.at > CACHE_TTL_MS) return null
  return entry.data
}

function precompileType(addr: Address): "HTTP" | "LLM" {
  const a = addr.toLowerCase()
  if (a === "0x0000000000000000000000000000000000000801") return "HTTP"
  if (a === "0x0000000000000000000000000000000000000802") return "LLM"
  return "HTTP"
}

type RawSkill = {
  skillId: `0x${string}`
  name: string
  description: string
  precompileAddr: Address
  configData: `0x${string}`
  active: boolean
}

type RawAgent = readonly [
  bigint, string, string, Address, bigint, bigint, bigint, bigint, boolean
]

const FIX_DESC_PREFIX: [string, string][] = [
  [
    "Analisis sentimen pasar crypto via HTTP fetch + LLM analysis",
    "Analyzes crypto market sentiment using HTTP fetch + LLM analysis. Provides a daily sentiment summary.",
  ],
]

const JOB_STATUS_ORDER: JobStatus[] = [
  "OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "DISPUTED", "REFUNDED", "CANCELLED",
]

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

export interface OnchainBid {
  provider: `0x${string}`
  price: bigint
  estBlocks: bigint
  submittedAt: bigint
}

function decodeBytesToText(hex: `0x${string}`): string {
  if (!hex || hex === "0x") return ""
  try {
    return Buffer.from(hex.slice(2), "hex").toString("utf8")
  } catch {
    return hex
  }
}

function mapSkills(raw: RawSkill[]): SkillDefinition[] {
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

function mapAgent(id: bigint, raw: RawAgent | Record<string, unknown>, skills: SkillDefinition[]): AgentInfo | null {
  // viem may return tuple array or named object depending on ABI fragment
  const name = (Array.isArray(raw) ? raw[1] : (raw as { name?: string }).name)?.toString()?.trim()
  if (!name) return null
  const rawDesc = (Array.isArray(raw) ? raw[2] : (raw as { description?: string }).description)?.toString()?.trim() || ""
  const description = FIX_DESC_PREFIX.find(([p]) => rawDesc.startsWith(p))?.[1] ?? rawDesc
  const contractAddress = (Array.isArray(raw) ? raw[3] : (raw as { agentContract?: Address }).agentContract) as Address
  const bondAmount = (Array.isArray(raw) ? raw[4] : (raw as { bondAmount?: bigint }).bondAmount) as bigint
  const totalEarnings = (Array.isArray(raw) ? raw[5] : (raw as { totalEarnings?: bigint }).totalEarnings) as bigint
  const avgRatingRaw = Number(Array.isArray(raw) ? raw[6] : (raw as { avgRating?: bigint }).avgRating ?? 0)
  const jobCount = Number(Array.isArray(raw) ? raw[7] : (raw as { jobCount?: bigint }).jobCount ?? 0)
  const active = Boolean(Array.isArray(raw) ? raw[8] : (raw as { active?: boolean }).active)
  return {
    id: id.toString(),
    name,
    description,
    contractAddress,
    skills,
    bondAmount: bondAmount ?? BigInt(0),
    totalEarnings: totalEarnings ?? BigInt(0),
    avgRating: avgRatingRaw / 100,
    jobCount,
    active,
  }
}

function mapJob(
  id: bigint,
  raw: readonly [
    bigint, Address, `0x${string}`, bigint, bigint, number, Address, `0x${string}`, bigint, bigint, bigint
  ],
): OnchainJob | null {
  const statusRaw = raw[5]
  if (raw[1] === "0x0000000000000000000000000000000000000000" || statusRaw >= JOB_STATUS_ORDER.length) {
    return null
  }
  return {
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
  }
}

/** Read all agents in parallel (no multicall — Ritual chain has no multicall3). Cached ~5s. */
export async function fetchAgents(): Promise<AgentInfo[]> {
  const hit = fromCache(agentsCache)
  if (hit) return hit

  try {
    const count = (await publicClient.readContract({
      address: CONTRACT_ADDR,
      abi: AGENT_REGISTRY_ABI,
      functionName: "nextAgentId",
    })) as bigint

    if (count === BigInt(0)) {
      agentsCache = { at: Date.now(), data: [] }
      return []
    }

    const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i + 1))

    // Parallel individual eth_calls — reliable on Ritual (multicall3 not deployed)
    const agentResults = await Promise.all(
      ids.map(async (id) => {
        try {
          const raw = (await publicClient.readContract({
            address: CONTRACT_ADDR,
            abi: AGENT_REGISTRY_ABI,
            functionName: "agents",
            args: [id],
          })) as RawAgent
          return { id, raw }
        } catch {
          return null
        }
      }),
    )

    const skillResults = await Promise.all(
      ids.map(async (id) => {
        try {
          const raw = (await publicClient.readContract({
            address: CONTRACT_ADDR,
            abi: AGENT_REGISTRY_ABI,
            functionName: "getAgentSkills",
            args: [id],
          })) as RawSkill[]
          return raw
        } catch {
          return [] as RawSkill[]
        }
      }),
    )

    const agents: AgentInfo[] = []
    for (let i = 0; i < ids.length; i++) {
      const ar = agentResults[i]
      if (!ar) continue
      const mapped = mapAgent(ar.id, ar.raw, mapSkills(skillResults[i] ?? []))
      if (mapped) agents.push(mapped)
    }

    agentsCache = { at: Date.now(), data: agents }
    return agents
  } catch (e) {
    console.error("fetchAgents failed:", e)
    return fromCache(agentsCache) ?? []
  }
}

export async function fetchChainInfo(): Promise<{ block: bigint; chainId: number } | null> {
  const hit = fromCache(chainCache)
  if (hit !== null) return hit

  try {
    const [block, chainId] = await Promise.all([
      publicClient.getBlockNumber(),
      publicClient.getChainId(),
    ])
    const data = { block, chainId }
    chainCache = { at: Date.now(), data }
    return data
  } catch (e) {
    console.error("fetchChainInfo failed:", e)
    return fromCache(chainCache) ?? null
  }
}

export async function fetchBids(jobId: string): Promise<OnchainBid[]> {
  try {
    const raw = (await publicClient.readContract({
      address: JOB_MARKET_V2,
      abi: JOB_MARKET_V2_ABI,
      functionName: "getBids",
      args: [BigInt(jobId)],
    })) as readonly { provider: Address; price: bigint; estBlocks: bigint; submittedAt: bigint }[]
    return raw.map((b) => ({
      provider: b.provider,
      price: b.price,
      estBlocks: b.estBlocks,
      submittedAt: b.submittedAt,
    }))
  } catch (e) {
    console.error("fetchBids failed:", e)
    return []
  }
}

/** Single job read (no full list). */
export async function fetchJob(id: string): Promise<OnchainJob | null> {
  const cached = fromCache(jobsCache)
  if (cached) {
    const hit = cached.find((j) => j.id === id)
    if (hit) return hit
  }

  try {
    const raw = (await publicClient.readContract({
      address: JOB_MARKET_V2,
      abi: JOB_MARKET_V2_ABI,
      functionName: "jobs",
      args: [BigInt(id)],
    })) as readonly [
      bigint, Address, `0x${string}`, bigint, bigint, number, Address, `0x${string}`, bigint, bigint, bigint
    ]
    return mapJob(BigInt(id), raw)
  } catch (e) {
    console.error("fetchJob failed:", e)
    return null
  }
}

/** Read all jobs in parallel. Cached ~5s. */
export async function fetchJobs(): Promise<OnchainJob[]> {
  const hit = fromCache(jobsCache)
  if (hit) return hit

  try {
    const count = (await publicClient.readContract({
      address: JOB_MARKET_V2,
      abi: JOB_MARKET_V2_ABI,
      functionName: "nextJobId",
    })) as bigint

    if (count === BigInt(0)) {
      jobsCache = { at: Date.now(), data: [] }
      return []
    }

    const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i + 1))
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          return (await publicClient.readContract({
            address: JOB_MARKET_V2,
            abi: JOB_MARKET_V2_ABI,
            functionName: "jobs",
            args: [id],
          })) as readonly [
            bigint, Address, `0x${string}`, bigint, bigint, number, Address, `0x${string}`, bigint, bigint, bigint
          ]
        } catch {
          return null
        }
      }),
    )

    const jobs: OnchainJob[] = []
    for (let i = 0; i < ids.length; i++) {
      const r = results[i]
      if (!r) continue
      const mapped = mapJob(ids[i], r)
      if (mapped) jobs.push(mapped)
    }

    jobsCache = { at: Date.now(), data: jobs }
    return jobs
  } catch (e) {
    console.error("fetchJobs failed:", e)
    return fromCache(jobsCache) ?? []
  }
}
