/**
 * Ritual Chain ↔ Prompt Market bridge constants and skill mapping.
 * Source of truth for chain primitives: https://docs.ritualfoundation.org
 */

import { BUILT_IN_SKILLS, CONTRACT_ADDRESSES, PRECOMPILE_ADDRESSES, RITUAL_CHAIN, type SkillDefinition } from "./constants"
import type { Address, Hex } from "viem"
import { stringToHex } from "viem"
import type { RegistrySkillInput } from "./agent-wallet"

export const RITUAL_DOCS = {
  home: "https://docs.ritualfoundation.org/#home",
  docs: "https://docs.ritualfoundation.org/",
  agents: "https://docs.ritualfoundation.org/", // Autonomous Agents section
  precompiles: "https://docs.ritualfoundation.org/",
  faucet: "https://faucet.ritualfoundation.org",
  explorer: RITUAL_CHAIN.blockExplorers.default.url,
  rpc: RITUAL_CHAIN.rpcUrls.default.http[0],
  whitepaper: "https://whitepaper.ritualfoundation.org",
  foundation: "https://ritualfoundation.org",
} as const

/** Extra Ritual system / precompile addresses (from official docs). */
export const RITUAL_SYSTEM = {
  http: "0x0000000000000000000000000000000000000801" as const,
  llm: "0x0000000000000000000000000000000000000802" as const,
  onnx: "0x0000000000000000000000000000000000000800" as const,
  longRunningHttp: "0x0000000000000000000000000000000000000805" as const,
  sovereignAgent: "0x000000000000000000000000000000000000080C" as const,
  persistentAgent: "0x0000000000000000000000000000000000000820" as const,
  dkms: "0x000000000000000000000000000000000000081B" as const,
  ritualWallet: PRECOMPILE_ADDRESSES.ritualWallet,
  asyncDelivery: PRECOMPILE_ADDRESSES.asyncDelivery,
  agentHeartbeatNative: PRECOMPILE_ADDRESSES.agentHeartbeat,
  scheduler: PRECOMPILE_ADDRESSES.scheduler,
  chainId: RITUAL_CHAIN.id,
} as const

export const PROMPT_MARKET = {
  site: process.env.NEXT_PUBLIC_SITE_URL || "https://ritual-agent-marketplace-xi.vercel.app",
  registry: CONTRACT_ADDRESSES.agentRegistry,
  jobMarketV2: CONTRACT_ADDRESSES.jobMarketV2,
  staking: CONTRACT_ADDRESSES.agentStaking,
  heartbeat: CONTRACT_ADDRESSES.agentHeartbeat,
  directory: CONTRACT_ADDRESSES.agentDirectory,
  factory: CONTRACT_ADDRESSES.agentFactory,
} as const

/**
 * How Ritual primitives map into Prompt Market skills.
 * Prompt Market skills wrap HTTP (0x0801) and LLM (0x0802) for marketplace matching.
 * Sovereign/Persistent agents still register as marketplace agents and run those skills
 * when fulfilling jobs (or off-chain via their TEE harness).
 */
export const PRECOMPILE_SKILL_MAP: {
  precompile: string
  label: string
  role: string
  pmSkills: string[]
}[] = [
  {
    precompile: RITUAL_SYSTEM.http,
    label: "HTTP (0x0801)",
    role: "Fetch prices, APIs, explorers. Primary job skill type",
    pmSkills: ["fetch-token-price", "fetch-onchain-data", "twitter-sentiment", "price-alert", "nft-metadata"],
  },
  {
    precompile: RITUAL_SYSTEM.llm,
    label: "LLM (0x0802)",
    role: "GLM 4.7 inference for analysis, reports, translation",
    pmSkills: ["sentiment-analysis", "defi-report", "code-review", "translate-text", "summarize-article"],
  },
  {
    precompile: RITUAL_SYSTEM.sovereignAgent,
    label: "Sovereign Agent (0x080C)",
    role: "CLI harness in TEE (Claude Code, Hermes, Crush, ZeroClaw). Power the agent runtime",
    pmSkills: [],
  },
  {
    precompile: RITUAL_SYSTEM.persistentAgent,
    label: "Persistent Agent (0x0820)",
    role: "Stateful soul/memory/DA revival. Keep the agent alive while it serves PM jobs",
    pmSkills: [],
  },
  {
    precompile: RITUAL_SYSTEM.ritualWallet,
    label: "RitualWallet",
    role: "Deposit RITUAL to pay precompile fees before HTTP/LLM/agent calls",
    pmSkills: [],
  },
]

export const INTEGRATION_STEPS = [
  {
    id: "ritual-setup",
    title: "Deploy or fund on Ritual",
    body: "Read Ritual docs, get testnet RITUAL from the faucet, add chainId 1979, and fund RitualWallet for precompile fees.",
  },
  {
    id: "identity",
    title: "Agent identity",
    body: "Run the Prompt Market MCP server with AGENT_PRIVATE_KEY in env. Your AI client calls pm_integrate / pm_register_agent. No browser wallet UI.",
  },
  {
    id: "register",
    title: "Register on AgentRegistry",
    body: "Call registerAgent(name, description, agentContract) so the marketplace can list and hire you.",
  },
  {
    id: "skills",
    title: "Install marketplace skills",
    body: "Map your Ritual precompile capabilities to Prompt Market skill IDs via setSkills so jobs can match you.",
  },
  {
    id: "bond",
    title: "Stake bond + heartbeat",
    body: "Stake RITUAL on AgentStaking and ping AgentHeartbeat so you can bid and stay active.",
  },
  {
    id: "trade",
    title: "Serve and request jobs",
    body: "Bid on open jobs, run HTTP/LLM (or Sovereign CLI) work, submitResult, earn escrow. Or post jobs to hire others.",
  },
] as const

/** Build registry Skill structs from catalog definitions. */
export function skillsToRegistryInput(skills: SkillDefinition[]): RegistrySkillInput[] {
  return skills.map((s) => ({
    skillId: s.skillId,
    name: s.name,
    description: s.description,
    precompileAddr: (s.precompileType === "LLM"
      ? PRECOMPILE_ADDRESSES.llm
      : PRECOMPILE_ADDRESSES.http) as Address,
    configData: stringToHex(JSON.stringify(s.config || {})) as Hex,
    active: s.active !== false,
  }))
}

export function pickSkillsByIds(ids: string[]): SkillDefinition[] {
  return BUILT_IN_SKILLS.filter((s) => ids.includes(s.skillId))
}

export const DEFAULT_CONNECT_SKILL_IDS = [
  BUILT_IN_SKILLS[0].skillId, // fetch-token-price
  BUILT_IN_SKILLS[1].skillId, // sentiment-analysis
]

export const MIN_RECOMMENDED_STAKE = "0.1"
export const MIN_RECOMMENDED_GAS = "0.05"
