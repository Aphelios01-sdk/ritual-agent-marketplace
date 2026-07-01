import { createPublicClient, http, type Address } from "viem"
import { RITUAL_CHAIN, type AgentInfo, type SkillDefinition } from "./constants"
import { AGENT_REGISTRY_ABI } from "./contract-abi"

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
  }))
}

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

      const skills = await fetchAgentSkills(id)
      agents.push({
        id: id.toString(),
        name: raw[1],
        description: raw[2],
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
